define(['backbone', 'jquery', 'handlebars', 'text!common/link-redirect-warning-view.hbs'],
    function (Backbone, $, HBS, linkRedirectWarningTemplate) {
    return Backbone.View.extend({
        initialize: function (opts) {
            this.template = HBS.compile(linkRedirectWarningTemplate);
            this.href = opts.href;
        },
        events: {
            'click #link-redirect-warning-close': '_onCloseClicked',
            'click #link-redirect-warning-continue': '_onContinueClicked'
        },
        _onCloseClicked: function () {
            $("#modalDialog").hide();
            $(".modal-backdrop").hide();
        },
        _onContinueClicked: function () {
            // close the modal and open the link in a new tab

            $("#modalDialog").hide();
            $(".modal-backdrop").hide();
            window.open(this.href, '_blank');
        },
        render: function () {
            this.$el.html(this.template());
        }
    });
});