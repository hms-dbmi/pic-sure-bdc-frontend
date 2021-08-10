define(["jquery","backbone","handlebars", "text!search-interface/filter-modal-view.hbs"],
    function($, BB, HBS, filterModalViewTemplate){

        var View = BB.View.extend({
            initialize: function(opts){
                this.filterModalViewTemplate = HBS.compile(filterModalViewTemplate);
                this.data = opts.data;
            },
            events: {
                "change #select-filter-type": "changeFilterType"
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
            render: function(){
                this.$el.html(this.filterModalViewTemplate(this.data));
            }
        });

        return View;
    });
