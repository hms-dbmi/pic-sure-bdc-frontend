define(["jquery","backbone","handlebars", "text!search-interface/filter-list-view.hbs", "search-interface/filter-model",
        "text!options/modal.hbs", "search-interface/numerical-filter-modal-view", "search-interface/categorical-filter-modal-view",
        "search-interface/datatable-filter-modal-view",
        "picSure/queryBuilder","common/modal", "common/keyboard-nav", "search-interface/search-util",
        "text!search-interface/genomic-filter-partial.hbs", "filter/genomic-filter-view","search-interface/variable-info-cache",
        "search-interface/variable-info-modal-view", "picSure/settings"
    ],
    function($, BB, HBS, filterListViewTemplate, filterModel,
        modalTemplate, filterModalView, categoricalFilterModalView,
        datatableFilterModalView,
        queryBuilder, modal, keyboardNav, searchUtil, genomicFilterPartialTemplate, genomicFilterView, variableInfoCache, variableInfoModalView, settings) {

        var View = BB.View.extend({
            initialize: function(opts){
                HBS.registerHelper('getFilterTypeDescription', this.getFilterTypeDescription);
                HBS.registerHelper('getVariableDescription', this.getVariableDescription);
                HBS.registerPartial('genomic-filter-partial', genomicFilterPartialTemplate);

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
                    'keynav-arrowleft document': this.removeFilter,
                    'keynav-enter': this.editFilter,
                });
                Backbone.pubSub.on('destroySearchView', this.destroy.bind(this));
            },
            events: {
                "click .remove-filter": "removeFilterHandler",
                "click .edit-filter": "editFilterHandler",
                "click .variable-info": "editFilterHandler",
                'click .info-filter': 'onInfoClick',
                'focus #filter-list-container': 'filtersFocus',
                'blur #filter-list-container': 'filtersBlur',
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
                        if (!filter.min && !filter.max) {
                            return "Include only participants with values";
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
                filterModel.trigger('change', filterModel, {});
            },
            onInfoClick: function(event){
                //get cached data via id
                let filter = filterModel.getByIndex($(event.target).data('index'));
                let data = undefined;
                if (!filter.type!=='genomic') {
                    data = variableInfoCache[filter.searchResult.result.varId];
                }
                if (data) {
                    console.log('Filter: ', filter);
                    const modalView = new variableInfoModalView({
                        varId: data.variableId,
                        el: $(".modal-body")
                    });
                    modalView.render();
                    modal.displayModal(modalView, "Variable Information for " + data.variableMetadata.derived_var_name,  ()=>{
                        $('#filter-list').focus();
                    }, {isHandleTabs: true});
                }
            },
            editFilterHandler: function(event) {
                let filter = filterModel.getByIndex($(event.target).data('index'));

                if(filter.type==='datatable'){
                    $.ajax({
                        url: window.location.origin + "/picsure/search/" + settings.dictionaryResourceId,
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({query: {
                                searchTerm: "",
                                includedTags: [filter.dtId],
                                excludedTags: [],
                                returnTags: false,
                                offset: 0,
                                limit: 100000
                        }}),
                        success: function(response){
                            let filterViewData = {
                                dtId: filter.dtId,
                                filter: filter,
                                dtVariables: response.results.searchResults
                            };
                            this.filterModalView = new datatableFilterModalView({
                                model: filterViewData,
                                dataTableInfo: filterViewData.filter.searchResult.result,
                                el: $(".modal-body"),
                            });
                            this.filterModalView.render();
                            modal.displayModal(this.filterModalView, "Dataset : " + filter.searchResult.result.metadata.derived_study_description), ()=>{$('#filter-list').focus();}, {isHandleTabs: true};
                        }.bind(this),
                        error: function(response){
                            console.log(response);
                        }.bind(this)
                    });
                } else if (filter.type==='genomic') {
                    let genomicFilter = new genomicFilterView({el: $(".modal-body"), currentFilter: filter});
			        genomicFilter.render();
			        modal.displayModal(genomicFilter, 'Genomic Filtering', function() {
				        $('#filter-list').focus();
			        });
                } else {
                    let searchResult = filter.searchResult;

                    let filterViewData = {
                        el: $('.modal-body'),
                        isOpenAccess: JSON.parse(sessionStorage.getItem('isOpenAccess')),
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

                    modal.displayModal(this.filterModalView, "Variable-level Filter for " + searchResult.result.metadata.columnmeta_name, ()=>{
                        $('#filter-list').focus();
                    }, {isHandleTabs: true});
                }
            },
            destroy: function(){
                //https://stackoverflow.com/questions/6569704/destroy-or-remove-a-view-in-backbone-js/11534056#11534056
                this.undelegateEvents();	
                $(this.el).removeData().unbind(); 
                this.remove();  
                Backbone.View.prototype.remove.call(this);
            },
            render: function(){
                const resourceUUID = JSON.parse(sessionStorage.getItem('isOpenAccess')) ? settings.openAccessResourceId: settings.picSureResourceId;
                const query = queryBuilder.createQueryNew(filterModel.get("activeFilters").toJSON(), null, resourceUUID);
                this.outputPanelView.runQuery(query);
                this.$el.html(this.filterListViewTemplate({
                    activeFilters: filterModel.get('activeFilters').map(function(filter){return filter.toJSON();})
                }));
            }
        });

        return View;
    });
