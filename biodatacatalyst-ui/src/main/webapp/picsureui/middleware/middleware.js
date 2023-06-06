define(["backbone", "picSure/settings"],
function (Backbone, settings) {
    return Backbone.View.extend({
        initialize: function () {
            $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
                // if url contains picsure
                if (options.url.indexOf("/picsure") !== -1) {
                    let isOpenAccess = sessionStorage.getItem("isOpenAccess");
                    let requestSource = isOpenAccess === "true" ? 'Open' : 'Authorized';

                    jqXHR.setRequestHeader("request-source", requestSource);
                }
            });
        },
        render: function () {
            return this;
        }
    });
});