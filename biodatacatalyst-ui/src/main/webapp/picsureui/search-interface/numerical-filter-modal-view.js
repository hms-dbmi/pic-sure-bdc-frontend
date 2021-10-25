define(["jquery","backbone","handlebars", "text!search-interface/numerical-filter-modal-view.hbs", "search-interface/filter-model", "picSure/search", "picSure/settings"],
    function($, BB, HBS, filterModalViewTemplate, filterModel, search, settings){

        var View = BB.View.extend({
            initialize: function(opts){
                this.filterModalViewTemplate = HBS.compile(filterModalViewTemplate);
                this.data = opts.data;
            },
            events: {
                "click #add-filter-button": "addFilter"
            },
            addFilter: function(event) {
                filterModel.addNumericFilter(
                    this.data.searchResult,
                    $('#min-value-input').val(),
                    $('#max-value-input').val()
                );
                $('.close').click();
            },
            render: function(){
                search.dictionary(
                    this.data.searchResult.result.metadata.HPDS_PATH, 
                    function(searchResponse){
                        let concept = _.values(searchResponse.results.phenotypes)[0];
                        this.data.min = concept.min;
                        this.data.max = concept.max;
                        this.$el.html(this.filterModalViewTemplate(this.data));
                        if(this.data.filter!==undefined){
                            this.$('#max-value-input').val(this.data.filter.max);
                            this.$('#min-value-input').val(this.data.filter.min);
                        } else {
                            this.$('#max-value-input').val(concept.max);
                            this.$('#min-value-input').val(concept.min);
                        }
                    }.bind(this), 
                    function(){
                        console.log(arguments);
                    }, 
                    settings.picSureResourceId)
            }
        });

        return View;
    });
