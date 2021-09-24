define(["jquery","backbone","handlebars", "text!search-interface/data-table-info-template.hbs",
        "search-interface/tag-filter-model", "text!options/modal.hbs", "search-interface/variable-info-cache",
        "search-interface/filter-model","search-interface/categorical-filter-modal-view",
        "search-interface/filter-modal-view"],
    function($, BB, HBS, dataTableInfoTemplate,
             tagFilterModel, modalTemplate, variableInfoCache,
             filterModel, categoricalFilterModalView, filterModalView){

        var View = BB.View.extend({
            initialize: function(opts){
                this.dataTableInfoTemplate = HBS.compile(dataTableInfoTemplate);
                this.modalTemplate = HBS.compile(modalTemplate);
                this.varId = opts.varId;
            },
            events: {
                'mouseover .badge': 'showTagControls',
                'mouseout .badge': 'hideTagControls',
                'click .require-tag-btn': 'requireTag',
                'click .exclude-tag-btn': 'excludeTag',
                'click .remove-required-tag-btn': 'removeRequiredTag',
                'click .remove-excluded-tag-btn': 'removeExcludedTag',
                'click .badge': 'clickTag',
                'click #show-all-tags-btn': 'showAllTags',
                'click #show-fewer-tags-btn': 'showFewerTags',
                'click .fa-filter': 'filterClickHandler'
            },
            showTagControls: function(event){
                $('.hover-control', event.target).show();
            },
            hideTagControls: function(event){
                $('.hover-control', event.target).hide();
            },
            clickTag: function(event){
                let tagBtnClicked = this.resolveTagButtonForClick(event);
                if(tagBtnClicked){
                    tagFilterModel[tagBtnClicked.dataset['action']](tagBtnClicked.dataset['tag']);
                }
            },
            filterClickHandler: function(event) {
                let searchResult = _.find(tagFilterModel.attributes.searchResults.results.searchResults, 
                    function(variable){return variable.result.varId===event.target.dataset['id'];});

                let filter = filterModel.getByVarId(searchResult.result.varId);

                let filterViewData = {
                    searchResult: searchResult,
                    filter: filter ? filter.toJSON() : undefined
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
                modal.displayModal(this.filterModalView, searchResult.result.metadata.description);
            },
            resolveTagButtonForClick: function(event){
                let clickIsInsideTagBtn = function(event, tagBtn){
                    let clickXRelativeToTagBtn = (event.offsetX - (tagBtn.offsetLeft - event.target.offsetLeft));
                    return clickXRelativeToTagBtn > 0 && (clickXRelativeToTagBtn - tagBtn.offsetWidth) < tagBtn.offsetWidth;
                }
                let tagBtnClicked;
                _.each($('.hover-control', event.target), tagBtn=>{
                    if(clickIsInsideTagBtn(event, tagBtn)){
                        tagBtnClicked = tagBtn;
                    }
                });
                return tagBtnClicked;
            },
            render: function(){
                this.$el.html(this.dataTableInfoTemplate(variableInfoCache[this.varId]));
            }
        });

        return View;
    });
