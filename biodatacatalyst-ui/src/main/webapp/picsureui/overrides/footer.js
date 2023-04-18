define(["handlebars", "text!overrides/footer.hbs", "common/modal", "common/session", "common/pic-sure-dialog-view"],
    function (HBS, template, modal, session, dialog) {
        return {
            /*
             * The render function for the footer can be overridden here.
             */
            render: function () {
                let title = window.location.pathname.split("/");
                title = title[2]; // begins with empty string
                switch (title) {
                    case "dataAccess":
                        title = "Data Access";
                        break;
                    case "openAccess":
                        title = "Open Access";
                        break;
                    case "queryBuilder":
                        title = "Authorized Builder";
                        break;
                    default:
                        title = "";
                        break;
                }
                title = "BioData Catalyst Powered by PIC-SURE: " + title;
                if (!$('title').length) {
                    $('head').append("<title></title>");
                }
                $('title').html(title);
                this.$el.html(HBS.compile(template)());

                $(document).on('click', 'a[target="_blank"]', function (event) {
                        event.preventDefault();

                        let closeModal = () => {
                            $('.close')?.get(0).click();
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
                                    closeModal();
                                    window.open(event.target.href, '_blank');
                                },
                                classes: "btn btn-primary"
                            }
                        ];
                        const modalMessage = [
                            "This external website will be opened as a new tab in your browser.",
                            "Are you sure you want to leave BDC-PIC-SURE?"
                        ];

                        const dialogView = new dialog({
                            options: dialogOption,
                            messages: modalMessage,
                        });
                        modal.displayModal(
                            dialogView
                            , "Leaving BDC-PIC-SURE"
                            , () => {
                            }
                            , {handleTabs: true, width: "450px"}
                        );
                });
            }
        };
    });
