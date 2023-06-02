define([
    'backbone',
    'handlebars',
    'text!openPicsure/tool-suite-help-view.hbs',
    "picSure/settings",
], function(BB, HBS, toolSuiteHelpViewTemplate, settings) {
    return BB.View.extend({
        initialize: function (opts) {
            this.toolSuiteHelpViewTemplate = HBS.compile(toolSuiteHelpViewTemplate);
        },
        events: {},
        render: function () {
            this.$el.html(this.toolSuiteHelpViewTemplate());
        }
    });
});