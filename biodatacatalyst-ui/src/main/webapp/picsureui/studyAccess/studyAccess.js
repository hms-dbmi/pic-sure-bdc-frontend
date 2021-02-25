define(["backbone", "handlebars", "text!studyAccess/studyAccess.hbs", "text!studyAccess/studies-data.json", "common/transportErrors"],
    function(BB, HBS, studyAccessTemplate, studyAccessConfiguration, transportErrors){

        var studyAccess = {
            freezeMsg: "(Current TOPMed data is Freeze5b)",
            displayTemplate: HBS.compile(studyAccessTemplate)
        };

        // build view
        studyAccess.View = BB.View.extend({
            tagName: "div",
            template: studyAccess.studyAccessTemplate,
            initialize: function(){
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
                    freezeMsg: studyAccess.freezeMsg,
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
            },
            events:{
                "click .study-lst-btn1": "toggleConsent",
                "click .study-lst-btn2": "toggleConsent",
                "click .explore-now-button": "exploreNowClickHandler"
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
            exploreNowClickHandler: function() {
                window.history.pushState({}, "", "/picsureui/queryBuilder");
            },
            render: function() {
                this.$el.html(studyAccess.displayTemplate(this.records));
            }
        });

        return studyAccess;
    });
