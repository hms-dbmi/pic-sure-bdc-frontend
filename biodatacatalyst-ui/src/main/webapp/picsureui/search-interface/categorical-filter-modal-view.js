define(["jquery","backbone","handlebars", "text!search-interface/categorical-filter-modal-view.hbs", "search-interface/filter-model"],
    function($, BB, HBS, categoricalFilterModalViewTemplate, filterModel){

        var View = BB.View.extend({
            initialize: function(opts){
                this.categoricalFilterModalViewTemplate = HBS.compile(categoricalFilterModalViewTemplate);
                this.data = opts.data;
            },
            events: {
                "change #select-filter-type": "changeFilterType",
                "click #add-filter-button": "addFilter"
            },
            changeFilterType: function(event) {
                let $selectEl = $(event.target);
                let selectedValue = $selectEl.val();
                switch (selectedValue) {
                    case "any":
                        $('.value-container').hide();
                        break;
                    case "restrict":
                        $('.value-container').show();
                        break;
                }
            },
            addFilter: function(event) {
                let filterType = $('#select-filter-type').val();
                switch (filterType) {
                    case "any":
                        filterModel.addRequiredFilter(
                            this.data.searchResult,
                        );
                        break;
                    case "restrict":
                        let values = $('.categorical-filter-input:checked').map(function(x) {
                            return $(this).val();
                        }).toArray();
                        filterModel.addCategoryFilter(
                            this.data.searchResult,
                            values
                        );
                        break;
                }
                $('.close').click();
            },
            render: function(){
                this.$el.html(this.categoricalFilterModalViewTemplate(this.data));
                if(this.data.filter!==undefined){
                    this.$("#select-filter-type").val(this.data.filter.filterType);
                    this.changeFilterType({target:this.$("#select-filter-type")[0]});
                    _.each(this.data.filter.values, (value)=>{
                        $('.categorical-filter-input[value='+value+']').attr("checked","true");
                    });
                }

            }
        });

        return View;
    });
