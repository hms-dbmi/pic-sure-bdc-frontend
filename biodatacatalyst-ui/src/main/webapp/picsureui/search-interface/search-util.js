define(["jquery","text!studyAccess/studies-data.json", "text!settings/settings.json"],
    function($, studiesDataJson, settingsJson){
        let studiesData = JSON.parse(studiesDataJson);
        let settings = JSON.parse(settingsJson);

        return {

            /*
                This function looks up the study abbreviation for a given study id
            */
            findStudyAbbreviationFromId: function(study_id){
                let study = _.find(studiesData.bio_data_catalyst,
                    function(studyData){
                        return studyData.study_identifier.toLowerCase() === study_id.toLowerCase();
                    });
                if (study) {
                    return study.abbreviated_name;
                }
                else if (settings.categoryAliases.hasOwnProperty(study_id)){
                    return settings.categoryAliases[study_id];
                }
                return study_id;
            },
            findStudyNameFromId: function(study_id){
                let study = _.find(studiesData.bio_data_catalyst,
                    function(studyData){
                        return studyData.study_identifier.toLowerCase() === study_id.toLowerCase();
                    });
                if (study) {
                    return study.full_study_name;
                }
                else if (settings.categoryAliases.hasOwnProperty(study_id)){
                    return settings.categoryAliases[study_id];
                }
                return study_id;
            },
            getActiveStudyList: function(){
                let activeStudiesList = _.map(studiesData.bio_data_catalyst, function(studyData){
                    let studyId = studyData.study_identifier.toLowerCase();
                    return {
                        studyId: studyId
                    }

                })
                return activeStudiesList;
            },
            /*
                This function detects if the passed in element is in the current viewport and
                if it is not scrolls the element into view.
            */
            ensureElementIsInView: function(element){
                var elementBounds = element.getBoundingClientRect();
                var viewportLowerBound = $('.row.footer-row')[0].getBoundingClientRect().top;
                if ( ! (elementBounds.top >= 0 && elementBounds.bottom <= viewportLowerBound)) {
                    element.scrollIntoView();
                }
            }
        };
    });
