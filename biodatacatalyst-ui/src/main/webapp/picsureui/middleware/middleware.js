define(["backbone", "picSure/settings"],
function (Backbone, settings) {
    return Backbone.View.extend({
        initialize: function () {
            $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
                // if url contains picsure
                if (options.url.indexOf("/picsure") !== -1) {
                    let isOpenAccess = sessionStorage.getItem("isOpenAccess");
                    let resourceID;

                    if (isOpenAccess === "true") {
                        resourceID = settings.openAccessResourceId;
                    } else {
                        resourceID = settings.picSureResourceId;
                    }

                    jqXHR.setRequestHeader("auth_or_open_resource_uuid", resourceID);
                }
            });
        },
        render: function () {
            return this;
        }
    });
});