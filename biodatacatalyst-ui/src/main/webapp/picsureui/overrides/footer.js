define(["handlebars",
        "text!overrides/footer.hbs",
        "search-interface/modal",
        "common/session",
        "common/pic-sure-dialog-view",
        "middleware/middleware",
        "common/redirect-modal"
    ],
    function (HBS, template, modal, session, dialog, Middleware, redirectModal) {
        return {
            /*
             * The render function for the footer can be overridden here.
             */
            render: function () {
                new Middleware();

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

                let redirect = new redirectModal();

                // Using .off() to prevent multiple event handlers from being attached
                $(document).off('click', 'a[target="_blank"]').on('click', 'a[target="_blank"]', function (event) {
                    event.preventDefault();

                    redirect.render(event);
                });
            }
        };
    });
