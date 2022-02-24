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
        disableSuiteButtons: function(reason){
            this.$el.find('#package-data').prop('disabled', true).prop('title', 'Please add a ' + reason + 'filter to your query to select and package data.');
            this.$el.find('#distributions').prop('disabled', true).prop('title', 'Please add a '+ reason + 'filter to your query to view variable distributions');
        },
        enableSuiteButtons: function(){
            this.$el.find('#package-data').prop('disabled', false).prop('title', 'Select and Package Data');
            this.$el.find('#distributions').prop('disabled', false).prop('title', 'Visual Distributions');
        },
        exportToSevenBridges: function(){
            console.log('exportToSevenBridges');
        },
        handleFilterChange: function(){
            const filters = filterModel.get('activeFilters');
            const anyRecordOf = filters.filter(filter => filter.get('filterType') === 'anyRecordOf');
            const genomic = filters.filter(filter => filter.get('filterType') === 'genomic');

            if (filters.length) {
                if (anyRecordOf.length && anyRecordOf.length < filters.length) { // if there are any record of filters
                    if (genomic.length && genomic.length < filters.length && (genomic.length + anyRecordOf.length) < filters.length) { // if there are genomic filters and acceptable filters
                        this.enableSuiteButtons();
                    } else if (genomic.length && genomic.length < filters.length && (genomic.length + anyRecordOf.length) >= filters.length) { // if there are genomic filters and unacceptable filters
                        this.disableSuiteButtons('phenotypic ');
                    } else if  (!genomic.length) { // if there are no genomic filters
                        this.enableSuiteButtons();
                    }
                } else if (anyRecordOf.length && anyRecordOf.length >= filters.length) { // Only anyRecordOf
                    this.disableSuiteButtons('');
                } else if (!anyRecordOf.length) { // if there are no anyRecordOf filters
                    if (genomic.length && genomic.length < filters.length && (genomic.length + anyRecordOf.length) < filters.length) { // if there are genomic filters and acceptable filters
                        this.enableSuiteButtons();
                    } else if (genomic.length && genomic.length <= filters.length && (genomic.length + anyRecordOf.length) >= filters.length) { // if there are genomic filters and unacceptable filters
                        this.disableSuiteButtons('phenotypic ');
                    } else if  (!genomic.length) { // if there are no genomic filters
                        this.enableSuiteButtons();
                    }
                }
            } else { // if there are no filters
                this.disableSuiteButtons('');
            }
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