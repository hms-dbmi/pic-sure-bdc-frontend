define(["backbone", "handlebars", "text!studyAccess/studyAccess.hbs", "text!studyAccess/studies-data.json", "common/transportErrors", "picSure/queryBuilder"],
    function(BB, HBS, studyAccessTemplate, studyAccessConfiguration, transportErrors, queryBuilder){

        var studyAccess = {
            freezeMsg: "(Current TOPMed data is Freeze5b)",
            open_cnts: {studies: "60", participants: "248,614"},
            auth_cnts: {studies: "??", participants: "??,???"},
            resources: {
                auth: "02e23f52-f354-4e8b-992c-d37c8b9ba140",
                open: false
            }
        };

        // build view
        studyAccess.View = BB.View.extend({
            tagName: "div",
            template: studyAccess.studyAccessTemplate,
            initialize: function(){
                // setup the output template
                this.template = HBS.compile(studyAccessTemplate);

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
                this.records = {
                    permitted: [],
                    denied: [],
                    na: []
                };
                var configurationData = JSON.parse(studyAccessConfiguration);
                for (groupid in configurationData) {
                    for (idx = 0; idx < configurationData[groupid].length; idx++) {
                        // determine if logged in user is permmited access
                        var tmpStudy = configurationData[groupid][idx];
                        tmpStudy["clinical_variable_count"] = parseInt(tmpStudy["clinical_variable_count"]).toLocaleString();
                        tmpStudy["clinical_sample_size"] = parseInt(tmpStudy["clinical_sample_size"]).toLocaleString();
                        tmpStudy["genetic_sample_size"] = parseInt(tmpStudy["genetic_sample_size"]).toLocaleString();
                        var studyConsent = tmpStudy["study_identifier"] + "." + tmpStudy["consent_group_code"]
                        if (validConsents.includes(studyConsent)) {
                            this.records.permitted.push(tmpStudy);
                        } else {
                            if (tmpStudy["consent_group_code"] == "c0") {
                                this.records.na.push(tmpStudy);
                            } else {
                                this.records.denied.push(tmpStudy);
                            }
                        }
                    }
                }

                // sort by "consent group" then "abbreviated name"
                var funcSort = function (a, b) {
                    if (a["abbreviated_name"] == b["abbreviated_name"]) {
                        return (a["consent_group_name"] > b["consent_group_name"]);
                    } else {
                        return (a["abbreviated_name"] > b["abbreviated_name"]);
                    }
                };
                this.records.permitted.sort(funcSort);
                this.records.denied.sort(funcSort);
                this.records.na.sort(funcSort);

                // count the number of studies (accessible and total)
                var temp = records.map((rec) => { return rec.study_identifier; });
                temp = [...new Set(temp)];
                studyAccess.open_cnts.studies = temp.length;
                var temp = records.filter((rec) => { return rec.disp_group === "permitted" }).map((rec) => { return rec.study_identifier; });
                temp = [...new Set(temp)];
                studyAccess.auth_cnts.studies = temp.length;
                
                // query for participant counts of authorized and open access resources
                if (studyAccess.resources.auth !== false) {
                    var query = queryBuilder.createQuery({});
                    query.query.expectedResultType = "COUNT";
                    query.resourceCredentials = {};
                    query.resourceUUID = studyAccess.resources.auth;
                    $.ajax({
                        url: window.location.origin + "/picsure/query/sync",
                        type: 'POST',
                        headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                        contentType: 'application/json',
                        data: JSON.stringify(query),
                        success: (function(response){
                            studyAccess.auth_cnts.participants = parseInt(response).toLocaleString();
                            this.render();
                        }).bind(this)
                    });
                }
                if (studyAccess.resources.open !== false) {
                    query.resourceUUID = studyAccess.resources.open;
                    $.ajax({
                        url: window.location.origin + "/picsure/query/sync",
                        type: 'POST',
                        headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                        contentType: 'application/json',
                        data: JSON.stringify(query),
                        success: (function (response) {
                            studyAccess.open_cnts.participants = parseInt(response).toLocaleString();
                            this.render();
                        }).bind(this)
                    });
                }
            },
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
                // get counts for studies and participants
                this.records.auth_studies_cnt = studyAccess.auth_cnts.studies;
                this.records.open_studies_cnt = studyAccess.open_cnts.studies;
                this.records.auth_participants_cnt = studyAccess.auth_cnts.participants;
                this.records.open_participants_cnt = studyAccess.open_cnts.participants;
                this.records.freeze_msg = studyAccess.freezeMsg;

                this.$el.html(this.template(this.records));
            }
        });

        return studyAccess;
    });
