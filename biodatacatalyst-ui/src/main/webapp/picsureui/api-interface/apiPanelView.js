define(["jquery", "handlebars", "backbone", "text!api-interface/apiPanel.hbs", "header/userProfile"
        , "picSure/userFunctions", "api-interface/bdcTerraLinkView", "common/modal"],
    function ($, HBS, BB, apiPanelTemplate, UserProfile, userFunctions, BdcTerraView, modal) {

        return BB.View.extend({
            initialize: function (opts) {
                this.template = HBS.compile(apiPanelTemplate);
            },
            events: {
                'click #bdc-powered-by-terra': "_openBDCTerraModal",
            },
            _openBDCTerraModal: function () {
                const bdcTerraView = new BdcTerraView();
                modal.displayModal(
                    bdcTerraView,
                    "BDC Powered by Terra",
                    () => {
                    },
                    {handleTabs: true, width: "600px"}
                );
            },
            render: function () {
                userFunctions.meWithToken(this, (user) => {
                    let userProfile = new UserProfile(user);
                    $('#user-profile').html(userProfile.$el);
                    userProfile.render();
                });

                this.$el.html(this.template);
                return this;
            }
        });
    });

