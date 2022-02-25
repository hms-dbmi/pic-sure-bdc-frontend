define(["jquery", "backbone", "handlebars", "text!search-interface/tool-suite-view.hbs", "search-interface/filter-model", "search-interface/modal", "search-interface/tool-suite-help-view"],
function($, BB, HBS, template, filterModel, modal, helpView) {
    var ToolSuiteView = BB.View.extend({
        initialize: function(opts){
            this.template = HBS.compile(template);
            this.helpView = new helpView();
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
            let shouldEnablePackageData = false;
            let shouldEnableDistributions = false;
            let packageTitle = '';
            let distributionsTitle = '';
            if (filters.length) {
                if (anyRecordOf.length) {
                    packageTitle = 'Select and Package data';
                    shouldEnablePackageData = true;
                } else if (!anyRecordOf.length) {
                    if ((genomic.length && genomic.length < filters.length) || (!genomic.length)) {
                        shouldEnablePackageData = true;
                        shouldEnableDistributions = true;
                        packageTitle = 'Select and Package data';
                        distributionsTitle = 'Visualize distributions';
                    }
                }
            }
            this.$el.find('#package-data').prop('disabled', !shouldEnablePackageData).prop('title', packageTitle.length ? packageTitle : 'Please add a phenotypic filter to your query to package data');
            this.$el.find('#distributions').prop('disabled', !shouldEnableDistributions).prop('title', distributionsTitle.length ? distributionsTitle : 'Please add a phenotypic filter to your query to view variable distributions');
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
            console.log('openPackageData');
        },
        openVariantExplorer: function(){
            console.log('openVariantExplorer');
        },
        render: function() {
            this.$el.html(this.template());
            this.handleFilterChange();
        }
    });
    return ToolSuiteView;
});