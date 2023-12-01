define(["jquery", "backbone", "handlebars", "text!studyAccess/studyAccess.hbs", "text!studyAccess/studies-data.json",
        "common/transportErrors", "picSure/queryBuilder", "picSure/settings", "common/spinner",
        "overrides/outputPanel", "picSure/search", "studyAccess/studyAccessUtility"],
    function($, BB, HBS, studyAccessTemplate, studyAccessConfiguration,
             transportErrors, queryBuilder, settings, spinner,
             outputPanelOverrides, search, studyAccessUtility){
        var studyAccess = {
            freezeMsg: "(Current TOPMed data is Freeze5b)",
        };

        // build view
        studyAccess.View = BB.View.extend({
            tagName: "div",
            template: studyAccess.studyAccessTemplate,
            initialize: function(){
                HBS.registerHelper('valueOrNA', function(value){
                    return value == -1 ? "n/a" : value;
                });

                // setup the output template
                this.template = HBS.compile(studyAccessTemplate);

                // extract the consent identifiers from the query template
                let session = JSON.parse(sessionStorage.getItem("session"));
                this.authorizedAccess = session.privileges && session.privileges.includes("FENCE_AUTHORIZED_ACCESS");

                this.records = studyAccessUtility.groupRecordsByAccess();
            },
            events:{
                "click .clickable-button": "buttonClickHandler"
            },
            buttonClickHandler: function(event) {
                if ($(event.target).data("href")) {
                    window.history.pushState({}, "", $(event.target).data("href"));
                }
            },
            render: function() {
                // get counts for studies and participants
                this.records.freeze_msg = studyAccess.freezeMsg;
                this.records.authorizedAccess = !!this.authorizedAccess;

                this.$el.html(this.template(this.records));

                this.dataAccessTable = $('#data-access-table').DataTable({
                    data: [...this.records.permitted, ...this.records.denied],
                    searching: true,
                    paging: false,
					ordering: true,
                    fixedColumns: false,
                    responsive: true,
                    tabIndex: -1,
                    order: [[1, 'asc']],
                    columns: [
                        {title:'Access', data:null},
                        {title:'Abbreviation', data:'abbreviated_name'},
                        {title:'Name',data:'full_study_name'},
                        {title:'Study Focus',data:'study_focus'},
                        {title:'Study Design', data:'study_design'},
                        {title:'Clinical Variables',data:'clinical_variable_count'},
                        {title:'Participants with Phenotypes',data:'clinical_sample_size'},
                        {title:'Samples Sequenced',data:'genetic_sample_size'},
                        {title:'Additional Infomation',data:'additional_information'},
                        {title:'Consents',data:'consent_group_name'},
                        {title:'Accession',data:'accession'},
                    ],
                    columnDefs: [
                        {
                            targets: 0,
                            className: 'dt-center',
                            type: 'string'
						},
                        {
                            targets: [1, 3, 4, 5, 6, 7, 10],
                            className: 'dt-center',
                            type: 'string'
						},
                        {
                            targets: [2,8,9],
                            className: 'dt-left',
                            type: 'string'
						},
                        {
                            render: function (data, type, row, meta) {
                                if (data.isGranted === true) {
                                    return '<span class="btn btn-default disabled">Granted</span>';
                                } else if (data.isSuspended === true) {
                                    return '<span aria-label="This button is hidden while the study is suspended."></span>';
                                }
                                return '<a href="'+ data.request_access +'" target="_blank" aria-label="Clicking here will take you to the given link in another tab." ' +
                                    'title="Clicking here will take you to the given link in another tab"><span class="btn btn-primary btn-blue" aria-label="Request access to '+data.full_study_name+'. This link will open in a new browser tab.">Request</span></a>';
                            },
                            type: 'string',
                            targets: 0
                        }
                    ]
                });
            }
        });

        return studyAccess;
    });
