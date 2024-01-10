define([
    'backbone',
    'handlebars',
    'text!search-interface/terms-of-use.hbs',
], function(BB, HBS, template) {
    var TosView = BB.View.extend({
        initialize: function(){
            this.tosTemplate = HBS.compile(template);
        },
        events: {},
        render: function(){
            this.$el.html(this.tosTemplate());
        }
    });
    return TosView;
});