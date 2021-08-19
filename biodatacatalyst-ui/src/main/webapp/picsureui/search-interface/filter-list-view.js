define(["jquery","backbone","handlebars", "text!search-interface/filter-list-view.hbs", "search-interface/filter-model",
        "text!options/modal.hbs", "search-interface/filter-modal-view", "search-interface/categorical-filter-modal-view"],
    function($, BB, HBS, filterListViewTemplate, filterModel,
        modalTemplate, filterModalView, categoricalFilterModalView){

        var View = BB.View.extend({
            initialize: function(opts){
                HBS.registerHelper('getFilterTypeDescription', this.getFilterTypeDescription);
                HBS.registerHelper('getVariableDescription', this.getVariableDescription);

                this.filterListViewTemplate = HBS.compile(filterListViewTemplate);
                filterModel.get('activeFilters').bind('change add remove', function () {
                    this.modelChanged();
                }.bind(this));
            },
            events: {
                "click .remove-filter": "removeFilterHandler",
                "click .edit-filter": "editFilterHandler"
            },
            modelChanged: function () {
                this.render();
            },
            getFilterTypeDescription: function(filter){
                switch (filter.type) {
                    case 'category':
                        return "Equals [" + filter.values.join(", ") + "]";
                        break;
                    case 'numeric':
                        if (filter.min && filter.max) {
                            return "Between " + filter.min + " and " + filter.max;
                        }
                        if (filter.min) {
                            return "Greater Than  " + filter.min;
                        }
                        if (filter.max) {
                            return "Less than " + filter.max;
                        }
                        break;
                    case 'required':
                        return "Contains value";
                        break;
                }
            },
            getVariableDescription: function(filter){
                return filter.searchResult.result.metadata.description + ": " + filter.searchResult.result.metadata.var_report_description;
            },
            removeFilterHandler: function(event) {
                filterModel.removeByIndex($(event.target).data('index'));
            },
            editFilterHandler: function(event) {
                let filter = filterModel.getByIndex($(event.target).data('index'));
                let searchResult = filter.searchResult;

                if ($("#modal-window").length === 0) {
                    $('#main-content').append('<div id="modal-window"></div>');
                }
                $("#modal-window").html(HBS.compile(modalTemplate)({title: ""}));
                $("#modalDialog").show();
                // todo: more info
                $(".modal-header").append('<h3>' + searchResult.result.metadata.description + '</h3>');
                $('.close').click(function() {$("#modalDialog").hide();});


                let filterViewData = {
                    searchResult: searchResult
                }

                if (!_.isEmpty(searchResult.result.values)) {
                    this.filterModalView = new categoricalFilterModalView({
                        data: filterViewData,
                        el: $(".modal-body")
                    });
                } else {
                    this.filterModalView = new filterModalView({
                        data: filterViewData,
                        el: $(".modal-body")
                    });
                }
                this.filterModalView.render();
            },
            render: function(){
                this.$el.html(this.filterListViewTemplate({
                    activeFilters: filterModel.get('activeFilters').map(function(filter){return filter.toJSON();})
                }));
            }
        });

        return View;
    });
