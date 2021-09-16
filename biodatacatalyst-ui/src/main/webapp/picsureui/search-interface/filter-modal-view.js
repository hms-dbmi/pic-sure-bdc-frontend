define(["jquery","backbone","handlebars", "text!search-interface/filter-modal-view.hbs", "search-interface/filter-model"],
    function($, BB, HBS, filterModalViewTemplate, filterModel){

        var View = BB.View.extend({
            initialize: function(opts){
                this.filterModalViewTemplate = HBS.compile(filterModalViewTemplate);
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
                        $('.min-value-container').hide();
                        $('.max-value-container').hide();
                        break;
                    case "lessThan":
                        $('.min-value-container').hide();
                        $('.max-value-container').show();
                        break;
                    case "greaterThan":
                        $('.min-value-container').show();
                        $('.max-value-container').hide();
                        break;
                    case "between":
                        $('.min-value-container').show();
                        $('.max-value-container').show();
                        break;
                }
            },
            addFilter: function(event) {
                let filterType = $('#select-filter-type').val();
                switch (filterType) {
                    case "any":
                        filterModel.addRequiredFilter(
                            this.data.searchResult
                        );
                        break;
                    case "greaterThan":
                        filterModel.addNumericFilter(
                            this.data.searchResult,
                            $('#min-value-input').val(),
                            null
                        );
                        break;
                    case "lessThan":
                        filterModel.addNumericFilter(
                            this.data.searchResult,
                            null,
                            $('#max-value-input').val()
                        );
                        break;
                    case "between":
                        filterModel.addNumericFilter(
                            this.data.searchResult,
                            $('#min-value-input').val(),
                            $('#max-value-input').val()
                        );
                        break;
                }
                $('.close').click();
            },
            render: function(){
                this.$el.html(this.filterModalViewTemplate(this.data));
                 if(this.data.filter!==undefined){
                    this.$("#select-filter-type").val(this.data.filter.filterType);
                    this.changeFilterType({target:this.$("#select-filter-type")[0]});
                    this.$('#max-value-input').val(this.data.filter.max);
                    this.$('#min-value-input').val(this.data.filter.min);
                }
            }
        });

        return View;
    });
