define(["backbone", "handlebars", "studyAccess/studyAccess", "picSure/settings", "filter/filterList",
        "openPicsure/outputPanel", "picSure/queryBuilder", "text!openPicsure/searchHelpTooltipOpen.hbs", "overrides/outputPanel",
        "search-interface/filter-list-view", "search-interface/search-view", "search-interface/tool-suite-view",
        "search-interface/query-results-view", "api-interface/apiPanelView", "search-interface/filter-model",
        "search-interface/tag-filter-model", "landing/landing"],
    function(Backbone, HBS, studyAccess, settings, filterList,
             outputPanel, queryBuilder, searchHelpTooltipTemplate, output,
             FilterListView, SearchView, ToolSuiteView, queryResultsView,
             ApiPanelView, filterModel, tagFilterModel, landingView) {
        const genomicFilterWarningText = 'Genomic filters will be removed from your query as they are not currently supported in Open Access. Are you sure you would like to proceed to Open Access? \n\nClick OK to proceed to open access or cancel to reutrn to authorized access.';
        let displayDataAccess = function() {
            $(".header-btn.active").removeClass('active');
            $(".header-btn[data-href='/picsureui/dataAccess']").addClass('active');
            $('#main-content').empty();
            var studyAccessView = new studyAccess.View();
            $('#main-content').append(studyAccessView.$el);
            studyAccessView.render();
        };
        let getGenomicFilters = function() {
            let genomicFilters = filterModel.get('activeFilters').filter(filter => {
                return filter.get('type') === 'genomic';
            });
            return genomicFilters;
        };
        let getInvalidActiveFilters = function() {
            const session = JSON.parse(sessionStorage.getItem("session"));
            return filterModel.get('activeFilters').filter(filter => {
                if (filter.get('type') === 'genomic') {
                    return session.queryScopes && !session.queryScopes.includes('Gene_with_variant');
                } else {
                    const filterStudyId = '\\'+filter.get('searchResult').result.metadata.columnmeta_study_id+'\\';
                    return session.queryScopes && !session.queryScopes.includes(filterStudyId);
                }
            });
        };

        let displayAPI = function() {
            $(".header-btn.active").removeClass('active');
            $(".header-btn[data-href='/picsureui/api']").addClass('active');
            $('#main-content').empty();

            var apiPanelView = new ApiPanelView({});
            $('#main-content').append(apiPanelView.$el);
            apiPanelView.render();
        };

        let displayLandingPage = function () {
            $(".header-btn.active").removeClass('active');
            $('#main-content').empty();
            let totalVars = filterModel.get("totalVariables");

            const landing = new landingView({totalVars: totalVars});
            $('#main-content').append(landing.$el);
            landing.render();
        };

        return {
            routes : {
                /**
                 * Additional routes for the backbone router can be defined here. The field name should be the path,
                 * and the value should be a function.
                 *
                 * Ex:
                 * "picsureui/queryBuilder2" : function() { renderQueryBuilder2(); }
                 */
                "picsureui/dataAccess" : displayDataAccess,
                "picsureui/queryBuilder(/)" : function() {
                    sessionStorage.setItem("isOpenAccess", false);
                    let antiScopes = getInvalidActiveFilters();
                    if (antiScopes && antiScopes.length > 0) {
                        if(confirm('Filters on studies you are not authorized to access will be removed as they are not supported in Authorized Access. Are you sure you would like to proceed to Authorized Access?')) {
                            filterModel.get('activeFilters').remove(antiScopes, {silent: true});
                            antiScopes.forEach(filter => {
                                tagFilterModel.removeRequiredTag(filter.get('searchResult').result.metadata.columnmeta_study_id);
                                tagFilterModel.removeExcludedTag(filter.get('searchResult').result.metadata.columnmeta_study_id);
                            });
                        } else {
                            this.navigate('picsureui/openAccess#', {trigger:true, replace:false});
                            return;
                        }
                    }
                    Backbone.pubSub.trigger('destroySearchView');
                    $(".header-btn.active").removeClass('active');
                    $(".header-btn[data-href='/picsureui/queryBuilder']").addClass('active');

                    $('#main-content').empty();
                    $('#main-content').append(this.layoutTemplate(settings));
                    const toolSuiteView = new ToolSuiteView({
                        el: $('#tool-suite-panel'),
                        isOpenAccess: false
                    });
                    const queryView = new queryResultsView.View({model: new queryResultsView.Model(), toolSuiteView: toolSuiteView});

                    queryView.render();
                    $('#query-results').append(queryView.$el);

                    const parsedSess = JSON.parse(sessionStorage.getItem("session"));

                    const query = queryBuilder.generateQueryNew({},{}, JSON.parse(parsedSess.queryTemplate), settings.picSureResourceId);

                    const searchView = new SearchView({
                        queryTemplate: JSON.parse(parsedSess.queryTemplate),
						queryScopes: parsedSess.queryScopes,
                        el : $('#filter-list'),
                        tourSearchTerm: "cardiac surgery"
                    });

                    $('#studies-list-panel').remove();

                    if($('#search-results-panel').is(":visible")) {
                        $('#guide-me-button-container').hide();
                    }        

                    const filterListView = new FilterListView({
                        outputPanelView : queryView,
                        el : $('#filter-list-panel')
                    });

                    filterListView.render();

                    toolSuiteView.render();
                },
                "picsureui/api" : displayAPI,
                "picsureui(/)": displayLandingPage,
            },
            defaultAction: displayLandingPage,
        };
    }
);
