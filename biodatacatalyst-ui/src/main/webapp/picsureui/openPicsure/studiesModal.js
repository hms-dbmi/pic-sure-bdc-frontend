define([
    'backbone',
    'handlebars',
    'text!openPicsure/studiesModalView.hbs',
    "picSure/settings",
    "openPicsure/outputModel",
    "common/keyboard-nav",
    "search-interface/search-util"
], function (BB, HBS, studiesModalTemplate, settings, outputModel, keyboardNav, searchUtil) {
    return BB.View.extend({
        initialize: function (opts) {
            this.studiesModalTemplate = HBS.compile(studiesModalTemplate);
            this.showZeroParticipants = false;
            keyboardNav.addNavigableView("studiesModal", this);
            this.on({
                'keynav-arrowup document': this.previousSearchResult,
                'keynav-arrowdown document': this.nextSearchResult,
                'keynav-arrowright document': this.nextPage,
                'keynav-arrowleft document': this.previousPage
            });
        },
        events: {
            'click #showAllStudies': 'handleShowAllStudiesClick',
            'keypress #tool-suite-table-studies-modal-datatable': 'resultKeyHandler',
            'focus #tool-suite-table-studies-modal-datatable': 'resultsDatatableFocus',
            'blur #tool-suite-table-studies-modal-datatable': 'resultsBlur',
        },
        resultsBlur: function () {
            this.focusedSection = undefined;
            keyboardNav.setCurrentView(undefined);
            this.$("#tool-suite-table-studies-modal-datatable .focused-search-result").removeClass('focused-search-result');
        },
        resultsDatatableFocus: function (event) {
            this.focusedSection = '#tool-suite-table-studies-modal-datatable';
            keyboardNav.setCurrentView("studiesModal");
        },
        resultKeyHandler: function (event) {
            if (event.key.toLowerCase() === 's') {
                if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
                    event.preventDefault();
                    this.isSearching = !this.isSearching;
                    this.render();
                }
            }
            event.target = $('.focused-search-result')[0];
            if (event.key.toLowerCase() === 'i' || event.key.toLowerCase() === 'enter' || event.key.toLowerCase() === 'SPACE') {
                event.preventDefault();
                this.requestAccessClickHandler(event);
            }
        },
        handleShowAllStudiesClick: function () {
            this.showZeroParticipants = !this.showZeroParticipants;
            this.render();
        },
        previousSearchResult: function (event) {
            let results = this.$("#tool-suite-table-studies-modal-datatable tbody tr");
            const focused = this.$el.find(".focused-search-result");
            if (focused.length === 0) {
                $(results[results.length - 1]).addClass("focused-search-result");
            } else {
                this.adjustFocusedRow(1, results);
            }
        },
        nextSearchResult: function (event) {
            const results = this.$("#tool-suite-table-studies-modal-datatable tbody tr");
            const focused = this.$el.find(".focused-search-result");
            if (focused.length === 0) {
                $(results[0]).addClass("focused-search-result");
            } else {
                this.adjustFocusedRow(-1, results);
            }
        },
        nextPage: function () {
            $('#tool-suite-table-studies-modal-datatable').DataTable().page('next').draw('page');
            $('#aria-live').html("Now on page " + ($('#tool-suite-table-studies-modal-datatable').DataTable().page() + 1) + " of the results region.");
        },
        previousPage: function () {
            $('#tool-suite-table-studies-modal-datatable').DataTable().page('previous').draw('page');
            $('#aria-live').html("Now on page " + ($('#tool-suite-table-studies-modal-datatable').DataTable().page() + 1) + " of the results region.");
        },
        adjustFocusedRow: function (adjustment, results) {
            let focusedRow = adjustment;
            for (let x = 0; x < results.length; x++) {
                if ($(results[x]).hasClass('focused-search-result')) {
                    focusedRow = x;
                    $(results[x]).removeClass('focused-search-result');
                }
            }

            focusedRow = focusedRow - adjustment;
            if (focusedRow === -1) {
                focusedRow = results.length - 1;
            }
            if (focusedRow === results.length) {
                focusedRow = 0;
            }

            $(results[focusedRow]).addClass('focused-search-result');
            $("#tool-suite-table-studies-modal-datatable").attr("aria-activedescendant", results[focusedRow].id);

            searchUtil.ensureElementIsInView(results[focusedRow]);
        },
        requestAccessClickHandler(event) {
            $(event.target).find(".request-access-button").click();
        },
        displayTable: function (data) {
            let showAll = this.showZeroParticipants;

            // Filter out studies that have a missing value for any of the used columns in the table
            let filteredData = data.filter(function (item) {
                let requiredCols = ['display_name', 'identifier', 'consents', 'study_matches', "request_access"];
                return requiredCols.every(function (property) {
                    if (property === 'study_matches' && !showAll) {
                        // Only show studies with participants. If showStudiesWithZeroParticipants is true, then show all studies.
                        return item.hasOwnProperty(property) && item[property] != null && item[property] !== '' &&
                            (item[property] > 0 || (typeof item[property] === 'string' && item[property] !== '0'));
                    }

                    return item.hasOwnProperty(property) && item[property] != null && item[property] !== '';
                });
            });

            let sortedData = filteredData.sort(function (a, b) {
                // Sort by number of study_matches, descending
                return b.study_matches - a.study_matches;
            });

            // Table ID: tool-suite-table-studies-modal
            let studiesDataTable = $('#tool-suite-table-studies-modal-datatable').DataTable({
                "data": sortedData,
                "searching": true,
                "paging": true,
                "ordering": false,
                "responsive": true,
                "tabIndex": 0,
                "lengthMenu": [[5, 10, 25, 50, 100], [5, 10, 25, 50, 100]],
                "columns": [
                    {title: "Abbreviation", data: "display_name"},
                    {title: "Accession", data: "identifier"},
                    {title: "Counts by Consent Code", data: "consents"},
                    {title: "Access", data: null}
                ],
                "columnDefs": [
                    {
                        targets: [0, 1, 3],
                        className: "dt-center"
                    },
                    {
                        targets: 3,
                        type: 'string',
                        render: function (data, type, row, meta) {
                            // Data is always null. Row is the entire row object.
                            if (row.hasPermission === true) {
                                return '<span class="btn btn-default" disabled>Granted</span>';
                            }
                            return '<a href="' + row.request_access + '" target="_blank" aria-label="Clicking here will take you to the given link in another tab." ' +
                                'title="Clicking here will take you to the given link in another tab" class="request-access btn btn-primary btn-blue" ><span aria-label="Request access to ' + row.name + '. This link will open in a new browser tab.">Request</span></a>';
                        }
                    },
                    {
                        targets: 2,
                        type: 'string',
                        render: function (data, type, row, meta) {
                            // data is a list of consents.
                            let consentListItems = [];
                            $.each(data, (index, value) => {
                                let item =
                                    `<li title="${value.consent_group_name}">
                                    <span aria-label="${value.consent_group_name} with ${(value.study_matches ? value.study_matches : "")} participants">
                                        ${value.short_title}
                                    </span>
                                    <span class="study-count">${(value.study_matches ? value.study_matches : "")}</span>
                                </li>`;
                                consentListItems.push(item);
                            });
                            return `<div class="consent-list row"><ul>${consentListItems.join('')}</ul></div>`;

                        }
                    }
                ]
            });

            $("#tool-suite-table-studies-modal-datatable_length select").attr("tabindex", "0");
            $("#tool-suite-table-studies-modal-datatable_filter input").attr("tabindex", "0");
        },
        render: function () {
            this.$el.html(this.studiesModalTemplate());
            this.displayTable(outputModel.get("studies"));

            // Update the button text
            if (!this.showZeroParticipants) {
                $("#showAllStudies").text("Include studies with 0 participants");
            } else {
                $("#showAllStudies").text("Show only studies with participants");
            }
        }
    });
});