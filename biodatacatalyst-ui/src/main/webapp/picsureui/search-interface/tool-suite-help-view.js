define([
    'backbone',
    'handlebars',
    'text!search-interface/tool-suite-help-view.hbs',
    "picSure/settings",
], function(BB, HBS, toolSuiteHelpViewTemplate, settings) {
    var HelpView = BB.View.extend({
        initialize: function(opts){
            this.isOpenAccess = opts.isOpenAccess;
            this.toolSuiteHelpViewTemplate = HBS.compile(toolSuiteHelpViewTemplate);
        },
        events: {},
        render: function(){
            this.$el.html(this.toolSuiteHelpViewTemplate({pdfLink: settings.pdfLink, isOpenAccess: this.isOpenAccess}));
        }
    });
    return HelpView;
});