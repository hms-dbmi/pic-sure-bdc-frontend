define(["jquery", "handlebars", "backbone", "text!api-interface/bdcTerraLink.hbs"],
    function ($, HBS, BB, bdcTerraModalTemplate) {

        var View = BB.View.extend({
            initialize: function (opts) {
                this.template = HBS.compile(bdcTerraModalTemplate);
            },
            events: {},
            render: function () {
                this.$el.html(this.template);
                return this;
            }
        });

        return View;
    });