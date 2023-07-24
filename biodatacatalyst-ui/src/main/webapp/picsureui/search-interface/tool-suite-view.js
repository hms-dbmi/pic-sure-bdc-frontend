define(["jquery", "backbone", "handlebars", "text!search-interface/tool-suite-view.hbs", "search-interface/filter-model",
        "search-interface/modal", "search-interface/tool-suite-help-view", "search-interface/visualization-modal-view", "search-interface/package-view"
    , "text!search-interface/visualization-modal-view.hbs"],
function($, BB, HBS, template, filterModel, modal, helpView, VisualizationModalView, packageView
    , VisualizationTemplate) {
    var ToolSuiteView = BB.View.extend({
        initialize: function(opts){
            this.template = HBS.compile(template);
            this.helpView = new helpView();
            Backbone.pubSub.on('destroySearchView', this.destroy.bind(this));
        },
        events: {
            'click #package-data' : 'openPackageData',
            'click #variant-explorer' : 'openVariantExplorer',
            'click #distributions' : 'openDistributions',
            'click #tool-suite-help' : 'openHelp',
            'keypress #tool-suite-help' : 'openHelp',
        },
        handleFilterChange: function(){
            const filters = filterModel.get('activeFilters');
            const anyRecordOf = filters.filter(filter => filter.get('filterType') === 'anyRecordOf');
            const genomic = filters.filter(filter => filter.get('filterType') === 'genomic');
            let shouldDisablePackageData = true;
            let shouldDisableDistributions = true;
            if (filters.length && filterModel.get('totalPatients') !== 0) {
                if (anyRecordOf.length + genomic.length < filters.length) {
                    shouldDisablePackageData = false;
                    shouldDisableDistributions = false;
                } else if (anyRecordOf.length) {
                    shouldDisablePackageData = false;
                }
            }
            this.$el.find('#package-data').prop('disabled', shouldDisablePackageData).prop('title', shouldDisablePackageData ? 'Please add a phenotypic filter to your query to package data':'Select and Package data');
            this.$el.find('#distributions').prop('disabled', shouldDisableDistributions).prop('title', shouldDisableDistributions ? 'Please add a phenotypic filter to your query to view variable distributions':'Visualize distributions');
        },
        openDistributions: function(){
            const vizModal = new VisualizationModalView.View({model: new VisualizationModalView.Model(), template: VisualizationTemplate});
            modal.displayModal(
                vizModal,
                'Variable distributions of query filters',
                () => {this.$el.focus();}, 
                {isHandleTabs: true}
            );
        },
        openHelp: function(event){
            if (event.type === "keypress" && !(event.key === ' ' || event.key === 'Enter')) {
                return;
            }
            modal.displayModal(
                this.helpView,
                'Tool Suite Help',
                () => {
                    $('#tool-suite').focus();
                }, {isHandleTabs: true}
            );
        },
        openPackageData: function(){
            let exportStatus = 'Ready';
                if(filterModel.get('estDataPoints') > 1000000){
                    exportStatus = 'Overload';
                }
            let exportModel = Backbone.Model.extend({
                defaults: {},
            });
            this.packageView = new packageView({
                model: new exportModel({
                    exportStatus: exportStatus,
                    deletedExports: new BB.Collection,
                    queryId: ""
                })
            });
            modal.displayModal(
                this.packageView,
                'Review and Package Data',
                () => {
                    $('#package-modal').focus();
                }, {isHandleTabs: false}
            );
        },
        openVariantExplorer: function(){
            console.log('openVariantExplorer');
        },
        destroy: function(){
			//https://stackoverflow.com/questions/6569704/destroy-or-remove-a-view-in-backbone-js/11534056#11534056
			this.undelegateEvents();	
			$(this.el).removeData().unbind(); 
			this.remove();  
			Backbone.View.prototype.remove.call(this);
		},
        render: function() {
            this.$el.html(this.template());
            this.handleFilterChange();
            return this;
        }
    });
    return ToolSuiteView;
});
