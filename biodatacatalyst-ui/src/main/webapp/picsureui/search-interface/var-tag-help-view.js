define([
    'backbone',
    'handlebars',
    'text!search-interface/var-tag-help-view.hbs'
], function(BB, HBS, helpViewTemplate) {
    var HelpView = BB.View.extend({
        initialize: function(opts){
            this.helpViewTemplate = HBS.compile(helpViewTemplate);
        },
        events: {},
        render: function(){
            this.$el.html(this.helpViewTemplate());
        }
    });
    return HelpView;
});