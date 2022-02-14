define(['jquery', 'backbone','handlebars', 
'search-interface/filter-model',
'text!search-interface/genomic-filter-view.hbs', 
'search-interface/selection-search-panel-view', 
'text!search-interface/selection-panel.hbs', 
'text!search-interface/numerical-filter-modal-partial.hbs', 
'text!search-interface/genomic-filter-partial.hbs',
'text!../studyAccess/variant-data.json',
'picSure/ontology', "common/spinner"],
    function($, BB, HBS, filterModel, genomicView, searchPanel, selectionPanel, numericalPanel, filterContainer, variantDataJson, ontology, spinner) {
        const geneKey = 'Gene_with_variant';
        const consequenceKey = 'Variant_consequence_calculated';
        const severityKey = 'Variant_severity';
        const classKey = 'Variant_class';
        const frequencyKey = 'Variant_frequency_as_text';
        let isLoading = true;
        let genomicFilterView = BB.View.extend({
            initialize: function(opts){
                $("body").tooltip({ selector: '[data-toggle=tooltip]' });
                this.data = opts;
                this.infoColumns = [];
                this.loadingData = ontology.getInstance().allInfoColumnsLoaded.then(function(){
                    this.infoColumns = ontology.getInstance().allInfoColumns();
                    this.data.geneDesc = this.infoColumns.find(col => col.key === geneKey).description.match(/(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/)[0];
                    this.data.consequenceDesc = this.infoColumns.find(col => col.key === consequenceKey).description.match(/(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/)[0];
                    this.data.severityDescription = this.infoColumns.find(col => col.key === severityKey).description.match(/(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/)[0];
                    this.data.classDescription = this.infoColumns.find(col => col.key === classKey).description.match(/(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/)[0];
                    this.data.frequencyDescription = this.infoColumns.find(col => col.key === frequencyKey).description.match(/(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/)[0];
                    isLoading = false;
                    this.render();
                        
                }.bind(this));
                this.template = HBS.compile(genomicView);
                this.filterPartialTemplate = HBS.compile(filterContainer);
                const selectionPanelTemplate = HBS.compile(selectionPanel);
                const numericalPanelTemplate = HBS.compile(numericalPanel);
                HBS.registerPartial('selection-panel', selectionPanelTemplate);
                HBS.registerPartial('numerical-filter-partial', numericalPanelTemplate);
                // HBS.registerPartial('genomic-filter-partial', filterPartialTemplate);
            },
            events: {
              'click #cancel-genomic-filters' : 'cancelGenomicFilters',
              'click #apply-genomic-filters' : 'applyGenomicFilters',
              'click #clear-genomic-filters' : 'clearGenomicFilters',
              'change input[type="checkbox"],input[type="number"]' : 'updateGenomicFilter',
              'updatedLists' : 'updateGenomicFilter'
            },
            setUpViews: function() {
                const parsedVariantData = JSON.parse(variantDataJson);
                const geneList = parsedVariantData.genes;
                const consequencesList = parsedVariantData.consequences;
                this.data.severityOptions = ['High', 'Moderate', 'Low'];
                this.data.classOptions = ['SNV', 'Deletion', 'Insertion'];
                this.data.frequencyOptions = ['Novel', 'Rare', 'Common'];
                this.dataForGeneSearch = {
                    heading: 'Gene with Variant',
                    results: geneList,
                    searchContext: 'Select variants of interest',
                    resultContext: 'Selected Variants',
                    placeholderText: 'Try searching for a gene (Ex: CHD8)',
                    description: this.data.geneDesc,
                    sample: true
                }
                this.dataForConsequenceSearch = {
                    heading: 'Variant consequence calculated',
                    results: consequencesList,
                    searchContext: 'Select variant frequency as text',
                    resultContext: 'Selected variant consequence calculated',
                    placeholderText: 'Try searching for a consequence (Ex: intergenic_variant)',
                    description: this.data.consequenceDesc,
                    sample: false
                };
                // If editing a previous filter, then repopulate the form.
                if (this.data.currentFilter) {
                    this.dataForGeneSearch.searchResults = this.data.currentFilter.variantInfoFilters.categoryVariantInfoFilters.Gene_with_variant;
                    this.dataForConsequenceSearch.searchResults = this.data.currentFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_consequence_calculated;
                    this.previousFilter = this.data.currentFilter;
                }
                this.geneSearchPanel = new searchPanel(this.dataForGeneSearch);
                this.consequenceSearchPanel = new searchPanel(this.dataForConsequenceSearch);
            },
            applyGenomicFilters: function(){
                console.log("apply genomic filters");
                let filtersForQuery = {
                    categoryVariantInfoFilters: this.data.categoryVariantInfoFilters,
                    numericVariantInfoFilters: {}
                };
                filterModel.addGenomicFilter(filtersForQuery);
                this.cancelGenomicFilters();
            },
            clearGenomicFilters: function(){
                console.log("clear genomic filters");
                this.geneSearchPanel.reset();
                this.consequenceSearchPanel.reset();
                this.$el.find('input[type="checkbox"]').prop('checked', false);
                this.$el.find('input[type="number"]').val('');
                this.data.filters = {};
                this.$el.find('#selected-filters').html(this.filterPartialTemplate({filters: this.data.categoryVariantInfoFilters}));
            },
            cancelGenomicFilters: function(){
                $("#modalDialog").hide();
                $(".modal-backdrop").hide();
            },
            reapplyGenomicFilters: function(){
                if (this.previousFilter) {
                    if (this.previousFilter.categoryVariantInfoFilters.Variant_severity) {
                        $('#severity input[type="checkbox"]').each((i, checkbox)  => { 
                            console.log('checkbox', checkbox);
                            if (this.previousFilter.Variant_severity.includes(checkbox.value)) {
                                checkbox.checked = true;
                            }
                        });               
                    }
                    if (this.previousFilter.categoryVariantInfoFilters.Variant_class) {
                        $('#variant-class input[type="checkbox"]').each((i,checkbox)  => { 
                            console.log('checkbox', checkbox);
                            if (this.previousFilter.Variant_class.includes(checkbox.value)) {
                                checkbox.checked = true;
                            }
                        });               
                    }
                    if (this.previousFilter.categoryVariantInfoFilters.Variant_frequency_as_text) {
                        $('#frequency-text input[type="checkbox"]').each((i, checkbox)  => { 
                            console.log('checkbox', checkbox);
                            if (this.previousFilter.categoryVariantInfoFilters.Variant_frequency_as_text.includes(checkbox.value)) {
                                checkbox.checked = true;
                            }
                        });               
                    }
                    // if (this.previousFilter.variantFrequencyNumber) {
                    //     $('#frequency-number input[type="number"]').each((i, number)  => {
                    //         console.log('number', number);
                    //         number.value = this.previousFilter.variantFrequencyNumber[i];
                    //     });
                    // }
                    this.updateGenomicFilter();
                }
            },
            updateDisabledButton: function(){
                if (this.data.categoryVariantInfoFilters && ((this.data.categoryVariantInfoFilters.Gene_with_variant && this.data.categoryVariantInfoFilters.Gene_with_variant.length) ||
                    (this.data.categoryVariantInfoFilters.Variant_consequence_calculated && this.data.categoryVariantInfoFilters.Variant_consequence_calculated.length) ||
                    (this.data.categoryVariantInfoFilters.Variant_severity && this.data.categoryVariantInfoFilters.Variant_severity.length) ||
                    (this.data.categoryVariantInfoFilters.Variant_class && this.data.categoryVariantInfoFilters.Variant_class.length) ||
                    (this.data.categoryVariantInfoFilters.Variant_frequency_as_text && this.data.categoryVariantInfoFilters.Variant_frequency_as_text.length)
                )) {
                    this.$el.find('#apply-genomic-filters').prop('disabled', false);
                } else {
                    this.$el.find('#apply-genomic-filters').prop('disabled', true);
                }
            },
            updateGenomicFilter: function(){
                console.log("Start update genomic filter");
                const geneData = this.geneSearchPanel.data.selectedResults;
                const conData = this.consequenceSearchPanel.data.selectedResults;
                const severity = this.$el.find('#severity input[type="checkbox"]:checked');
                const variantClass = this.$el.find('#variant-class input[type="checkbox"]:checked');
                const variantFrequencyText = this.$el.find('#frequency-text input[type="checkbox"]:checked');
                const variantFrequencyNumber = this.$el.find('#frequency-number input[type="number"]');
                let severityData = [];
                let variantClassData = [];
                let variantFrequencyData = [];
                let variantFrequencyNumberData = [];
                if (severity.length > 0) {
                    severity.each(function(i, el){
                        severityData.push($(el).val().toUpperCase());
                    });
                }
                if (variantClass.length > 0) {
                    variantClass.each(function(i, el){
                        let elVal = $(el).val().toLowerCase();
                        elVal = elVal === 'SNV' ? elVal.toUpperCase() : elVal.toLowerCase();
                        variantClassData.push();
                    });
                }
                if (variantFrequencyText.length > 0) {
                    variantFrequencyText.each(function(i, el){
                        $(el).val() && variantFrequencyData.push($(el).val().substr(0,1).toUpperCase() + $(el).val().substr(1).toLowerCase());
                    });
                }

                this.data.categoryVariantInfoFilters = {
                    Gene_with_variant: _.isEmpty(geneData) ? undefined : geneData,
                    Variant_consequence_calculated: _.isEmpty(conData) ? undefined : conData,
                    Variant_severity: _.isEmpty(severityData) ? undefined : severityData,
                    Variant_class: _.isEmpty(variantClassData) ? undefined : variantClassData,
                    Variant_frequency_as_text: _.isEmpty(variantFrequencyData) ? undefined : variantFrequencyData,
                }

                this.updateDisabledButton();
                
                this.$el.find('#selected-filters').html(this.filterPartialTemplate({filters: {
                        categoryVariantInfoFilters: this.data.categoryVariantInfoFilters
                    }
                }));
                console.log("End update genomic filter", this.data.categoryVariantInfoFilters);
            },
            render: function(){
                if (!isLoading) {
                    this.setUpViews();
                    this.$el.html(this.template(this.data));
                    this.geneSearchPanel.$el = $('#gene-search-container');
                    this.consequenceSearchPanel.$el = $('#consequence-search-container');
                    this.geneSearchPanel.render();
                    this.consequenceSearchPanel.render();
                    this.previousFilter && this.reapplyGenomicFilters();
                    this.updateDisabledButton();
                    this.$el.find('#selected-filters').html(this.filterPartialTemplate({filters: this.data.categoryVariantInfoFilters}));
                } 
                else {
                    this.$el.html('<div id="genomic-spinner"></div>');
                    spinner.medium(this.loadingData, '#genomic-spinner', '');
                }
            }
        });
        return genomicFilterView;
});