define(["jquery", "backbone", "handlebars", "text!studyAccess/studyAccess.hbs", "text!studyAccess/studies-data.json",
        "common/transportErrors", "picSure/queryBuilder", "picSure/settings", "common/spinner",
        "overrides/outputPanel", "picSure/search"],
    function($, BB, HBS, studyAccessTemplate, studyAccessConfiguration,
             transportErrors, queryBuilder, settings, spinner,
             outputPanelOverrides, search){
        const STUDY_CONSENTS = "\\_studies_consents\\";
        var studyAccess = {
            freezeMsg: "(Current TOPMed data is Freeze5b)",
            open_cnts: {},
            auth_cnts: {},
            resources: {
                open: settings.openAccessResourceId,
                auth: settings.picSureResourceId
            }
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
                let validConsents = [];
                if (session.queryTemplate) {
                    let temp = JSON.parse(session.queryTemplate);

                    if (temp && temp.categoryFilters && temp.categoryFilters["\\_consents\\"]) {
                        validConsents = temp.categoryFilters["\\_consents\\"];
                    }
                }

                // process the study data into permission granted or not groups
                this.records = {
                    permitted: [],
                    denied: [],
                    na: []
                };
                let configurationData = JSON.parse(studyAccessConfiguration);
                for (groupid in configurationData) {
                    for (idx = 0; idx < configurationData[groupid].length; idx++) {
                        // determine if logged in user is permmited access
                        let tmpStudy = configurationData[groupid][idx];
                        const cvc = parseInt(tmpStudy["clinical_variable_count"]).toLocaleString();
                        tmpStudy["clinical_variable_count"] = cvc=='-1' || cvc=='NaN' ? 'N/A' : cvc;
                        const css = parseInt(tmpStudy["clinical_sample_size"]).toLocaleString();
                        tmpStudy["clinical_sample_size"] = css=='-1' || cvc=='NaN' ? 'N/A' : css;
                        const gsc = parseInt(tmpStudy["genetic_sample_size"]).toLocaleString();
                        tmpStudy["genetic_sample_size"] = gsc=='-1' || gsc=='NaN' ? 'N/A' : gsc;

                        let studyConsent = tmpStudy["study_identifier"] + (tmpStudy["consent_group_code"] && tmpStudy["consent_group_code"] != "" ? "." + tmpStudy["consent_group_code"] : "");
                        tmpStudy['accession'] = tmpStudy["consent_group_code"] ? 
                                                tmpStudy["study_identifier"]+ "." + tmpStudy["study_version"] + "." + tmpStudy["study_phase"]+ "." + tmpStudy["consent_group_code"] :
                                                ""; // Show empty string if no consent group code (open dataset)
                        if (validConsents.includes(studyConsent)) {
                            tmpStudy['isGranted']=true;
                            this.records.permitted.push(tmpStudy);
                        } else {
                            if (!tmpStudy['authZ']) {
                                tmpStudy['isSuspended']=true;
                            }
                            if (tmpStudy["consent_group_code"] == "c0") {
                                tmpStudy['isGranted']=false;
                                this.records.na.push(tmpStudy);
                            } else {
                                this.records.denied.push(tmpStudy);
                            }
                        }
                    }
                }

                // sort by "consent group" then "abbreviated name"
                var funcSort = function (a, b) {
                	if (a["abbreviated_name"] == b["abbreviated_name"]) {
                        return (a["study_identifier"].localeCompare(b["study_identifier"]));
                    } else {
                        return (a["abbreviated_name"].localeCompare(b["abbreviated_name"]));
                    }
                };
                this.records.permitted.sort(funcSort);
                this.records.denied.sort(funcSort);
                this.records.na.sort(funcSort);

                // count the number of studies (accessible and total)
                var allRecs = [].concat(this.records.permitted, this.records.denied, this.records.na);
                var temp = allRecs.map((rec) => { return rec.study_identifier; });
                temp = [...new Set(temp)];
                studyAccess.open_cnts.studies = temp.length;
                var temp = this.records.permitted.map((rec) => { return rec.study_identifier; });
                temp = [...new Set(temp)];
                studyAccess.auth_cnts.studies = temp.length;
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
                this.records.auth_studies_cnt = studyAccess.auth_cnts.studies;
                this.records.auth_participants_cnt = studyAccess.auth_cnts.participants;
                this.records.open_participants_cnt = studyAccess.open_cnts.participants;
                this.records.freeze_msg = studyAccess.freezeMsg;
                this.records.authorizedAccess = !!this.authorizedAccess;

                this.$el.html(this.template(this.records));


                // query for participant counts of authorized and open access resources
                if (studyAccess.resources.auth) {
                    var query = queryBuilder.createQueryNew({},{}, studyAccess.resources.auth);
                    query.query.expectedResultType = "COUNT";
                    queryBuilder.updateConsentFilters(query, settings);
                    var deferredParticipants = $.ajax({
                        url: window.location.origin + "/picsure/query/sync",
                        type: 'POST',
                        headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                        contentType: 'application/json',
                        data: JSON.stringify(query),
                        success: (function(response){
                            $("#authorized-participants").html(parseInt(response).toLocaleString() + " Participants");
                        }).bind(this),
                        statusCode: {
                            401: function(){
                            }
                        },
                        error: function () {
                            $("#authorized-participants").html("0 Participants");
                            $("#authorized-participants-spinner").html("");
                        }
                    });
                    spinner.medium(deferredParticipants, "#authorized-participants-spinner", "spinner1");
                }

                if (studyAccess.resources.open !== false) {
                    search.execute("\\_studies\\",
                        function(response) {
                            let openStudies = response.suggestions.length;
                            $('#open-studies-count').html(openStudies + " Studies");

                            var query = queryBuilder.generateQueryNew({}, {}, null, studyAccess.resources.open);
                            query.query.expectedResultType = "CROSS_COUNT";
                            query.query.crossCountFields = [STUDY_CONSENTS];
                            var deferredParticipants = $.ajax({
                                url: window.location.origin + "/picsure/query/sync",
                                type: 'POST',
                                headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                                contentType: 'application/json',
                                data: JSON.stringify(query),
                                success: (function (response) {
                                    const parsedCountString = response[STUDY_CONSENTS] ? parseInt(response[STUDY_CONSENTS]).toLocaleString() + " Participants" : "Count Unavailable";
                                    $("#open-participants").html(parsedCountString);
                                }).bind(this),
                                statusCode: {
                                    401: function(){
                                    }
                                },
                                error: transportErrors.handleAll
                            });
                            spinner.medium(deferredParticipants, "#open-participants-spinner", "spinner2");
                        },
                        studyAccess.resources.open);
                }

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
