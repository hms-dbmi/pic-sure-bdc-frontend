define(['backbone', 'handlebars', 'datatables.net', "common/keyboard-nav", "search-interface/filter-model", "search-interface/search-util", "text!search-interface/search-results-list.hbs"],
	function(BB, HBS, datatables, keyboardNav,  filterModel, searchUtil, searchResultsListTemplate){
        let searchTable = BB.View.extend({
            initialize: function(opts){
                this.data = opts;
                //this.processResults();
                this.template = HBS.compile(searchResultsListTemplate);
            },
            processResults: function(){
                let processedResults = [];
                _.each(this.data.results, function(result) {
                    processedResults.push({
                        study: result.abbreviation,
                        dataset: result.dataTableDescription,
                        variableId: result.variable_id,
                        variableName: result.name,
                    });
                });
                this.data.processedResults = processedResults;
            },
            render: function(){
                console.log("rendering searchTable");
                this.$el.html(this.template(this.data));
                // $('#search-results-datatable').DataTable({
                //     data: this.data.processedResults,
                //     columns: [
                //         {title:'Study', data:'study'},
                //         {title:'Dataset',data:'dataset'},
                //         {title:'Variable ID', data:'variableId'},
                //         {title:'Variable Name', data:'variableName'},
                //     ],
                // });
            }
        });
        return searchTable;
    });

    // columns: [
    //     {title:'Study'},
    //     {title:'Dataset'},
    //     {title: 'Variable ID'},
    //     {title:'Variable name'},
    //     {title:'Actions'}
    //    ],
    // select: {
    //     style:    'os',
    //     selector: 'td:first-child',
    //     toggleable: false
    // },
    // drawCallback: function(){
    //     console.log("drawCallback");
    // }