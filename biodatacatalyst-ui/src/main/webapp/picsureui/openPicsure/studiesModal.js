define([
    'backbone',
    'handlebars',
    'text!openPicsure/studiesModalView.hbs',
    "picSure/settings",
], function(BB, HBS, studiesModalTemplate, settings) {
    return BB.View.extend({
        initialize: function (opts) {
            this.studiesModalTemplate = HBS.compile(studiesModalTemplate);
        },
        events: {},
        render: function () {
            this.$el.html(this.studiesModalTemplate());
        }
    });
});