define(["jquery", "backbone", "handlebars", "text!studyAccess/studies-data.json"],
    function ($, bb, hbs, studyAccessConfiguration) {
        function getStudyAccessConfiguration() {
            return JSON.parse(studyAccessConfiguration);
        }

        function groupRecordsByAccess() {
            // extract the consent identifiers from the query template
            let session = JSON.parse(sessionStorage.getItem("session"));
            let validConsents = [];
            if (session.queryTemplate) {
                let temp = JSON.parse(session.queryTemplate);

                if (temp && temp.categoryFilters && temp.categoryFilters["\\_consents\\"]) {
                    validConsents = temp.categoryFilters["\\_consents\\"];
                }
            }

            // process the study data into permission granted or not groups
            let records = {
                permitted: [],
                denied: [],
                na: []
            };
            let configurationData = JSON.parse(studyAccessConfiguration);
            for (let groupid in configurationData) {
                for (let idx = 0; idx < configurationData[groupid].length; idx++) {
                    // determine if logged in user is permitted access
                    let tmpStudy = configurationData[groupid][idx];
                    const cvc = parseInt(tmpStudy["clinical_variable_count"]).toLocaleString();
                    tmpStudy["clinical_variable_count"] = cvc == '-1' || cvc == 'NaN' ? 'N/A' : cvc;
                    const css = parseInt(tmpStudy["clinical_sample_size"]).toLocaleString();
                    tmpStudy["clinical_sample_size"] = css == '-1' || cvc == 'NaN' ? 'N/A' : css;
                    const gsc = parseInt(tmpStudy["genetic_sample_size"]).toLocaleString();
                    tmpStudy["genetic_sample_size"] = gsc == '-1' || gsc == 'NaN' ? 'N/A' : gsc;

                    let studyConsent = tmpStudy["study_identifier"] + (tmpStudy["consent_group_code"] && tmpStudy["consent_group_code"] != "" ? "." + tmpStudy["consent_group_code"] : "");
                    tmpStudy['accession'] = tmpStudy["consent_group_code"] ?
                        tmpStudy["study_identifier"] + "." + tmpStudy["study_version"] + "." + tmpStudy["study_phase"] + "." + tmpStudy["consent_group_code"] :
                        ""; // Show empty string if no consent group code (open dataset)
                    if (validConsents.includes(studyConsent)) {
                        tmpStudy['isGranted'] = true;
                        records.permitted.push(tmpStudy);
                    } else {
                        if (!tmpStudy['authZ']) {
                            tmpStudy['isSuspended'] = true;
                        }
                        if (tmpStudy["consent_group_code"] == "c0") {
                            tmpStudy['isGranted'] = false;
                            records.na.push(tmpStudy);
                        } else {
                            records.denied.push(tmpStudy);
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
            records.permitted.sort(funcSort);
            records.denied.sort(funcSort);
            records.na.sort(funcSort);

            return records;
        }

        function calculateAvailableStudiesAndParticipants() {
            let configurationData = JSON.parse(studyAccessConfiguration);
            let countedStudies = [];

            for (let studyMetadata in configurationData) {
                for (let idx = 0; idx < configurationData[studyMetadata].length; idx++) {
                    let tmpStudy = configurationData[studyMetadata][idx];
                    if (tmpStudy['authZ'] !== "" && !countedStudies.includes(tmpStudy["study_identifier"])) {
                        // We need to keep track of the studies we have already counted.
                        // It seems there are duplicate studies in the fence mapping
                        countedStudies.push(tmpStudy["study_identifier"]);
                    }
                }
            }

            localStorage.setItem("availableStudiesCount", "" + countedStudies.length);
            return {
                availableStudiesCount: countedStudies.length,
            };
        }

        function getAvailableStudiesCount() {
            if (!localStorage.getItem("availableStudiesCount") || !localStorage.getItem("cachedStudyDataHash") || localStorage.getItem("cachedStudyDataHash") !== studyAccessConfiguration.hashCode()) {
                const { availableStudiesCount } = calculateAvailableStudiesAndParticipants();
                return availableStudiesCount;
            }
            return parseInt(localStorage.getItem("availableStudiesCount"));
        }

        // Calculate and cache available studies and total participants if the data is updated
        if (!localStorage.getItem("cachedStudyDataHash") || localStorage.getItem("cachedStudyDataHash") !== studyAccessConfiguration.hashCode()) {
            calculateAvailableStudiesAndParticipants();
            localStorage.setItem("cachedStudyDataHash", studyAccessConfiguration.hashCode());
        }

        return {
            getStudyAccessConfiguration: getStudyAccessConfiguration,
            groupRecordsByAccess: groupRecordsByAccess,
            getAvailableStudiesCount: getAvailableStudiesCount,
        };
    });

// Helper function to calculate a simple hash code for the JSON data (not cryptographic)
String.prototype.hashCode = function () {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};
