define(["jquery", "backbone", "handlebars", "text!studyAccess/studyAccess.hbs", "text!studyAccess/studies-data.json",
        "common/transportErrors", "picSure/queryBuilder", "picSure/settings", "common/spinner", "picSure/settings",
        "overrides/outputPanel", "picSure/search"],
    function($, BB, HBS, studyAccessTemplate, studyAccessConfiguration,
             transportErrors, queryBuilder, picSureSettings, spinner, settings,
             outputPanelOverrides, search){

        var studyAccess = {
            freezeMsg: "(Current TOPMed data is Freeze5b)",
            open_cnts: {},
            auth_cnts: {},
            resources: {
                open: picSureSettings.openAccessResourceId,
                auth: picSureSettings.picSureResourceId
            }
        };

        // build view
        studyAccess.View = BB.View.extend({
            tagName: "div",
            template: studyAccess.studyAccessTemplate,
            initialize: function(){
                HBS.registerHelper('valueOrNA', function(value){
                    return value == -1 ? "n/a" : value;
                });

                // setup the output template
                this.template = HBS.compile(studyAccessTemplate);

                // extract the consent identifiers from the query template
                var session = JSON.parse(sessionStorage.getItem("session"));
                this.authorizedAccess = session.privileges && session.privileges.includes("FENCE_AUTHORIZED_ACCESS");
                var validConsents = [];
                if (session.queryTemplate) {
                    var temp = JSON.parse(session.queryTemplate);

                    if (temp && temp.categoryFilters && temp.categoryFilters["\\_consents\\"]) {
                        validConsents = temp.categoryFilters["\\_consents\\"];
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
                        return (a["study_identifier"].localeCompare(b["study_identifier"]));
                    } else {
                        return (a["abbreviated_name"].localeCompare(b["abbreviated_name"]));
                    }
                };
                this.records.permitted.sort(funcSort);
                this.records.denied.sort(funcSort);
                this.records.na.sort(funcSort);

                // count the number of studies (accessible and total)
                var allRecs = [].concat(this.records.permitted, this.records.denied, this.records.na);
                var temp = allRecs.map((rec) => { return rec.study_identifier; });
                temp = [...new Set(temp)];
                studyAccess.open_cnts.studies = temp.length;
                var temp = this.records.permitted.map((rec) => { return rec.study_identifier; });
                temp = [...new Set(temp)];
                studyAccess.auth_cnts.studies = temp.length;
            },
            events:{
                "click .study-lst-btn1": "toggleConsent",
                "click .study-lst-btn2": "toggleConsent",
                "click .clickable-button": "buttonClickHandler"
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
            buttonClickHandler: function(event) {
                if ($(event.target).data("href")) {
                    window.history.pushState({}, "", $(event.target).data("href"));
                }
            },
            render: function() {
                // get counts for studies and participants
                this.records.auth_studies_cnt = studyAccess.auth_cnts.studies;
                this.records.auth_participants_cnt = studyAccess.auth_cnts.participants;
                this.records.open_participants_cnt = studyAccess.open_cnts.participants;
                this.records.freeze_msg = studyAccess.freezeMsg;
                this.records.authorizedAccess = !!this.authorizedAccess;

                this.$el.html(this.template(this.records));


                // query for participant counts of authorized and open access resources
                if (studyAccess.resources.auth) {
                    var query = queryBuilder.createQuery({}, studyAccess.resources.auth);
                    query.query.expectedResultType = "COUNT";
                    if (outputPanelOverrides.updateConsentFilters)
                        outputPanelOverrides.updateConsentFilters(query, settings);
                    var deferredParticipants = $.ajax({
                        url: window.location.origin + "/picsure/query/sync",
                        type: 'POST',
                        headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                        contentType: 'application/json',
                        data: JSON.stringify(query),
                        success: (function(response){
                            $("#authorized-participants").html(parseInt(response).toLocaleString() + " Participants");
                        }).bind(this),
                        statusCode: {
                            401: function(){
                            }
                        },
                        error: function () {
                            $("#authorized-participants").html("0 Participants");
                            $("#authorized-participants-spinner").html("");
                        }
                    });
                    spinner.medium(deferredParticipants, "#authorized-participants-spinner", "spinner1");
                }

                if (studyAccess.resources.open !== false) {
                    search.execute("\\_studies\\",
                        function(response) {
                            let openStudies = response.suggestions.length;
                            $('#open-studies-count').html(openStudies + " Studies");

                            var query = queryBuilder.generateQuery({}, null, studyAccess.resources.open);
                            query.query.expectedResultType = "COUNT";
                            var deferredParticipants = $.ajax({
                                url: window.location.origin + "/picsure/query/sync",
                                type: 'POST',
                                headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                                contentType: 'application/json',
                                data: JSON.stringify(query),
                                success: (function (response) {
                                    $("#open-participants").html(parseInt(response).toLocaleString() + " Participants");
                                }).bind(this),
                                statusCode: {
                                    401: function(){
                                    }
                                },
                                error: transportErrors.handleAll
                            });
                            spinner.medium(deferredParticipants, "#open-participants-spinner", "spinner2");
                        },
                        studyAccess.resources.open);
                }
            }
        });

        return studyAccess;
    });
