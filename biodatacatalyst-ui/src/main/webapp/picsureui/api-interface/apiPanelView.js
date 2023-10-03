define([
    "jquery", "handlebars", "backbone",
    "text!api-interface/apiPanel.hbs", "psamaui/user/userToken",
    "picSure/userFunctions", "api-interface/bdcTerraLinkView",
    "common/modal", "dataset/dataset-manage"
], function (
    $, HBS, BB,
    apiPanelTemplate, userToken,
    userFunctions, BdcTerraView,
    modal, datasetManagement
) {

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
                    {isHandleTabs: true, width: "600px"}
                );
            },
            displayDatasetManagementBox: function(){
                userFunctions.meWithToken(this, (user) => {
                    const management = new datasetManagement(user);
                    $("#dataset-management-box").append(management.$el);
                    management.render();
                });
            },
            render: function () {
                userFunctions.meWithToken(this, (user) => {
                    const token = new userToken(user);
                    $('#user-profile').html(token.$el);
                    token.render();
                });

                this.displayDatasetManagementBox();

                this.$el.html(this.template);
                return this;
            }
        });
    });

