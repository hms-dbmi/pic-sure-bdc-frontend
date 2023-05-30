define([
    'backbone',
    'handlebars',
    'text!openPicsure/studiesModalView.hbs',
    "picSure/settings",
    "openPicsure/outputModel"
], function(BB, HBS, studiesModalTemplate, settings, outputModel) {
    return BB.View.extend({
        initialize: function (opts) {
            this.studiesModalTemplate = HBS.compile(studiesModalTemplate);
            this.showZeroParticipants = false;
        },
        events: {
            'click #showAllStudies': 'handleShowAllStudiesClick',
        },
        handleShowAllStudiesClick: function () {
            this.showZeroParticipants = !this.showZeroParticipants;
            this.render();
        },
        displayTable: function (data) {
            let showAll = this.showZeroParticipants;

            // Filter out studies that have a missing value for any of the used columns in the table
            let filteredData = data.filter(function(item) {
                let requiredCols = ['display_name', 'identifier', 'consents', 'study_matches', "request_access"];
                return requiredCols.every(function(property) {
                    if (property === 'study_matches' && !showAll) {
                        // Only show studies with participants. If showStudiesWithZeroParticipants is true, then show all studies.
                        return item.hasOwnProperty(property) && item[property] != null && item[property] !== '' && item[property] > 0;
                    }

                    return item.hasOwnProperty(property) && item[property] != null && item[property] !== '';
                });
            });

            let sortedData = filteredData.sort(function(a, b) {
               // Sort by number of study_matches, descending
                return b.study_matches - a.study_matches;
            });

            // Table ID: tool-suite-table-studies-modal
            let studiesDataTable = $('#tool-suite-table-studies-modal').DataTable({
                "data": sortedData,
                "searching": true,
                "paging": true,
                "ordering": false,
                "responsive": true,
                "tabIndex": -1,
                "lengthMenu": [[5, 10, 25, 50, 100], [5, 10, 25, 50, 100]],
                "columns": [
                    {title: "Abbreviation", data: "display_name"},
                    {title: "Accession", data: "identifier"},
                    {title: "Counts", data: "study_matches"},
                    {title: "Counts by Consent Code", data: "consents"},
                    {title: "Access", data: null}
                ],
                "columnDefs": [
                    {
                        targets: [0, 1, 2, 4],
                        className: "dt-center"
                    },
                    {
                        targets: 4,
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
                        targets: 3,
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
        },
        render: function () {
            this.$el.html(this.studiesModalTemplate());
            this.displayTable(outputModel.get("studies"));

            // Update the button text
            if (!this.showZeroParticipants) {
                $("#showAllStudies").text("Show studies with 0 participants");
            } else {
                $("#showAllStudies").text("Show only studies with participants");
            }
        }
    });
});