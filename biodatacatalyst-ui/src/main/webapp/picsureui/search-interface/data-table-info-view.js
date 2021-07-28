define(["jquery","backbone","handlebars", "text!search-interface/data-table-info-template.hbs",
        "search-interface/tag-filter-model"],
    function($, BB, HBS, dataTableInfoTemplate,
             tagFilterModel){

        var View = BB.View.extend({
            initialize: function(opts){
                this.dataTableInfoTemplate = HBS.compile(dataTableInfoTemplate);
                this.data = opts.data;
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
                'click #show-fewer-tags-btn': 'showFewerTags'
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
                this.$el.html(this.dataTableInfoTemplate(this.data));
            }
        });

        return View;
    });
