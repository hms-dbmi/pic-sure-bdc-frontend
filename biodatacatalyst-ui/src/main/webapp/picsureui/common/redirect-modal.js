define([
        "backbone",
        "jquery",
        "search-interface/modal",
        "common/pic-sure-dialog-view"
    ],
    function (BB, $, modal, dialog) {
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
                    , () => {
                        sourceEvent.target.focus();
                    }
                    , {isHandleTabs: true, width: "450px", modalContainerId: modalContainerId}
                );

                $('#modal-redirect .close').click(function () {
                    let parent = $(sourceEvent.target).parent();
                    while (parent.length && !parent.is('body') && !parent.is('.modal-content')) {
                        parent = parent.parent();
                    }

                    // If we traversed up to the body, then we clicked outside the modal
                    if (parent.is('.modal-content')) {
                        // Add a backdrop to the modal
                        if ($('.modal-backdrop in').length === 0) {
                            $('body').append('<div class="modal-backdrop in"></div>');
                        } else {
                            $('.modal-backdrop').show();
                        }
                    }

                    $('#modal-window .modal-dialog').show();
                });
            }
        });
    });