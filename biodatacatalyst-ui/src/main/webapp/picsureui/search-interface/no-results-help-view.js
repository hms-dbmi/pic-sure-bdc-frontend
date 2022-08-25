define([
    'backbone',
    'handlebars',
    'text!search-interface/no-results-help-view.hbs',
    'text!search-interface/no-results-open-help-view.hbs',
], function(BB, HBS, helpTemplate, openHelpTemplate) {
    var HelpView = BB.View.extend({
        initialize: function(opts){
            this.helpTemplate = HBS.compile(helpTemplate);
            this.openHelpTemplate = HBS.compile(openHelpTemplate);
        },
        events: {},
        render: function(){
            this.$el.html(JSON.parse(sessionStorage.getItem('isOpenAccess')) ? this.openHelpTemplate() : this.helpTemplate());
        }
    });
    return HelpView;
});