define(["jquery", "underscore", "text!studyAccess/studies-data.json", "text!settings/settings.json", "search-interface/studies-data-cache"],
    function($, _, studiesDataJson, settingsJson, cache){
        let studiesData = JSON.parse(studiesDataJson);
        let settings = JSON.parse(settingsJson);
        const dccHarmonizedTag = 'dcc harmonized data set';
        return {

            /*
                This function looks up the study abbreviation for a given study id
            */
            findStudyAbbreviationFromId: function(study_id){
                if (cache.has(study_id)) {
                    return cache.get(study_id).abbreviated_name;
                }
                let study = _.find(studiesData.bio_data_catalyst,
                    function(studyData){
                        return studyData.study_identifier.toLowerCase() === study_id.toLowerCase();
                    });
                if (study) {
                    cache.set(study_id, study);
                    return study.abbreviated_name;
                } else if (study_id.toLowerCase() === 'dcc harmonized data set') {
                    cache.set(study_id, {study_identifier: study_id, abbreviated_name: study_id, is_harmonized: 'Y'});
                    return study_id;
                } else if (settings.categoryAliases.hasOwnProperty(study_id)){
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
            isStudy(study_id) {
                if (study_id===dccHarmonizedTag || cache.has(study_id)) {
                    return true;
                }
                let study = _.find(studiesData.bio_data_catalyst,
                  function (studyData) {
                    return (studyData.study_identifier.toLowerCase() === study_id.toLowerCase());
                  }
                );
                return !!study;
            },
            isStudyHarmonized: function(study_id) {
                if (cache.has(study_id)) {
                    return cache.get(study_id).is_harmonized === 'Y';
                } else {
                    let study = _.find(studiesData.bio_data_catalyst,
                        function(studyData){
                            return studyData.study_identifier.toLowerCase() === study_id.toLowerCase();
                        });
                    if (study) {
                        cache.set(study_id, study);
                        return study.is_harmonized === 'Y';
                    } else if (study_id.toLowerCase() === 'dcc harmonized data set') {
                        cache.set(study_id, {study_identifier: study_id, abbreviated_name: study_id, is_harmonized: 'Y'});
                        return true;
                    }
                }
                return false;
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
            },

             /*
                This function detects if the user should see the dcc tag and variables in search results.
            */
            shouldShowDCCDataSets: function() {
                const queryScopes = JSON.parse(sessionStorage.getItem("session"))?.queryScopes;
                const harmonizedStudies = queryScopes?.filter(scope => this.isStudyHarmonized(scope.replace(/\\/g, '')));
                return harmonizedStudies?.length > 1;
            },

            /**
             * This function returns the study id from the study abbreviation or study name. If the study id is not found
             * then the study abbreviation is returned.
             *
             * @returns {any[]}
             */
            getAntiScopeTags: function() {
                let queryScopes = JSON.parse(sessionStorage.getItem("session")).queryScopes;
                // tell the back end to exclude concepts from studies not in the user's scope'
                let antiScopeStudies = _.filter(studiesData.bio_data_catalyst, function(studyData){
                    //if this study is NOT in the query scopes, _.find will return NULL
                    return _.find(queryScopes, function(scopeElement){
                        return scopeElement.toLowerCase().includes(studyData.study_identifier.toLowerCase());
                    }) == null;
                });

                // only include each tag once
                let antiScopeTags = new Set();
                _.each(antiScopeStudies, function(study){
                    //add PHSxxxxxx (caps) and phsxxxxxx.vxx (lower) tags to anti-scope
                    antiScopeTags.add(study.study_identifier.toUpperCase());
                    antiScopeTags.add((study.study_identifier + "." + study.study_version).toLowerCase());
                });
                // add dcc harmonized tag if user does not have access to more than one harmonized study
                !this.shouldShowDCCDataSets() && antiScopeTags.add(dccHarmonizedTag)

                // convert set to array
                return Array.from(antiScopeTags);
            }
        };
    });
