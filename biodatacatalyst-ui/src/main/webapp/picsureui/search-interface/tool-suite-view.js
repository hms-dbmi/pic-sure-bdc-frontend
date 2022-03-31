define(["jquery", "backbone", "handlebars", "text!search-interface/tool-suite-view.hbs", "search-interface/filter-model", "search-interface/modal", "search-interface/tool-suite-help-view", "search-interface/package-view"],
function($, BB, HBS, template, filterModel, modal, helpView, packageView) {
    var ToolSuiteView = BB.View.extend({
        initialize: function(opts){
            this.template = HBS.compile(template);
            this.helpView = new helpView();
            this.listenTo(filterModel.get('activeFilters'), 'change reset add remove', this.render);
            this.listenTo(filterModel.get('exportFields'), 'change reset add remove', this.render);
        },
        events: {
            'click #package-data' : 'openPackageData',
            'click #variant-explorer' : 'openVariantExplorer',
            'click #imaging' : 'openImaging',
            'click #distributions' : 'openDistributions',
            'click #tool-suite-help' : 'openHelp',
            'click #export-to-seven-bridges' : 'exportToSevenBridges',
        },
        handleFilterChange: function(){
            const filters = filterModel.get('activeFilters');
            const anyRecordOf = filters.filter(filter => filter.get('filterType') === 'anyRecordOf');
            const genomic = filters.filter(filter => filter.get('filterType') === 'genomic');
            let shouldDisablePackageData = true;
            let shouldDisableDistributions = true;
            if (filters.length) {
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
            console.log('openDistributions');
        },
        openHelp: function(){
            modal.displayModal(
                this.helpView,
                'Tool Suite Help',
                () => {
                    $('#tool-suite').focus();
                }
            );
        },
        openImaging: function(){
            console.log('openImaging');
        },
        openPackageData: function(){
            let exportStatus = 'Ready';
                if(filterModel.get('estDataPoints') > 1000000){
                    exportStatus = 'Overload';
                };
            let exportModel = Backbone.Model.extend({
                defaults: {},
            });
            this.packageView = new packageView({
                model: new exportModel({
                    //exportParticipants: filterModel.get('totalPatients'),
                    //exportVariables: filterModel.get('totalVariables'),
                    //exportDataPoints: filterModel.get('estDataPoints'),
                    exportStatus: exportStatus,
                    //exportQueryId:'-',
                    //exportRan: false,
                    deletedExports: new BB.Collection,
                    query: ""
                })
            });
            modal.displayModal(
                this.packageView,
                'Review and Package Data',
                () => {
                    $('#package-modal').focus();
                }
            );
        },
        openVariantExplorer: function(){
            console.log('openVariantExplorer');
        },
        render: function() {
            this.$el.html(this.template());
            this.handleFilterChange();
            return this;
        }
    });
    return ToolSuiteView;
});
