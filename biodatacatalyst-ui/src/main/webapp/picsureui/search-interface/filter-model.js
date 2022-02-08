define(["backbone", "handlebars"],
    function(BB, HBS){

        let FilterModel = BB.Model.extend({
            defaults:{
                activeFilters: new BB.Collection,
                exportFields: new BB.Collection,
            },
            initialize: function(opts){
                this.set('activeFilters', new BB.Collection);
                this.set('exportFields', new BB.Collection);
                HBS.registerHelper("filter_type_is", function(type, context){
                    return context.type===type;
                });
            },
            addCategoryFilter: function(searchResult, values) {
                let existingFilterForVariable = this.getByVarId(searchResult.result.varId);
                if(existingFilterForVariable!==undefined){
                    this.get('activeFilters').remove(existingFilterForVariable, {silent:true});
                }
                this.get('activeFilters').add({
                    type: 'category',
                    searchResult: searchResult,
                    category: this.generateVariableCategory(searchResult),
                    values: values,
                    searchResult: searchResult,
                    filterType: "restrict"
                });
            },
            addNumericFilter: function(searchResult, min, max) {
                let existingFilterForVariable = this.getByVarId(searchResult.result.varId);
                if(existingFilterForVariable!==undefined){
                    this.get('activeFilters').remove(existingFilterForVariable, {silent:true});
                }
                this.get('activeFilters').add({
                    type: 'numeric',
                    searchResult: searchResult,
                    category: this.generateVariableCategory(searchResult),
                    min: min,
                    max: max,
                    filterType: min===undefined ? "lessThan" : max===undefined ? "greaterThan" : "between"
                });
            },
            addRequiredFilter: function(searchResult) {
                let existingFilterForVariable = this.getByVarId(searchResult.result.varId);
                if(existingFilterForVariable!==undefined){
                    this.get('activeFilters').remove(existingFilterForVariable);
                }
                this.get('activeFilters').add({
                    type: 'required',
                    searchResult: searchResult,
                    category: this.generateVariableCategory(searchResult),
                    filterType: "any"
                });
            },
            addDatatableFilter: function(datatableSelections) {
                let existingFilterForVariable = this.getByDatatableId(datatableSelections.searchResult.result.dtId);
                if(existingFilterForVariable!==undefined){
                    this.get('activeFilters').remove(existingFilterForVariable);
                }
                this.get('activeFilters').add({
                    type: 'datatable',
                    dtId: datatableSelections.dtId,
                    variables: datatableSelections.variables,
                    category: datatableSelections.title,
                    filterType: "anyRecordOf",
                    datatable: true,
                    searchResult: datatableSelections.searchResult
                });
            },
            addGenomicFilter: function(genomicFilter) {
                let existingFilterForGenomic = this.get('activeFilters').find((filter)=>{return filter.get('type')==='genomic';});
                if(existingFilterForGenomic!==undefined){
                    this.get('activeFilters').remove(existingFilterForGenomic);
                }
                this.get('activeFilters').add({
                    type: 'genomic',
                    genomic: true,
                    genomicFilter: genomicFilter
                });
            },
            addExportField: function(searchResult){
                this.get('exportFields').add(searchResult);
            },
            removeByIndex: function(index) {
                this.get('activeFilters').remove(this.get('activeFilters').at(index));
            },
            getByIndex: function(index) {
                return this.get('activeFilters').at(index).attributes;
            },
            getByVarId: function(varId) {
                return this.get('activeFilters').find((filter)=>{return filter.get('searchResult').result.varId===varId;});
            },
            getByDatatableId: function(dtId) {
                return this.get('activeFilters').find((filter)=>{return filter.get('dtId')===dtId;});
            },
            generateVariableCategory: function(searchResult) {
                return "\\" + searchResult.result.dtId + "\\" + searchResult.result.studyId + "\\" + searchResult.result.metadata.varId;
            },
            generateDatatableCategory: function(searchResult) {
                return "\\" + searchResult.result.dtId + "\\" + searchResult.result.studyId + "\\";
            },
        });
        return new FilterModel();
    });