define(["jquery", "backbone", "handlebars", "underscore", "text!search-interface/variable-info-modal-template.hbs",
        "search-interface/tag-filter-model", "text!options/modal.hbs", "search-interface/variable-info-cache",
        "search-interface/filter-model", "search-interface/categorical-filter-modal-view",
        "search-interface/numerical-filter-modal-view", "search-interface/datatable-filter-modal-view", "search-interface/datatable-export-modal-view",
        "common/modal", "search-interface/data-hierarchy-view", "picSure/settings"],
    function ($, BB, HBS, _, dataTableInfoTemplate,
              tagFilterModel, modalTemplate, variableInfoCache,
              filterModel, categoricalFilterModalView,
              numericalFilterModalView, datatableFilterModalView, datatableExportModalView,
              modal, DataHierarchyView, settings) {
        let filterUnwantedResultsOut = function (results) {
            return _.filter(results, function (result) {
                let metadata = result.result.metadata;
                return (!(metadata.columnmeta_var_id.includes('_Parent Study Accession with Subject ID')) && !(metadata.columnmeta_var_id.includes('_Topmed Study Accession with Subject ID')))
            });
        };
        var View = BB.View.extend({
            initialize: function (opts) {
                this.dataTableInfoTemplate = HBS.compile(dataTableInfoTemplate);
                this.isOpenAccess = JSON.parse(sessionStorage.getItem('isOpenAccess'));
                this.modalTemplate = HBS.compile(modalTemplate);
                this.varId = opts.varId;
                const variableInfo = variableInfoCache[opts.varId];
                const filterTitleText = this.isOpenAccess && variableInfo?.variableMetadata.columnmeta_is_stigmatized ? 'This variable is stigmatizing.' : "Click to configure a filter using this variable.";
                const disabledClass =  (this.isOpenAccess && variableInfo.variableMetadata.columnmeta_is_stigmatized) ? 'disabled-icon' : '';
                const exportTitleText = "Click to add this variable to your data retrieval.";
                const dataTreeTitleText = "Click to view the data tree for this variable.";
                variableInfo.isAuthorized = !JSON.parse(sessionStorage.getItem('isOpenAccess'));
                variableInfo.filterTitleText = filterTitleText;
                variableInfo.exportTitleText = exportTitleText;
                variableInfo.hasDataHierarchy = variableInfo?.variableMetadata?.data_hierarchy !== undefined
                                              && variableInfo?.variableMetadata?.data_hierarchy !== null
                                              && variableInfo?.variableMetadata?.data_hierarchy !== ""
                                              && variableInfo?.variableMetadata?.data_hierarchy !== "{}";
                variableInfo.dataTreeTitleText = dataTreeTitleText;
                variableInfo.disabledClass = disabledClass;
                this.dataTableData = opts.dataTableData;
                tagFilterModel.get('requiredTags').bind('add', this.tagRequired.bind(this));
                tagFilterModel.get('excludedTags').bind('add', this.tagExcluded.bind(this));
                tagFilterModel.get('unusedTags').bind('add', this.tagUnused.bind(this));
            },
            events: {
                'mouseover .badge': 'showTagControls',
                'mouseout .badge': 'hideTagControls',
                'click .require-tag-btn': 'requireTag',
                'click .exclude-tag-btn': 'excludeTag',
                'click .remove-required-tag-btn': 'removeRequiredTag',
                'click .remove-excluded-tag-btn': 'removeExcludedTag',
                'click .badge': 'clickTag',
                'click #show-all-tags-btn': 'showAllTags',
                'click #show-fewer-tags-btn': 'showFewerTags',
                'click .fa-filter': 'filterClickHandler',
                'click .export-icon': 'databaseClickHandler',
                'click .fa-sitemap': 'dataTreeClickHandler',
                'keypress .fa-filter': 'filterKeypressHandler',
                'keypress .export-icon': 'databaseKeypressHandler',
                'keypress .fa-sitemap': 'dataTreeKeypressHandler'
            },
            dataTreeKeypressHandler: function (event) {
                if (event.key.toLowerCase() === 'enter' || event.key.toLowerCase() === ' ') {
                    this.dataTreeClickHandler(event);
                }
            },
            dataTreeClickHandler: function (event) {
                if (event.target.classList.contains('disabled-icon')) {
                    return;
                }

                const dataset = _.find($('.modal .fa-sitemap'),
                    (filterButton) => {
                        return filterButton.dataset.target === 'variable';
                    }).dataset;

                let searchResult = _.find(filterUnwantedResultsOut(tagFilterModel.attributes.searchResults.results.searchResults),
                    function (variable) {
                        return variable.result.varId === dataset.id && variable.result.studyId === dataset.study;
                    });

                let dataHierarchyView = new DataHierarchyView({
                    dataHierarchy: searchResult.result.metadata.data_hierarchy
                });
                dataHierarchyView.render();
                modal.displayModal(dataHierarchyView, "Data Tree for " + searchResult.result.metadata.columnmeta_name, () => {
                    $('#search-results-div').focus();
                }, {isHandleTabs: true});
            },
            showTagControls: function (event) {
                $('.hover-control', event.target).css('visibility', 'visible').hover(function () {
                    $(this).css("visibility", "visible");
                    $(this).css("cursor", "pointer");
                });
            },
            hideTagControls: function (event) {
                $('.hover-control', event.target).css('visibility', 'hidden');
            },
            clickTag: function (event) {
                if (event.target && event.target.classList.contains('hover-control')) {
                    tagFilterModel[event.target.dataset['action']](event.target.dataset['tag']);
                }
            },
            tagRequired: function () {

                variableInfoCache[this.varId].isRequiredTag = true;
                variableInfoCache[this.varId].isExcludedTag = false;
                variableInfoCache[this.varId].isUnusedTag = false;
                this.render();
            },
            tagExcluded: function () {

                variableInfoCache[this.varId].isRequiredTag = false;
                variableInfoCache[this.varId].isExcludedTag = true;
                variableInfoCache[this.varId].isUnusedTag = false;
                this.render();
            },
            tagUnused: function () {
                variableInfoCache[this.varId].isRequiredTag = false;
                variableInfoCache[this.varId].isExcludedTag = false;
                variableInfoCache[this.varId].isUnusedTag = true;
                this.render();
            },
            filterClickHandler: function (event) {
                if (event.target.classList.contains('disabled-icon')) {
                    return;
                }
                const dataset = _.find($('.modal .fa-filter'),
                    (filterButton) => {
                        return filterButton.dataset.target === 'variable';
                    }).dataset;

                let searchResult = _.find(filterUnwantedResultsOut(tagFilterModel.attributes.searchResults.results.searchResults),
                    function (variable) {
                        return variable.result.varId === dataset.id && variable.result.studyId === dataset.study;
                    });

                if (event.target.dataset.target === 'variable') {
                    let filter = filterModel.getByVarId(searchResult.result.varId);

                    let filterViewData = {
                        searchResult: searchResult,
                        filter: filter ? filter.toJSON() : undefined
                    }

                    if (!_.isEmpty(searchResult.result.values)) {
                        this.filterModalView = new categoricalFilterModalView({
                            data: filterViewData,
                            el: $(".modal-body")
                        });
                    } else {
                        this.filterModalView = new numericalFilterModalView({
                            data: filterViewData,
                            el: $(".modal-body")
                        });
                    }
                    this.filterModalView.render();
                    modal.displayModal(this.filterModalView, "Variable-level Filter for " + searchResult.result.metadata.columnmeta_name, () => {
                        $('#search-results-div').focus();
                    }, {isHandleTabs: true});
                } else if (event.target.dataset.target === 'datatable') {
                    let filter = filterModel.getByDatatableId(event.target.dataset.id);

                    $.ajax({
                        url: window.location.origin + "/picsure/search/" + settings.dictionaryResourceId,
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            query: {
                                searchTerm: "",
                                includedTags: [event.target.dataset.id],
                                excludedTags: [],
                                returnTags: false,
                                offset: 0,
                                limit: 100000
                            }
                        }),
                        success: function (response) {
                            const varInfo = variableInfoCache[this.varId];
                            let dataTableInfo = {
                                studyId: varInfo.studyAccession,
                                dataTableName: varInfo.studyDescription
                            };
                            let filterViewData = {
                                dtId: event.target.dataset.id,
                                filter: filter ? filter.toJSON() : undefined,
                                dtVariables: response.results.searchResults,
                                dataTableInfo: dataTableInfo
                            };
                            this.filterModalView = new datatableFilterModalView({
                                model: filterViewData,
                                el: $(".modal-body"),
                            });
                            this.filterModalView.render();
                            modal.displayModal(this.filterModalView, "Dataset : " + dataTableInfo.dataTableName, () => {
                                $('#search-results-div').focus();
                            }, {isHandleTabs: true});
                        }.bind(this),
                        error: function (response) {
                            console.log(response);
                        }.bind(this)
                    });
                }
            },
            filterKeypressHandler: function (event) {
                if (event.key.toLowerCase() === 'enter' || event.key.toLowerCase() === ' ') {
                    this.filterClickHandler(event);
                }
            },
            databaseClickHandler: function (event) {
                if (event.target.classList.contains('disabled-icon')) {
                    return;
                }

                const dataset = _.find($('.modal .export-icon'),
                    (filterButton) => {
                        return filterButton.dataset.target === 'variable';
                    }).dataset;

                let searchResult = _.find(filterUnwantedResultsOut(tagFilterModel.attributes.searchResults.results.searchResults),
                    function (variable) {
                        return variable.result.varId === dataset.id && variable.result.studyId === dataset.study;
                    });

                if (event.target.dataset.target === "datatable") {
                    let filter = filterModel.getByDatatableId(event.target.dataset.id);

                    $.ajax({
                        url: window.location.origin + "/picsure/search/" + settings.dictionaryResourceId,
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            query: {
                                searchTerm: "",
                                includedTags: [event.target.dataset.id],
                                excludedTags: [],
                                returnTags: false,
                                offset: 0,
                                limit: 100000
                            }
                        }),
                        success: function (response) {
                            const varInfo = variableInfoCache[this.varId];
                            let dataTableInfo = {
                                studyId: varInfo.studyAccession,
                                dataTableName: varInfo.studyDescription
                            };
                            let exportViewData = {
                                dtId: event.target.dataset.id,
                                variable: filter ? filter.toJSON() : undefined,
                                dtVariables: response.results.searchResults,
                                dataTableInfo: dataTableInfo
                            };
                            this.exportModalView = new datatableExportModalView({
                                model: exportViewData,
                                el: $(".modal-body"),
                            });
                            this.exportModalView.render();
                            modal.displayModal(this.exportModalView, "Dataset : " + dataTableInfo.dataTableName, () => {
                                $('#search-results-div').focus();
                            }, {isHandleTabs: true});
                        }.bind(this),
                        error: function (response) {
                            console.log(response);
                        }.bind(this)
                    });


                } else if (event.target.dataset.target === "variable") {
                    this.toggleExportClasses(event.target);
                    filterModel.toggleExportField(searchResult);
                }

            },
            toggleExportClasses: function (target) {
                if (target.classList.contains('glyphicon-log-out')) {
                    target.classList.remove('glyphicon', 'glyphicon-log-out');
                    target.classList.add('fa-regular', 'fa-square-check');
                } else {
                    target.classList.remove('fa-regular', 'fa-square-check');
                    target.classList.add('glyphicon', 'glyphicon-log-out');
                }
            },
            databaseKeypressHandler: function (event) {
                if (event.key.toLowerCase() === 'enter' || event.key.toLowerCase() === ' ') {
                    this.databaseClickHandler(event);
                }
            },
            render: function () {
                this.$el.html(this.dataTableInfoTemplate(variableInfoCache[this.varId]));
            }
        });

        return View;
    });
