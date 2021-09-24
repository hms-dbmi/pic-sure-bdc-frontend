define(["jquery","backbone","handlebars", "text!search-interface/filter-list-view.hbs", "search-interface/filter-model",
        "text!options/modal.hbs", "search-interface/filter-modal-view", "search-interface/categorical-filter-modal-view", "picSure/queryBuilder","search-interface/modal"],
    function($, BB, HBS, filterListViewTemplate, filterModel,
        modalTemplate, filterModalView, categoricalFilterModalView, queryBuilder, modal){

        var View = BB.View.extend({
            initialize: function(opts){
                HBS.registerHelper('getFilterTypeDescription', this.getFilterTypeDescription);
                HBS.registerHelper('getVariableDescription', this.getVariableDescription);

                this.filterListViewTemplate = HBS.compile(filterListViewTemplate);
                filterModel.get('activeFilters').bind('change add remove', function () {
                    this.modelChanged();
                }.bind(this));
                this.outputPanelView = opts.outputPanelView;
            },
            events: {
                "click .remove-filter": "removeFilterHandler",
                "click .edit-filter": "editFilterHandler",
                "click .variable-info": "editFilterHandler"
            },
            modelChanged: function () {
                this.render();
            },
            getFilterTypeDescription: function(filter){
                switch (filter.type) {
                    case 'category':
                        return "Include only participants with values in [" + filter.values.join(", ") + "]";
                        break;
                    case 'numeric':
                        if (filter.min && filter.max) {
                            return "Include only participants with values between " + filter.min + " and " + filter.max;
                        }
                        if (filter.min) {
                            return "Include only participants with values greater than  " + filter.min;
                        }
                        if (filter.max) {
                            return "Include only participants with values less than " + filter.max;
                        }
                        break;
                    case 'required':
                        return "Include only participants with a recorded value";
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
                $('.close').click(function() {
                    $("#modalDialog").hide();
                    $(".modal-backdrop").hide();
                });

                let filterViewData = {
                    searchResult: searchResult,
                    filter: filter
                }

                if (searchResult.result.is_categorical) {
                    this.filterModalView = new categoricalFilterModalView({
                        el: $('.modal-body'),
                        data: filterViewData
                    });

                } else {
                    this.filterModalView = new filterModalView({
                        el: $('.modal-body'),
                        data: filterViewData
                    });
                }
                this.filterModalView.render();
            },
            render: function(){
                let query = queryBuilder.createQueryNew(filterModel.get("activeFilters").toJSON(), "02e23f52-f354-4e8b-992c-d37c8b9ba140");
                this.outputPanelView.runQuery(query);
                this.$el.html(this.filterListViewTemplate({
                    activeFilters: filterModel.get('activeFilters').map(function(filter){return filter.toJSON();})
                }));
            }
        });

        return View;
    });
