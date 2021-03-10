define(["handlebars", "studyAccess/studyAccess", "text!common/mainLayout.hbs", "text!../settings/settings.json", "filter/filterList",
        "openPicsure/outputPanel", "picSure/queryBuilder"],
    function(HBS, studyAccess, layoutTemplate, settings, filterList,
             outputPanel, queryBuilder){
        var displayDataAccess = function() {            
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
                    $('#main-content').empty();
                    $('#main-content').append(HBS.compile(layoutTemplate)(JSON.parse(settings)));

                    var outputPanelView = new outputPanel.View({model: new outputPanel.Model()});
                    outputPanelView.render();
                    $('#query-results').append(outputPanelView.$el);

                    var query = queryBuilder.createQuery({}, JSON.parse(settings).openAccessResourceId);
                    outputPanelView.update(query);

                    filterList.init(JSON.parse(settings).openAccessResourceId, outputPanelView);
                }
            },
            defaultAction: displayDataAccess
        };
    }
);