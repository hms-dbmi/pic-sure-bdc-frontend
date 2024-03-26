define(["backbone", "handlebars", 'underscore', "picSure/settings", "picSure/queryBuilder", "overrides/outputPanel", "search-interface/tag-filter-model", "search-interface/search-util"],
    function (BB, HBS, _, settings, queryBuilder, output, tagFilterModel, searchUtil) {

        let FilterModel = BB.Model.extend({
            defaults: {
                activeFilters: new BB.Collection,
                exportFields: new BB.Collection,
                exportColumns: new BB.Collection,
                automaticFilters: new BB.Collection,
                totalPatients: 0,
                totalVariables: 4,
                estDataPoints: 0,
            },
            initialize: function (opts) {
                this.set('activeFilters', new BB.Collection);
                this.set('exportFields', new BB.Collection);
                this.set('exportColumns', new BB.Collection);
                let autoFilters = new BB.Collection;
                autoFilters.add(this.createResultModel('Patient Id', 'Patient ID', 'Internal PIC-SURE participant identifier', 'categoricalAuto', '_patient_id'));
                if (settings.include_bdc_specific_filters === undefined || settings.include_bdc_specific_filters === true) {
                    autoFilters.add(this.createResultModel('_Parent Study Accession with Subject ID', 'Parent Study Accession with Subject ID', 'Parent study accession number and subject identifier', 'categoricalAuto', '_Parent Study Accession with Subject ID'));
                    autoFilters.add(this.createResultModel('_Topmed Study Accession with Subject ID', 'TOPMed Study Accession with Subject ID', 'TOPMed study accession number and subject identifier', 'categoricalAuto', '_Topmed Study Accession with Subject ID'));
                }
                this.set('autoFilters', autoFilters);
                let model = this;
                _.each(this.get('autoFilters').models, function (variable) {
                    model.addExportColumn(variable.attributes, 'auto');
                })
                HBS.registerHelper("filter_type_is", function (type, context) {
                    return context.type === type;
                });
            },
            createResultModel: function (varId, name, description, dataType, hpdsPath, values) {
                return {

                    result: {
                        values: values ? values : {},
                        metadata: {
                            columnmeta_var_id: varId,
                            columnmeta_name: name,
                            columnmeta_description: description,
                            columnmeta_data_type: dataType,
                            columnmeta_hpds_path: hpdsPath
                        }
                    }
                };
            },
            addCategoryFilter: function (searchResult, values) {
                let existingFilterForVariable = this.getByVarId(searchResult.result.varId);
                if (existingFilterForVariable !== undefined) {
                    this.get('activeFilters').remove(existingFilterForVariable, {silent: true});
                }
                this.get('activeFilters').add({
                    type: 'category',
                    category: this.generateVariableCategory(searchResult),
                    values: values,
                    searchResult: searchResult,
                    filterType: "restrict",
                    isHarmonized: searchUtil.isStudyHarmonized(searchResult.result.metadata.columnmeta_study_id),
                    topmed: searchResult.result.metadata.columnmeta_var_id.includes('phv'),
                });
                tagFilterModel.requireTag(searchResult.result.metadata.columnmeta_study_id);
                this.addExportColumn(searchResult, 'filter', undefined, values);
            },
            addNumericFilter: function (searchResult, min, max) {
                let existingFilterForVariable = this.getByVarId(searchResult.result.varId);
                if (existingFilterForVariable !== undefined) {
                    this.get('activeFilters').remove(existingFilterForVariable, {silent: true});
                }
                this.get('activeFilters').add({
                    type: 'numeric',
                    searchResult: searchResult,
                    category: this.generateVariableCategory(searchResult),
                    min: min,
                    max: max,
                    filterType: min === "" ? "lessThan" : max === "" ? "greaterThan" : "between",
                    isHarmonized: searchUtil.isStudyHarmonized(searchResult.result.metadata.columnmeta_study_id),
                    topmed: searchResult.result.varId.includes('phv'),
                });
                tagFilterModel.requireTag(searchResult.result.metadata.columnmeta_study_id);
                this.addExportColumn(
                    searchResult, 'filter', undefined, undefined,
                    min === "" ? searchResult.result.metadata.columnmeta_min : min,
                    max === "" ? searchResult.result.metadata.columnmeta_max : max
                );
                this.trigger('change', this, {});
            },
            addRequiredFilter: function (searchResult) {
                let existingFilterForVariable = this.getByVarId(searchResult.result.varId);
                if (existingFilterForVariable !== undefined) {
                    this.get('activeFilters').remove(existingFilterForVariable, {silent: true});
                }
                this.get('activeFilters').add({
                    type: 'required',
                    searchResult: searchResult,
                    category: this.generateVariableCategory(searchResult),
                    filterType: "any",
                    isHarmonized: searchUtil.isStudyHarmonized(searchResult.result.metadata.columnmeta_study_id),
                    topmed: searchResult.result.metadata.columnmeta_var_id.includes('phv'),
                });
                tagFilterModel.requireTag(searchResult.result.metadata.columnmeta_study_id);
                this.addExportColumn(searchResult, 'filter', undefined, searchResult.result.values);
                this.trigger('change', this, {});
            },
            addDatatableFilter: function (datatableSelections) {
                let existingFilterForVariable = this.getByDatatableId(datatableSelections.searchResult.result.dtId);
                if (existingFilterForVariable !== undefined) {
                    this.get('activeFilters').remove(existingFilterForVariable, {silent: true});
                }
                this.get('activeFilters').add({
                    type: 'datatable',
                    dtId: datatableSelections.dtId,
                    variables: datatableSelections.variables,
                    category: datatableSelections.title,
                    filterType: "anyRecordOf",
                    datatable: true,
                    isHarmonized: searchUtil.isStudyHarmonized(datatableSelections.searchResult.result.metadata.columnmeta_study_id),
                    topmed: datatableSelections.searchResult.result.metadata.columnmeta_var_id.includes('phv'),
                    searchResult: datatableSelections.searchResult
                });
                tagFilterModel.requireTag(datatableSelections.searchResult.result.metadata.columnmeta_study_id);
                this.trigger('change', this, {});
            },
            toggleExportField: function (searchResult) {
                var existingField = this.get("exportFields").find((filter) => {
                    return filter.attributes.metadata.columnmeta_var_id === searchResult.result.metadata.columnmeta_var_id &&
                        filter.attributes.metadata.columnmeta_study_id === searchResult.result.metadata.columnmeta_study_id;
                });
                if (existingField === undefined) {
                    this.addExportField(searchResult);
                } else {
                    this.removeExportField(existingField);
                }
            },
            isExportField: function (searchResult) {
                var existingField = this.get("exportFields").find((filter) => {
                    return filter.attributes.metadata.columnmeta_var_id === searchResult.result.metadata.columnmeta_var_id;
                });
                return existingField !== undefined;
            },
            isExportFieldFromId: function (varId, studyId) {
                var existingField = this.get("exportFields").find((filter) => {
                    return filter.attributes.metadata.columnmeta_var_id === varId &&
                        filter.attributes.metadata.columnmeta_study_id === studyId;
                });
                return existingField !== undefined;
            },
            isExportColFromId: function (varId, studyId) {
                const existingField = this.get("exportColumns").find((filter) => {
                    return filter.get('variable').metadata.columnmeta_var_id === varId &&
                        filter.get('variable').metadata.columnmeta_study_id === studyId;
                });
                return existingField !== undefined;
            },
            addExportField: function (searchResult) {
                this.get("exportFields").add(searchResult.result);
                this.addExportColumn(searchResult, 'export');
            },
            removeExportField: function (existingField) {
                this.get("exportFields").remove(existingField);
                this.removeExportColumn(existingField.attributes, 'export');
            },
            //function specifically for updating only variable and est data point values while in package view without having to run the query
            updateExportValues: function () {
                let variableCount = _.size(this.get('exportColumns'));
                this.set("estDataPoints", variableCount * this.get("totalPatients"));
                this.set("totalVariables", variableCount);
            },

            addGenomicFilter: function (variantInfoFilters, previousUniqueId = 0) {
                let existingFilterForGenomic = this.get('activeFilters').find((filter) => {
                    return filter.get('type') === 'genomic'
                    // //if we want to allow multiple genomic filters uncomment this line and the one in the genomic filter modal view
                    //&& filter.get('variantInfoFilters').categoryVariantInfoFilters.__uniqueid === previousUniqueId;
                });
                if (existingFilterForGenomic !== undefined) {
                    this.get('activeFilters').remove(existingFilterForGenomic, {silent: true});
                }
                this.get('activeFilters').add({
                    type: 'genomic',
                    filterType: 'genomic',
                    genomic: true,
                    variantInfoFilters: variantInfoFilters,
                    topmed: false
                });
            },
            removeByIndex: function (index) {
                let removedFilter = this.get('activeFilters').remove(this.get('activeFilters').at(index));
                if (removedFilter.attributes.type === 'datatable') {
                    this.removeExportColumn(null, null, removedFilter.attributes.dtId);
                } else if (removedFilter.attributes.type !== 'genomic') {
                    this.removeExportColumn(removedFilter.attributes.searchResult.result, 'filter');
                }

            },
            getByIndex: function (index) {
                return this.get('activeFilters').at(index).attributes;
            },
            getByVarId: function (varId) {
                return this.get('activeFilters')
                    .filter((filter) => filter.get('type') !== 'genomic' && filter.get('type') !== 'datatable')
                    .find((filter) => {
                        return filter.get('searchResult').result.varId === varId;
                    });
            },
            getByDatatableId: function (dtId) {
                return this.get('activeFilters').find((filter) => {
                    return filter.get('dtId') === dtId;
                });
            },
            generateVariableCategory: function (searchResult) {
                return "\\" + searchResult.result.dtId + "\\" + searchResult.result.studyId + "\\" + searchResult.result.varId;
            },
            generateDatatableCategory: function (searchResult) {
                return "\\" + searchResult.result.dtId + "\\" + searchResult.result.studyId + "\\";
            },
            addExportColumn: function (searchResult, type, source, selectedValues, selectedMin, selectedMax) {
                let existingColumn = _.find(this.get('exportColumns').models, (model) => {
                    return model.get('variable').metadata.columnmeta_var_id === searchResult.result.metadata.columnmeta_var_id &&
                        model.get('variable').metadata.columnmeta_study_id === searchResult.result.metadata.columnmeta_study_id;
                });
                if (existingColumn) {
                    existingColumn = existingColumn.attributes;
                    //tree for hierarchy of replacement
                    if ((type == 'filter' && existingColumn.type === 'export') || (type == 'filter' && existingColumn.type === 'filter')) {
                        this.removeExportColumn(searchResult.result, existingColumn.type);
                        this.get('exportColumns').add({
                            type: type,
                            variable: searchResult.result,
                            source: source,
                            selectedValues: selectedValues,
                            selectedMin: selectedMin,
                            selectedMax: selectedMax
                        });
                    } else if (type == 'filter' && existingColumn.type === 'auto') {
                        this.get('exportColumns').add({
                            type: type,
                            variable: searchResult.result,
                            source: source,
                            selectedValues: selectedValues,
                            selectedMin: selectedMin,
                            selectedMax: selectedMax
                        });
                    }
                } else {
                    this.get('exportColumns').add({
                        type: type,
                        variable: searchResult.result,
                        source: source,
                        selectedValues: selectedValues,
                        selectedMin: selectedMin,
                        selectedMax: selectedMax
                    });
                }

                if (type != 'auto' && source == undefined) {
                    this.updateConsents();
                }
            },
            removeExportColumn: function (result, type, source) {
                if (source) {
                    let columns = _.filter(this.get('exportColumns').models, (model) => {
                        return model.attributes.source === source;
                    });
                    this.get('exportColumns').remove(columns);
                } else {
                    let column = type ?
                        _.find(this.get('exportColumns').models, (model) => {
                            return model.get('variable').metadata.columnmeta_var_id === result.metadata.columnmeta_var_id &&
                                model.get('variable').metadata.columnmeta_study_id === result.metadata.columnmeta_study_id &&
                                model.attributes.type === type;
                        }) :
                        _.find(this.get('exportColumns').models, (model) => {
                            return model.get('variable').metadata.columnmeta_var_id === result.metadata.columnmeta_var_id &&
                                model.get('variable').metadata.columnmeta_study_id === result.metadata.columnmeta_study_id;
                        });
                    if (column) {
                        this.get('exportColumns').remove(column);
                        if (column.attributes.type != 'auto') {
                            this.updateConsents();
                        }
                    }
                }
            },
            initializeConsents: function () {
                var parsedSess = JSON.parse(sessionStorage.getItem("session"));
                const resourceUUID = JSON.parse(sessionStorage.getItem('isOpenAccess')) ? settings.openAccessResourceId : settings.picSureResourceId;
                var queryTemplate;
                if (parsedSess) {
                    if (parsedSess.queryTemplate && resourceUUID !== settings.openAccessResourceId) {
                        queryTemplate = JSON.parse(parsedSess.queryTemplate)
                    } else {
                        queryTemplate = queryBuilder.getDefaultQueryTemplate();
                    }
                    if (queryTemplate && queryTemplate.categoryFilters) {
                        for (varId in queryTemplate.categoryFilters) {
                            let values = queryTemplate.categoryFilters[varId];
                            if (varId.includes(settings.consentsPath)) {
                                let consentsFilter = this.createResultModel('_consents', 'Consent Groups', 'Study accession number and consent code', 'categorical', settings.consentsPath, values);
                                this.get('autoFilters').add(consentsFilter);
                            } else if (varId.includes(settings.harmonizedConsentPath)) {
                                this.get('autoFilters').add(this.createResultModel('_harmonized_consent', 'Harmonized consent groups', 'Consent code for harmonized data', 'categorical', settings.harmonizedConsentPath, values));
                            } else if (varId.includes(settings.topmedConsentPath)) {
                                this.get('autoFilters').add(this.createResultModel('_topmed_consent', 'TOPMed consent groups', 'Consent code for TOPMed data', 'categorical', settings.topmedConsentPath, values));
                            }
                        }
                    }
                    this.updateExportValues();

                }
            },
            updateConsents: function () {


                //if a variable is added to export which is harmonized, and the user has not chosen specific harmonized consent values in a filter, the harmonized consent field is added to export as an automatic field. otherwise, initiate check for/removal of existing automatic harmonized consent field
                if (_.filter(this.get('exportColumns').models, function (column) {
                        return column.attributes.variable.metadata.columnmeta_hpds_path.toLowerCase().includes(settings.harmonizedPath.toLowerCase())
                    }).length > 0 &&
                    _.filter(this.get('activeFilters').models, function (filter) {
                        if (filter.attributes.filterType === 'genomic') {
                            return false;
                        } else {
                            return filter.attributes.searchResult.result.metadata.columnmeta_var_id.includes('harmonized_consent')
                        }
                    }).length == 0
                ) {
                    let existingColumn = _.find(this.get('autoFilters').models, function (filter) {
                        return filter.attributes.result.metadata.columnmeta_hpds_path.includes(settings.harmonizedConsentPath)
                    });
                    if (existingColumn) {
                        this.addExportColumn(existingColumn.attributes, 'auto');
                    }
                } else {
                    let existingColumn = _.find(this.get('autoFilters').models, function (filter) {
                        return filter.attributes.result.metadata.columnmeta_hpds_path.includes(settings.harmonizedConsentPath)
                    });
                    if (existingColumn) {
                        this.removeExportColumn(existingColumn.attributes.result, 'auto');
                    }
                }


                //checks for filters tagged as genomic, and that topmed consents have not been specified, and adds topmed consents as auto export column if both conditions are met. Otherwise removes any pre-existing automatic topmed consents column
                if (_.filter(this.get('activeFilters').models, function (column) {
                        return column.attributes.filterType === 'genomic';
                    }).length > 0
                    && _.filter(this.get('activeFilters').models, function (filter) {
                        if (filter.attributes.filterType !== 'genomic') {
                            return filter.attributes.searchResult.result.metadata.columnmeta_var_id.includes('topmed_consents')
                        } else {
                            return false
                        }
                    }).length == 0) {
                    let existingColumn = _.find(this.get('autoFilters').models, function (filter) {
                        return filter.attributes.result.metadata.columnmeta_hpds_path.includes(settings.topmedConsentPath)
                    });
                    if (existingColumn) {
                        this.addExportColumn(existingColumn.attributes, 'auto');
                    }
                } else {
                    let existingColumn = _.find(this.get('autoFilters').models, function (filter) {
                        return filter.attributes.result.metadata.columnmeta_hpds_path.includes(settings.topmedConsentPath)
                    });
                    if (existingColumn) {
                        this.removeExportColumn(existingColumn.attributes.result, 'auto');
                    }
                }


                //checks if a _consents filter has been manually applied by the user, and if so initiates removal of any potential pre-existing automatic _consents column. If not, the _consents column is added to the export columns as an automatic export field
                if (_.filter(this.get('activeFilters').models, function (filter) {
                    if (filter.attributes.filterType !== 'genomic') {
                        return filter.attributes.searchResult.result.metadata.columnmeta_var_id === ('_consents')
                    } else {
                        return false;
                    }
                }).length == 0) {
                    let existingColumn = _.find(this.get('autoFilters').models, function (filter) {
                        return filter.attributes.result.metadata.columnmeta_hpds_path.includes(settings.consentsPath)
                    });
                    if (existingColumn) {
                        this.addExportColumn(existingColumn.attributes, 'auto');
                    }
                } else {
                    let existingColumn = _.find(this.get('autoFilters').models, function (filter) {
                        return filter.attributes.result.metadata.columnmeta_hpds_path.includes(settings.consentsPath)
                    });
                    if (existingColumn) {
                        this.removeExportColumn(existingColumn.attributes.result, 'auto');
                    }
                }


                this.updateExportValues();
            }
        });
        return new FilterModel();
    });
