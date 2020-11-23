define(["handlebars", "common/transportErrors", "text!options/modal.hbs", "text!studyAccess/studyAccessTemplate.hbs", "text!studyAccess/studies-data.json"],
function(HBS, transportErrors, modalTemplate, studyAccessTemplate, studyAccessConfiguration){

    var studyAccessFunctions = {
        ready: false,
        displayData: false,
		freezeMsg: "Current TOPMed genomic data is Freeze5b"
    };

    studyAccessFunctions.init = function() {
            if (this.ready === true) return;
            this.displayData = {"permitted": [], "denied": [], "na": []};
            // extract the consent identifiers from the query template
            var session = JSON.parse(sessionStorage.getItem("session"));
            if (session.queryTemplate === undefined) {
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
            for (groupid in this.configurationData) {
                for (idx=0; idx < this.configurationData[groupid].length; idx++) {
                    // determine if logged in user is permmited access
                    var tmpStudy = this.configurationData[groupid][idx];
                    tmpStudy["clinical_variable_count"] = parseInt(tmpStudy["clinical_variable_count"]).toLocaleString();
                    tmpStudy["clinical_sample_size"] = parseInt(tmpStudy["clinical_sample_size"]).toLocaleString();
                    tmpStudy["genetic_sample_size"] = parseInt(tmpStudy["genetic_sample_size"]).toLocaleString();
                    var studyConsent = tmpStudy["study_identifier"] + "." + tmpStudy["consent_group_code"];
                    if (tmpStudy["consent_group_code"] == "c0") {
                        this.displayData.na.push(tmpStudy);
                    } else {
                        if (validConsents.includes(studyConsent)) {
                            this.displayData.permitted.push(tmpStudy);
                        } else {
                            this.displayData.denied.push(tmpStudy);
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
            this.displayData.permitted.sort(funcSort);
            this.displayData.denied.sort(funcSort);
            this.displayData.na.sort(funcSort);
            this.ready = true;
    }.bind(studyAccessFunctions);

    studyAccessFunctions.addHeaderTab = function() {
            // initialize if not already done
            this.init();
            // inject button and click handler
            $('<a class="col-md-2 btn btn-default header-btn" id="data-access-btn" href="#">Data Access</a>').insertAfter("#user-profile-btn");
            $('#data-access-btn').click(function(e){
                this.showPage(this.displayData);
                e.currentTarget.blur();
            }.bind(this));
    }.bind(studyAccessFunctions);

    studyAccessFunctions.showPage = function(in_studyAccess) {
            if (typeof(in_studyAccess) == "undefined") { in_studyAccess = this.displayData}
            if ($("#modal-window").length == 0) $("body").append('<div id="modal-window"></div>');
            $("#modal-window").html(this.modalTemplate({title: "BioData Catalyst PIC-SURE Data Access"}));
            $(".modal-title").after("<div>" + this.freezeMsg + "</div>");
            $(".modal-title").after("<div>P = Phenotype, G = Genomic, P/G = Phenotype/Genomic</div>");
            $("#modalDialog").show();
            $(".modal-body").html(this.studyAccessTemplate(in_studyAccess));
	    $(".no-consent-row").hide();
            $($("#no-consent-toggle")[0].parentNode).click(this.toggleNoConsentsList);
            $('.close').click(this.closePage);
    }.bind(studyAccessFunctions);

    studyAccessFunctions.showBlocker = function() {
            if ($("#modal-window").length == 0) $("body").append('<div id="modal-window"></div>');
            $("#modal-window").html(this.modalTemplate({title: "BioData Catalyst Data Access"}));
            $(".modal-title").after("<div>" + this.freezeMsg + "</div>");
            $(".modal-title").after("<div>P = Phenotype, G = Genomic, P/G = Phenotype/Genomic</div>");
            $("#modalDialog").show();
            $(".modal-body").html(this.studyAccessTemplate(this.displayData));
	    $(".no-consent-row").hide();
            $($("#no-consent-toggle")[0].parentNode).click(this.toggleNoConsentsList);
            $('.close').click(function() {
                sessionStorage.clear();
                window.location = require("common/transportErrors").redirectionUrl;
	   });
    }.bind(studyAccessFunctions);

    studyAccessFunctions.closePage = function() {
            $("#modalDialog").hide();
    }.bind(studyAccessFunctions);

    studyAccessFunctions.toggleNoConsentsList = function() {
        if ($("#no-consent-toggle").hasClass("glyphicon-chevron-down")) {
            $(".no-consent-row").show();
            $("#no-consent-toggle").removeClass("glyphicon-chevron-down");
            $("#no-consent-toggle").addClass("glyphicon-chevron-up");
        } else {
            $(".no-consent-row").hide();
            $("#no-consent-toggle").removeClass("glyphicon-chevron-up");
            $("#no-consent-toggle").addClass("glyphicon-chevron-down");
        }
    }.bind(studyAccessFunctions);


    studyAccessFunctions.modalTemplate = HBS.compile(modalTemplate);
    studyAccessFunctions.studyAccessTemplate = HBS.compile(studyAccessTemplate);
    studyAccessFunctions.configurationData = JSON.parse(studyAccessConfiguration);

    return studyAccessFunctions;
    
});
