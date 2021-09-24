define(["jquery","backbone","handlebars", "text!search-interface/categorical-filter-modal-view.hbs", "search-interface/filter-model"],
    function($, BB, HBS, categoricalFilterModalViewTemplate, filterModel){

        var View = BB.View.extend({
            initialize: function(opts){
                this.categoricalFilterModalViewTemplate = HBS.compile(categoricalFilterModalViewTemplate);
                this.data = opts.data;
            },
            events: {
                "click #add-filter-button": "addFilter"
            },
            addFilter: function(event) {
                if(_.keys(this.data.searchResult.result.values).length === $('.categorical-filter-input:checked').length){
                    filterModel.addRequiredFilter(
                        this.data.searchResult,
                    );
                }else{
                    let values = $('.categorical-filter-input:checked').map(function(x) {
                        return $(this).val();
                    }).toArray();
                    filterModel.addCategoryFilter(
                        this.data.searchResult,
                        values
                    );
                }
                $('.close').click();
            },
            render: function(){
                this.$el.html(this.categoricalFilterModalViewTemplate(this.data));
                if(this.data.filter!==undefined){
                    _.each(
                        ( this.data.filter.type==='required' ? this.data.searchResult.result.values : this.data.filter.values ), (value)=>{
                            $('.categorical-filter-input[value="'+value+'"]').attr("checked","true");
                    });
                }

            }
        });

        return View;
    });
