define([
    'backbone',
    'handlebars',
    'text!search-interface/no-results-help-view.hbs'
], function(BB, HBS, helpTemplate) {
    var HelpView = BB.View.extend({
        initialize: function(opts){
            this.helpTemplate = HBS.compile(helpTemplate);
        },
        events: {},
        render: function(){
            this.$el.html(this.helpTemplate());
        }
    });
    return HelpView;
});