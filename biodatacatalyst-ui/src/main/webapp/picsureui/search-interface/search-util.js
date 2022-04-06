define(["jquery","text!studyAccess/studies-data.json"],
    function($, studiesDataJson){
        let studiesData = JSON.parse(studiesDataJson);

        return {

            /*
                This function looks up the study abbreviation for a given study id
            */
            findStudyAbbreviationFromId: function(study_id){
                let study = _.find(studiesData.bio_data_catalyst,
                    function(studyData){
                        return studyData.study_identifier === study_id.toLowerCase();
                    });
                if (study) {
                    return study.abbreviated_name;
                }
                return study_id;
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
