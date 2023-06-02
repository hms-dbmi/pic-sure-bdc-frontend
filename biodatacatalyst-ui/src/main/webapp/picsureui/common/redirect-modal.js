define([
    "backbone",
    "jquery",
    "search-interface/modal",
    "common/pic-sure-dialog-view"
    ],
    function(BB, $, modal, dialog) {
    return BB.View.extend({
        initialize: function (opts) {
            this.data = opts || {};
        },
        render: function (sourceEvent, url = undefined) {
            let closeModal = function () {
                $('#modal-redirect .close')?.get(0).click();
            };

            const dialogOption = [
                {
                    title: "Cancel",
                    "action": () => {
                        closeModal();
                    },
                    classes: "btn btn-default"
                },
                {
                    title: "Continue",
                    "action": () => {
                        window.open((url === undefined ? sourceEvent.target.href : url), '_blank');
                        closeModal();
                    },
                    classes: "btn btn-primary"
                }
            ];

            const modalMessage = [
                "This external website will be opened as a new tab in your browser.",
                "Are you sure you want to leave BDC-PIC-SURE?"
            ];


            const modalContainerId = "modal-redirect";

            const dialogView = new dialog({
                options: dialogOption,
                messages: modalMessage,
                modalContainerId: modalContainerId,
            });

            // Hide the other modal container: modal-window
            $('#modal-window .modal-dialog').hide();

            modal.displayModal(
                dialogView
                , "Leaving BDC-PIC-SURE"
                , () => { sourceEvent.target.focus(); }
                , {isHandleTabs: true, width: "450px", modalContainerId: modalContainerId}
            );

            // Add additional event listener to close button
            $('#modal-redirect #close-modal-button').on('click', () => {
                event.preventDefault();

                // if the source event is in a modal, we need to show the modal-window again
                if($(sourceEvent.target).parents('.modal-content').length > 0) {
                    $('#modal-window .modal-dialog').show();

                    if ($('.modal-backdrop in').length === 0) {
                        $('body').append('<div class="modal-backdrop in"></div>');
                    }
                }
            });
        }
    });
});