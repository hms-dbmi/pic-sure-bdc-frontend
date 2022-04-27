define(['backbone', 'handlebars', 'datatables.net', "common/keyboard-nav", "search-interface/filter-model", "search-interface/search-util", "text!search-interface/search-results-list.hbs"],
	function(BB, HBS, datatables, keyboardNav,  filterModel, searchUtil, searchResultsListTemplate){
        let searchTable = BB.View.extend({
            initialize: function(opts){
                this.data = opts;
                this.template = HBS.compile(searchResultsListTemplate);
            },
            render: function(){
                console.log("rendering searchTable");
                this.$el.html(this.template(this.data));
            }
        });
        return searchTable;
    });