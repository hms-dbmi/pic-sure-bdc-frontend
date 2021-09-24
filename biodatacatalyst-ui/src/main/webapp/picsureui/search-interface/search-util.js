define(["jquery","text!studyAccess/studies-data.json"],
    function($, studiesDataJson){
        let studiesData = JSON.parse(studiesDataJson);

        return {
            findStudyAbbreviationFromId: function(study_id){
                let study = _.find(studiesData.bio_data_catalyst,
                    function(studyData){
                        return studyData.study_identifier === study_id.split('.')[0].toLowerCase();
                    });
                if (study) {
                    return study.abbreviated_name;
                }
                return study_id;
            }
        };
    });
