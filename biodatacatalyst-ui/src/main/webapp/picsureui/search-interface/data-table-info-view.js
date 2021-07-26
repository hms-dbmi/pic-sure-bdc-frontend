define(["jquery","backbone","handlebars", "text!search-interface/data-table-info-template.hbs"],
    function($, BB, HBS, dataTableInfoTemplate){

        var View = BB.View.extend({
            initialize: function(opts){
                this.dataTableInfoTemplate = HBS.compile(dataTableInfoTemplate);
                this.data = opts.data;
                this.tagFilterView = opts.tagFilterView;
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
            requireTag: function(tag){
                this.tagFilterView.requireTag(tag);
            },
            excludeTag: function(tag){
                this.tagFilterView.excludeTag(tag);
            },
            clickTag: function(event){
                this.tagFilterView.clickTag(event)
            },
            resolveTagButtonForClick: function(event){
                this.tagFilterView.resolveTagButtonForClick(event);
            },
            render: function(){
                this.$el.html(this.dataTableInfoTemplate(this.data));
            }
        });

        return View;
    });
