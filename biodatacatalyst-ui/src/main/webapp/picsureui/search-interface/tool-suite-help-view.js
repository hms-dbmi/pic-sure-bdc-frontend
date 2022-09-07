define([
    'backbone',
    'handlebars',
    'text!search-interface/tool-suite-help-view.hbs'
], function(BB, HBS, toolSuiteHelpViewTemplate) {
    var HelpView = BB.View.extend({
        initialize: function(opts){
            this.toolSuiteHelpViewTemplate = HBS.compile(toolSuiteHelpViewTemplate);
        },
        events: {},
        render: function(){
            this.$el.html(this.toolSuiteHelpViewTemplate());
        }
    });
    return HelpView;
});