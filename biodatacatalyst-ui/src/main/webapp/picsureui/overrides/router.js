define(["backbone", "handlebars", "studyAccess/studyAccess", "text!common/mainLayout.hbs", "picSure/settings", "filter/filterList",
        "openPicsure/outputPanel", "picSure/queryBuilder", "text!openPicsure/searchHelpTooltipOpen.hbs", "overrides/outputPanel",
        "search-interface/filter-list-view", "search-interface/search-view", "search-interface/tool-suite-view",
        "search-interface/query-results-view", "text!openPicsure/openMainLayout.hbs", "openPicsure/studiesPanelView", "search-interface/filter-model"],
    function(BB, HBS, studyAccess, layoutTemplate, settings, filterList,
             outputPanel, queryBuilder, searchHelpTooltipTemplate, output,
             FilterListView, SearchView, ToolSuiteView, queryResultsView, openLayout, studiesPanelView, filterModel){
        const genomicFilterWarningText = 'Genomic filters will be removed from your query as they are not currently supported in Open Access. Are you sure you would like to proceed to Open Access? \n\nClick OK to proceed to open access or cancel to reutrn to authorized access.';
        let displayDataAccess = function() {
            $(".header-btn.active").removeClass('active');
            $(".header-btn[data-href='/picsureui/dataAccess']").addClass('active');
            $('#main-content').empty();
            var studyAccessView = new studyAccess.View;
            $('#main-content').append(studyAccessView.$el);
            studyAccessView.render();
        };
        let getGenomicFilters = function() {
            let genomicFilters = filterModel.get('activeFilters').filter(filter => {
                return filter.get('type') === 'genomic';
            });
            return genomicFilters;
        };
        let displayOpenAccess = function() {
            sessionStorage.setItem("isOpenAccess", true);
            $(".header-btn.active").removeClass('active');
            $(".header-btn[data-href='/picsureui/openAccess']").addClass('active');
            $('#main-content').empty();
            $('#main-content').append(HBS.compile(openLayout)(settings));
            const studiesPanel = new studiesPanelView();
            studiesPanel.render();
            $('#studies-list-panel').append(studiesPanel.$el);
            const outputPanelView = new outputPanel.View({studiesPanel: studiesPanel});
            const query = queryBuilder.generateQueryNew({}, {}, null, settings.openAccessResourceId);
            outputPanelView.render();
            $('#query-results').append(outputPanelView.$el);

            var parsedSess = JSON.parse(sessionStorage.getItem("session"));

            const searchView = new SearchView({
                queryTemplate: JSON.parse(parsedSess.queryTemplate),
                queryScopes: parsedSess.queryScopes,
                el : $('#filter-list')
            });

            const filterListView = new FilterListView({
                outputPanelView : outputPanelView,
                el : $('#filter-list-panel')
            });
            filterListView.render();
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
                "picsureui/openAccess" : function() {
                    let genomicFilters = getGenomicFilters();
                    if (genomicFilters.length>0) {
                        if (confirm(genomicFilterWarningText)) {
                            filterModel.get('activeFilters').remove(genomicFilters, {silent: true});
                            displayOpenAccess();
                        } else  {
                            // If firefox use this.navigate() to go back to the previous page otherwise use window.history.back()
                            // Firefox does not handle window.history.back() well for this use case.
                            if (navigator.userAgent && navigator.userAgent.indexOf("Firefox") !== -1) {
                                this.navigate('picsureui/queryBuilder#', {trigger:true, replace:false});
                            } else {
                                window.history.back();
                            }
                        }
                    } else {
                        displayOpenAccess();
                    }
                },
                "picsureui/queryBuilder(/)" : function() {
                    sessionStorage.setItem("isOpenAccess", false);
                    $(".header-btn.active").removeClass('active');
                    $(".header-btn[data-href='/picsureui/queryBuilder']").addClass('active');

                    $('#main-content').empty();
                    let parsedSettings = this.settings;
                    $('#main-content').append(this.layoutTemplate(parsedSettings));

                    var queryView = new queryResultsView.View({model: new queryResultsView.Model()});

                    queryView.render();
                    $('#query-results').append(queryView.$el);

                    var parsedSess = JSON.parse(sessionStorage.getItem("session"));

                    var query = queryBuilder.generateQueryNew({},{}, JSON.parse(parsedSess.queryTemplate), parsedSettings.picSureResourceId);

                    let searchView = new SearchView({
                        queryTemplate: JSON.parse(parsedSess.queryTemplate),
						queryScopes: parsedSess.queryScopes,
                        el : $('#filter-list')
                    });

                    let filterListView = new FilterListView({
                        outputPanelView : queryView,
                        el : $('#filter-list-panel')
                    });

                    filterListView.render();

                    let toolSuiteView = new ToolSuiteView({
                        el: $('#tool-suite-panel')
                    });

                    toolSuiteView.render();
                }
            },
            defaultAction: displayDataAccess
        };
    }
);
