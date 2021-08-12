define(["jquery","backbone","handlebars", "text!search-interface/filter-list-view.hbs", "search-interface/filter-model"],
    function($, BB, HBS, filterListViewTemplate, filterModel){

        var View = BB.View.extend({
            initialize: function(opts){
                this.filterListViewTemplate = HBS.compile(filterListViewTemplate);
                filterModel.get('activeFilters').bind('change add remove', function () {
                    this.modelChanged();
                }.bind(this));
            },
            events: {
            },
            modelChanged: function () {
                this.render();
            },
            render: function(){
                this.$el.html(this.filterListViewTemplate({
                    activeFilters: filterModel.get('activeFilters').map(function(filter){return filter.toJSON();})
                }));
            }
        });

        return View;
    });
