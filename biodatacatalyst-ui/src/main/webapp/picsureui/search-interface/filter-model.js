define(["backbone", "handlebars"],
    function(BB, HBS){

        let FilterModel = BB.Model.extend({
            defaults:{
                activeFilters: new BB.Collection,
            },
            initialize: function(opts){
                this.set('activeFilters', new BB.Collection);
            },
            addCategoryFilter: function(variableId, category, values) {
                this.get('activeFilters').add({
                    type: 'category',
                    variableId: variableId,
                    category: category,
                    values: values
                });
            },
            addNumericFilter: function(variableId, category, min, max) {
                this.get('activeFilters').add({
                    type: 'numeric',
                    variableId: variableId,
                    category: category,
                    min: min,
                    max: max
                });
            },
            addRequiredFilter: function(variableId, category) {
                this.get('activeFilters').add({
                    type: 'required',
                    variableId: variableId,
                    category: category
                });
            }
        });
        return new FilterModel();
    });