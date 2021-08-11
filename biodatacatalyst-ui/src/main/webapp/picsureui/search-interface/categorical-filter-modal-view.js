define(["jquery","backbone","handlebars", "text!search-interface/categorical-filter-modal-view.hbs"],
    function($, BB, HBS, categoricalFilterModalViewTemplate){

        var View = BB.View.extend({
            initialize: function(opts){
                this.categoricalFilterModalViewTemplate = HBS.compile(categoricalFilterModalViewTemplate);
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
                        $('.value-container').hide();
                        break;
                    case "restrict":
                        $('.value-container').show();
                        break;
                }
            },
            render: function(){
                this.$el.html(this.categoricalFilterModalViewTemplate(this.data));
            }
        });

        return View;
    });
