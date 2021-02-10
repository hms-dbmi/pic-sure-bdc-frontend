define(["backbone", "handlebars", "text!studyAccess/studyAccess.hbs", "text!studyAccess/studies-data.json", "common/transportErrors", "picSure/queryBuilder"],
    function(BB, HBS, studyAccessTemplate, studyAccessConfiguration, transportErrors, queryBuilder){

        var studyAccess = {
            freezeMsg: "(Current TOPMed data is Freeze5b)",
            open_cnts: {studies: "60", participants: "248,614"},
            auth_cnts: {studies: "??", participants: "??,???"}
        };

        studyAccess.studyAccessTemplate = HBS.compile(studyAccessTemplate);
        studyAccess.configurationData = JSON.parse(studyAccessConfiguration);

        // build the model/collection
        var studyAccessModel = BB.Model.extend({
            abbreviated_name: '[N/A]',
            full_study_name: '[N/A]',
            clinical_sample_size: 0,
            clinical_variable_count: 0,
            consent_group_name: '[N/A]',
            data_type: '-',
            genetic_sample_size: 0,
            study_phase: '-',
            study_version: '-',
            request_access: ''
        });
        var studyAccessCollection = BB.Collection.extend({
            model: studyAccessModel,
            modelId: function(attrs) {
                return attrs.study_identifier + '.' + attrs.consent_group_code;
            }
        });

        // extract the consent identifiers from the query template
        var session = JSON.parse(sessionStorage.getItem("session"));
        if (session.queryTemplate === undefined ) {
            var validConsents = [];
        } else {
            var temp = JSON.parse(session.queryTemplate);

            if (temp.categoryFilters === undefined || temp.categoryFilters["\\_consents\\"] === undefined) {
                var validConsents = [];
            } else {
                var validConsents = temp.categoryFilters["\\_consents\\"];
            }
        }
        // process the study data into permission granted or not groups
        var records = [];
        for (groupid in studyAccess.configurationData) {
            for (idx = 0; idx < studyAccess.configurationData[groupid].length; idx++) {
                // determine if logged in user is permmited access
                var tmpStudy = studyAccess.configurationData[groupid][idx];
                tmpStudy["clinical_variable_count"] = parseInt(tmpStudy["clinical_variable_count"]).toLocaleString();
                tmpStudy["clinical_sample_size"] = parseInt(tmpStudy["clinical_sample_size"]).toLocaleString();
                tmpStudy["genetic_sample_size"] = parseInt(tmpStudy["genetic_sample_size"]).toLocaleString();
                var studyConsent = tmpStudy["study_identifier"] + "." + tmpStudy["consent_group_code"]
                if (validConsents.includes(studyConsent)) {
                    tmpStudy["disp_group"] = "permitted";
                } else {
                    if (tmpStudy["consent_group_code"] == "c0") {
                        tmpStudy["disp_group"] = "na";
                    } else {
                        tmpStudy["disp_group"] = "denied";
                    }
                }
                records.push(tmpStudy);
            }
        }

        // count the number of studies (accessable and total)
        var temp = records.map((rec) => { return rec.study_identifier; });
        temp = [...new Set(temp)];
        studyAccess.open_cnts.studies = temp.length;
        var temp = records.filter((rec) => { return rec.disp_group === "permitted" }).map((rec) => { return rec.study_identifier; });
        temp = [...new Set(temp)];
        studyAccess.auth_cnts.studies = temp.length;

        // count the number of participants user can query
        var query = queryBuilder.createQuery({});
        query.query.expectedResultType = "COUNT";
        query.resourceCredentials = {};
        $.ajax({
            url: window.location.origin + "/picsure/query/sync",
            type: 'POST',
            headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
            contentType: 'application/json',
            data: JSON.stringify(query),
            success: function(response){
                studyAccess.auth_cnts.participants = parseInt(response).toLocaleString();
                studyAccess.View.render();
            }
        });

        // build the collection's models
        studyAccess.Collection = new studyAccessCollection(records);

        // function for hiding/displaying c0 consents list
        studyAccess.keystrokeConsentC0 = function(event) {
        };
        
        // build view
        studyAccess.View = new (BB.View.extend({
            tagName: "div",
            template: studyAccess.studyAccessTemplate,
            initialize: function(){},
            events:{
                "click .study-lst-btn1": "toggleConsent",
                "click .study-lst-btn2": "toggleConsent"
            },
            toggleConsent: function() {
                if ($("#no-consent-toggle").hasClass("glyphicon-chevron-down")) {
                    $(".no-consent-row").show();
                    $("#no-consent-toggle").removeClass("glyphicon-chevron-down");
                    $("#no-consent-toggle").addClass("glyphicon-chevron-up");
                } else {
                    $(".no-consent-row").hide();
                    $("#no-consent-toggle").removeClass("glyphicon-chevron-up");
                    $("#no-consent-toggle").addClass("glyphicon-chevron-down");
                }
            },
            render: function() {
                var modelData = this.model.toJSON();

                // break into our 3 display groups
                var outputData = {
                    permitted: modelData.filter(function(rec) { return rec.disp_group === "permitted"; }),
                    denied: modelData.filter(function(rec) { return rec.disp_group === "denied"; }),
                    na: modelData.filter(function(rec) { return rec.disp_group === "na"; })
                };
                // sort by "consent group" then "abbreviated name"
                var funcSort = function (a, b) {
                    if (a["abbreviated_name"] == b["abbreviated_name"]) {
                        return (a["consent_group_name"] > b["consent_group_name"]);
                    } else {
                        return (a["abbreviated_name"] > b["abbreviated_name"]);
                    }
                };
                outputData.permitted.sort(funcSort);
                outputData.denied.sort(funcSort);
                outputData.na.sort(funcSort);

                // get counts for studies and participants
                outputData["auth_studies_cnt"] = studyAccess.auth_cnts.studies;
                outputData["open_studies_cnt"] = studyAccess.open_cnts.studies;
                outputData["auth_participants_cnt"] = studyAccess.auth_cnts.participants;
                outputData["open_participants_cnt"] = studyAccess.open_cnts.participants;
                outputData["freeze_msg"] = studyAccess.freezeMsg;

                this.$el.html(studyAccess.studyAccessTemplate(outputData));
            }
        }))({
            model: studyAccess.Collection
        });


        studyAccess.addHeaderTab = function() {
            // inject button and click handler
            $('<a class="col-md-2 btn btn-default header-btn" id="data-access-btn" href="#">Data Access</a>').insertAfter("#user-profile-btn");
            $('#data-access-btn').click(function(e){
                studyAccess.displayPage();
                e.currentTarget.blur();
            }.bind(this));
        }.bind(studyAccess);

        studyAccess.displayPage = function() {
            studyAccess.View.render();
            $('#main-content').empty().append(studyAccess.View.$el);
        };

        studyAccess.View.render();

        return studyAccess;
    });
