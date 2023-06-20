define([
        "backbone",
        "jquery",
        "search-interface/modal",
        "common/pic-sure-dialog-view"
    ],
    function (BB, $, modal, dialog) {
        function handleParentModal(e, sourceEvent) {
            let parent = $(sourceEvent.target).parent();
            while (parent.length && !parent.is('body') && !parent.is('.modal-content')) {
                parent = parent.parent();
            }

            // if we traversed up the parents of the source and found the .modal-content class,
            // then the source is a child of a modal window
            if (parent.is('.modal-content')) {
                $('#modal-window .modal-dialog').show();
                $("body").append('<div class="modal-backdrop in"></div>');

                $('#modalDialog').on('hidden.bs.modal', function (e) {
                    e.preventDefault();

                    $('#modal-window .modal-dialog').hide();
                    $(".modal-backdrop").hide();
                });
            }
        }

        return BB.View.extend({
            initialize: function (opts) {
                this.data = opts || {};
            },
            render: function (sourceEvent, url = undefined) {
                let closeModal = function (e) {
                    e.preventDefault();

                    $('#modal-redirect .close')?.get(0).click();
                    handleParentModal(e, sourceEvent);
                    if (sourceEvent) {
                        sourceEvent.target.focus();
                    }
                };

                const dialogOption = [
                    {
                        title: "Cancel",
                        "action": (e) => {
                            closeModal(e);
                        },
                        classes: "btn btn-default"
                    },
                    {
                        title: "Continue",
                        "action": (e) => {
                            window.open((url === undefined ? sourceEvent.target.href : url), '_blank');
                            closeModal(e);
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
            }
        });
    });