define(["jquery", "backbone", "handlebars", "text!search-interface/tool-suite-view.hbs", "search-interface/filter-model", "search-interface/modal",],
function($, BB, HBS, template, filterModel, modal){
    var ToolSuiteView = BB.View.extend({
        initialize: function(opts){
            this.template = HBS.compile(template);
        },
        events: {
            'click #package-data' : 'openPackageData',
            'click #variant-explorer' : 'openVariantExplorer',
            'click #imaging' : 'openImaging',
            'click #distributions' : 'openDistributions',
            'click #tool-suite-help' : 'openHelp',
            'click #export-to-seven-bridges' : 'exportToSevenBridges',
        },
        openPackageData: function(){
            console.log('openPackageData');
        },
        openVariantExplorer: function(){
            console.log('openVariantExplorer');
        },
        openImaging: function(){
            console.log('openImaging');
        },
        openDistributions: function(){
            console.log('openDistributions');
            modal.displayModal(
                '', 
                'Data Retrieval Summary', 
                () => {console.log('close help')
            });
        },
        openHelp: function(){
            modal.displayModal(
                'Tool Suite Help', 
                () => {console.log('close help')
            });
        },
        exportToSevenBridges: function(){
            console.log('exportToSevenBridges');
        },
        render: function() {
            this.$el.html(this.template());
            const filters = filterModel.get('activeFilters');
            const anyRecordOf = filters.filter(filter => filter.get('filterType') === 'anyRecordOf');
            const genomic = filters.filter(filter => filter.get('filterType') === 'genomic');
            if (filters.length && anyRecordOf.length && !genomic.length) {
                this.$el.find('#package-data').prop('disabled', false).prop('title', 'Select and Package Data');
                this.$el.find('#distributions').prop('disabled', true).prop('title', 'Please add a filter to your query to view variable distributions.');
            } else if (filters.length && !anyRecordOf.length && genomic.length) {
                this.$el.find('#package-data').prop('disabled', true).prop('title', 'Please add a phenotypic filter to your query to select and package data.');
                this.$el.find('#distributions').prop('disabled', true).prop('title', 'Please add a phenotypic filter to your query to view variable distributions.');
            } else if (filters.length && anyRecordOf.length && genomic.length) {
                this.$el.find('#package-data').prop('disabled', true).prop('title', 'Please add a phenotypic filter to your query to select and package data.');
                this.$el.find('#distributions').prop('disabled', true).prop('title', 'Please add a phenotypic filter to your query to view variable distributions.');
            } else {
                this.$el.find('#package-data').prop('disabled', true).prop('title', 'Please add a filter to your query to package data.');
                this.$el.find('#distributions').prop('disabled', true).prop('title', 'Please add a filter to your query to view variable distributions.');
            }
        }
    });
    return ToolSuiteView;
});