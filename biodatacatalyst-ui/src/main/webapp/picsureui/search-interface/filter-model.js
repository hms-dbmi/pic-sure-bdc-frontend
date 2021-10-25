define(["backbone", "handlebars"],
    function(BB, HBS){

        let FilterModel = BB.Model.extend({
            defaults:{
                activeFilters: new BB.Collection,
            },
            initialize: function(opts){
                this.set('activeFilters', new BB.Collection);
            },
            addCategoryFilter: function(searchResult, values) {
                let existingFilterForVariable = this.getByVarId(searchResult.result.varId);
                if(existingFilterForVariable!==undefined){
                    this.get('activeFilters').remove(existingFilterForVariable, {silent:true});
                }
                this.get('activeFilters').add({
                    type: 'category',
                    searchResult: searchResult,
                    category: this.generateCategory(searchResult),
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
                    category: this.generateCategory(searchResult),
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
                    category: this.generateCategory(searchResult),
                    filterType: "any"
                });
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
            generateCategory: function(searchResult) {
                return "\\" + searchResult.result.dtId + "\\" + searchResult.result.studyId + "\\" + searchResult.result.metadata.varId;
            },
        });
        return new FilterModel();
    });