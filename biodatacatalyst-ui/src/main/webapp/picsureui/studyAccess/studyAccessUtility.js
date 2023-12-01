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
                for (idx = 0; idx < configurationData[groupid].length; idx++) {
                    // determine if logged in user is permmited access
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

        return {
            getStudyAccessConfiguration: getStudyAccessConfiguration,
            groupRecordsByAccess: groupRecordsByAccess
        };
    });