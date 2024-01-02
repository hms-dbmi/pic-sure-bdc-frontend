define(["underscore", "jquery", "backbone", "handlebars", "text!landing/landing.hbs", "picSure/search", "picSure/settings",
        "picSure/queryBuilder", "common/spinner", "common/transportErrors", "studyAccess/study-utility",
        "search-interface/search-util",],
    function (_, $, BB, HBS, landingTemplate, search, settings, queryBuilder, spinner,
              transportErrors, studyUtility, searchUtil) {
        const landing = {
            resources: {
                auth: settings.picSureResourceId
            }
        };

        return BB.View.extend({
            initialize: function () {
                this.template = HBS.compile(landingTemplate);
            },
            events: {
                "click #landingSearchButton": "handleLandingSearch",
                "keypress #landingSearchInput": "handleLandingSearchKeypress",
            },
            handleLandingSearchKeypress: function (event) {
                if (event.keyCode === 13) {
                    this.handleLandingSearch(event);
                }
            },
            handleLandingSearch: function (event) {
                // Log the search event
                let searchQuery = $("#landingSearchInput").val();

                // encode the search query
                searchQuery = encodeURIComponent(searchQuery);
                sessionStorage.setItem("landingSearchQuery", searchQuery);

                // Navigate to the explorer page
                window.location.href = "/picsureui/queryBuilder";
            },
            render: function () {
                this.$el.html(this.template());

                // get counts for studies and participants
                let records = studyUtility.groupRecordsByAccess();

                // get counts for studies and participants
                let temp = records.permitted.map((rec) => {
                    return rec.study_identifier;
                });
                temp = [...new Set(temp)];
                let authStudiesCount = temp.length;

                // query for participant counts of authorized and open access resources
                let query = queryBuilder.createQueryNew({}, {}, landing.resources.auth);
                query.query.expectedResultType = "COUNT";
                queryBuilder.updateConsentFilters(query, settings);
                let deferredParticipants = $.ajax({
                    url: window.location.origin + "/picsure/query/sync",
                    type: 'POST',
                    headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                    contentType: 'application/json',
                    data: JSON.stringify(query),
                    success: (function (response) {
                        $("#authorized-participants").html(parseInt(response).toLocaleString());
                        $("#authorized-participants-spinner").html("");
                        $('#authorized-studies').html(authStudiesCount);
                        $('#authorized-studies-spinner').html("");
                    }).bind(this),
                    statusCode: {
                        401: function () {
                        }
                    },
                    error: function () {
                        $("#authorized-participants").html("0");
                        $("#authorized-participants-spinner").html("");
                    }
                });

                let excludedTags = searchUtil.getAntiScopeTags();
                let deferredVariables = $.ajax({
                    url: window.location.origin + "/picsure/search/36363664-6231-6134-2D38-6538652D3131",
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        "query": {
                            "searchTerm": "",
                            "includedTags": [],
                            "excludedTags": excludedTags,
                            "returnTags": false,
                            "limit": 1
                        }
                    }),
                    success: function (response) {
                        $("#authorized-variables").html(parseInt(response.results.numResults).toLocaleString());
                        $('#authorized-variables-spinner').html("");
                    },
                    error: function (response) {
                        console.log(response);
                    }
                });

                spinner.medium(deferredVariables, "#authorized-variables-spinner", "spinner2");
                spinner.medium(deferredParticipants, "#authorized-participants-spinner", "spinner2");
                spinner.medium(deferredParticipants, "#authorized-studies-spinner", "spinner2");

                return this;
            }
        });
    })
;

