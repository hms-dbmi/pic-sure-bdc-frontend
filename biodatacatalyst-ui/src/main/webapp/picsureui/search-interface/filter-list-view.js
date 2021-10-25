define(["jquery","backbone","handlebars", "text!search-interface/filter-list-view.hbs", "search-interface/filter-model",
        "text!options/modal.hbs", "search-interface/numerical-filter-modal-view", "search-interface/categorical-filter-modal-view", 
        "picSure/queryBuilder","search-interface/modal", "search-interface/keyboard-nav", "search-interface/search-util"],
    function($, BB, HBS, filterListViewTemplate, filterModel,
        modalTemplate, filterModalView, categoricalFilterModalView, 
        queryBuilder, modal, keyboardNav, searchUtil){

        var View = BB.View.extend({
            initialize: function(opts){
                HBS.registerHelper('getFilterTypeDescription', this.getFilterTypeDescription);
                HBS.registerHelper('getVariableDescription', this.getVariableDescription);

                this.filterListViewTemplate = HBS.compile(filterListViewTemplate);
                filterModel.get('activeFilters').bind('change add remove', function () {
                    this.modelChanged();
                }.bind(this));
                this.outputPanelView = opts.outputPanelView;
                keyboardNav.addNavigableView("filterList",this);
                this.on({
                    'keynav-arrowup document': this.previousFilter,
                    'keynav-arrowdown document': this.nextFilter,
                    'keynav-arrowright document': this.editFilter,
                    'keynav-arrowleft document': this.removeFilter
                });
            },
            events: {
                "click .remove-filter": "removeFilterHandler",
                "click .edit-filter": "editFilterHandler",
                "click .variable-info": "editFilterHandler",
                'focus #filter-list': 'filtersFocus',
                'blur #filter-list': 'filtersBlur'
            },
            filtersFocus: function () {
                this.nextFilter();
                keyboardNav.setCurrentView("filterList");
            },
            filtersBlur: function () {
                this.$(".focused-filter-container").removeClass('focused-filter-container');
            },
            findAndFreeFocusedFilter: function(focusedFilter, filters){
                for(var x = 0;x < filters.length;x++){
                    if($(filters[x]).hasClass('focused-fitler-container')){
                        focusedFilter = x;
                        $(filters[x]).removeClass('focused-fitler-container')
                    }
                }
                return focusedFilter;
            },
            adjustFocusedFilter: function(adjustment, filters){
                let focusedFilter = adjustment;
                for(var x = 0;x < filters.length;x++){
                    if($(filters[x]).hasClass('focused-filter-container')){
                        focusedFilter = x;
                        $(filters[x]).removeClass('focused-filter-container')
                    }
                }
                focusedFilter = focusedFilter - adjustment;
                if(focusedFilter===-1){
                    focusedFilter = filters.length-1;
                }
                if(focusedFilter===filters.length){
                    focusedFilter=0;
                }
                if(filters[focusedFilter]){
                    $(filters[focusedFilter]).addClass('focused-filter-container');
                    $("#filter-list").attr("aria-activedescendant", filters[focusedFilter].id);
                    searchUtil.ensureElementIsInView(filters[focusedFilter]);
                }
            },
            previousFilter: function(event){
                let filters = this.$(".filter-container");
                let focusedFilter = this.adjustFocusedFilter(1, filters);
            },
            nextFilter: function(event){
                let filters = this.$(".filter-container");
                let focusedFilter = this.adjustFocusedFilter(-1, filters);
            },
            editFilter: function(event){
                $('.focused-filter-container .edit-filter').click();
            },
            removeFilter: function(event){
                $('.focused-filter-container .remove-filter').click();
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

                let filterViewData = {
                    el: $('.modal-body'),
                    data: {
                        searchResult: searchResult,
                        filter: filter
                    }
                }

                if (searchResult.result.is_categorical) {
                    this.filterModalView = new categoricalFilterModalView(filterViewData);

                } else {
                    this.filterModalView = new filterModalView(filterViewData);
                }

                modal.displayModal(this.filterModalView, searchResult.result.metadata.description, ()=>{
                    $('#filter-list').focus();
                });
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
