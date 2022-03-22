define(["handlebars", "studyAccess/studyAccess", "text!common/mainLayout.hbs", "text!../settings/settings.json", "filter/filterList",
        "openPicsure/outputPanel", "picSure/queryBuilder", "text!openPicsure/searchHelpTooltipOpen.hbs", "output/outputPanel",
        "search-interface/filter-list-view", "search-interface/search-view", "search-interface/tool-suite-view", "search-interface/query-results-view",],
    function(HBS, studyAccess, layoutTemplate, settings, filterList,
             outputPanel, queryBuilder, searchHelpTooltipTemplate, output,
             FilterListView, SearchView, ToolSuiteView, queryResultsView){
        var displayDataAccess = function() {
            $(".header-btn.active").removeClass('active');
            $(".header-btn[data-href='/picsureui/dataAccess']").addClass('active');
            $('#main-content').empty();
            var studyAccessView = new studyAccess.View;
            $('#main-content').append(studyAccessView.$el);
            studyAccessView.render();
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
                    $(".header-btn.active").removeClass('active');
                    $(".header-btn[data-href='/picsureui/openAccess']").addClass('active');
                    $('#main-content').empty();
                    $('#main-content').append(HBS.compile(layoutTemplate)(JSON.parse(settings)));

                    var outputPanelView = new outputPanel.View({model: new outputPanel.Model()});
                    outputPanelView.render();
                    $('#query-results').append(outputPanelView.$el);

                    var query = queryBuilder.generateQuery({}, {}, JSON.parse(settings).openAccessResourceId);
                    outputPanelView.runQuery(query);

                    var renderHelpCallback = function() {
                        $('.show-help-modal').click(function() {
                            $('#modal-window').html(HBS.compile(searchHelpTooltipTemplate));
                            $('#modal-window', this.$el).tooltip();
                            $(".close").click(function(){
                                $("#search-help-modal").hide();
                            });
                            $("#search-help-modal").show();
                        });
                    }
                    filterList.init(JSON.parse(settings).openAccessResourceId, outputPanelView, renderHelpCallback);
                },
                "picsureui/queryBuilder(/)" : function() {
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
                    queryView.runQuery(query);

                    let searchView = new SearchView({
                        queryTemplate: JSON.parse(parsedSess.queryTemplate),
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
