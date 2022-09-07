define([
    'backbone',
    'handlebars',
    'text!search-interface/query-results-help-view.hbs'
], function(BB, HBS, queryResultsHelpViewTemplate) {
    var QueryHelpView = BB.View.extend({
        initialize: function(opts){
            this.queryResultsHelpViewTemplate = HBS.compile(queryResultsHelpViewTemplate);
        },
        events: {},
        render: function(){
            this.$el.html(this.queryResultsHelpViewTemplate());
        }
    });
    return QueryHelpView;
});
