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
                this.get('activeFilters').add({
                    type: 'category',
                    searchResult: searchResult,
                    category: this.generateCategory(searchResult),
                    values: values,
                    searchResult: searchResult
                });
            },
            addNumericFilter: function(searchResult, min, max) {
                this.get('activeFilters').add({
                    type: 'numeric',
                    searchResult: searchResult,
                    category: this.generateCategory(searchResult),
                    min: min,
                    max: max
                });
            },
            addRequiredFilter: function(searchResult) {
                this.get('activeFilters').add({
                    type: 'required',
                    searchResult: searchResult,
                    category: this.generateCategory(searchResult),
                });
            },
            removeByIndex: function(index) {
                this.get('activeFilters').remove(this.get('activeFilters').at(index));
            },
            getByIndex: function(index) {
                return this.get('activeFilters').at(index).attributes;
            },
            generateCategory: function(searchResult) {
                return "\\" + searchResult.result.dtId + "\\" + searchResult.result.studyId + "\\" + searchResult.result.metadata.varId;
            },
        });
        return new FilterModel();
    });