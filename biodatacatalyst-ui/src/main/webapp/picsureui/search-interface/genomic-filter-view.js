define(['jquery', 'backbone','handlebars', 
'search-interface/filter-model',
'text!search-interface/genomic-filter-view.hbs', 
'search-interface/selection-search-panel-view', 
'text!search-interface/selection-panel.hbs', 
'text!search-interface/numerical-filter-modal-partial.hbs', 
'text!search-interface/genomic-filter-partial.hbs',
'text!../studyAccess/variant-data.json'],
    function($, BB, HBS, filterModel, genomicView, searchPanel, selectionPanel, numericalPanel, filterContainer, varDataJson) {
        let genomicFilterView = BB.View.extend({
            initialize: function(opts){
                const selectionPanelTemplate = HBS.compile(selectionPanel);
                this.template = HBS.compile(genomicView);
                const numericalPanelTemplate = HBS.compile(numericalPanel);
                this.filterPartialTemplate = HBS.compile(filterContainer);
                this.data = {};
                const parsedVarData = JSON.parse(varDataJson);
                this.geneList = parsedVarData.genes;
                this.consequencesList = parsedVarData.consequences;
                this.data.severityOptions = ['High', 'Moderate', 'Low'];
                this.data.classOptions = ['SNV', 'Deletion', 'Insertion'];
                this.data.frequencyOptions = ['Novel', 'Rare', 'Common'];
                this.dataForGeneSearch = {
                    heading: 'Gene with Variant',
                    results: this.geneList,
                    searchContext: 'Select variants of interest',
                    resultContext: 'Selected Variants',
                    placeholderText: 'Try searching for a gene (Ex: CHD8)',
                    sample: true
                }
                this.dataForConsequenceSearch = {
                    heading: 'Variant consequence calculated',
                    results: this.consequencesList,
                    searchContext: 'Select variant frequency as text',
                    resultContext: 'Selected variant consequence calculated',
                    placeholderText: 'Try searching for a consequence (Ex: intergenic_variant)',
                    sample: false
                };
                if (opts.currentFilter) {
                    this.dataForGeneSearch.searchResults = opts.currentFilter.genes;
                    this.dataForConsequenceSearch.searchResults = opts.currentFilter.consequences;
                    this.previousFilter = opts.currentFilter;
                }
                
                this.geneSearchPanel = new searchPanel(this.dataForGeneSearch);
                this.consequenceSearchPanel = new searchPanel(this.dataForConsequenceSearch);

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
            applyGenomicFilters: function(){
                console.log("apply genomic filters");
                let parsedSess = JSON.parse(sessionStorage.getItem("session"));
                if(parsedSess.queryTemplate){
                    let parsedQuery = JSON.parse(parsedSess.queryTemplate);
                    parsedQuery.variantInfoFilters = [];
                    let filtersForSesssion = {
                        categoryVariantInfoFilters: {
                            gene_with_variant: this.data.filters.genes,
                            variant_consequence: this.data.filters.consequences,
                            variant_severity: this.data.filters.severity,
                            variant_class: this.data.filters.variantClass,
                            variant_frequency_as_text: this.data.filters.variantFrequencyText
                        },
                        numericVariantInfoFilters: {
                            min: this.data.filters.variantFrequencyNumber[0],
                            max: this.data.filters.variantFrequencyNumber[1]
                        }
                    };
                    parsedQuery.variantInfoFilters.push(filtersForSesssion);
                    parsedSess.queryTemplate = JSON.stringify(parsedQuery);
                }
                console.log(parsedSess);
                sessionStorage.setItem("session", JSON.stringify(parsedSess));
                filterModel.addGenomicFilter(this.data.filters);
                let parsedSess2 = JSON.parse(sessionStorage.getItem("session"));
                console.log(parsedSess2);
            },
            clearGenomicFilters: function(){
                console.log("clear genomic filters");
                this.geneSearchPanel.reset();
                this.consequenceSearchPanel.reset();
                this.$el.find('input[type="checkbox"]').prop('checked', false);
                this.$el.find('input[type="number"]').val('');
                this.data.filters = {};
                this.$el.find('#selected-filters').html(this.filterPartialTemplate({filters: this.data.filters}));
            },
            cancelGenomicFilters: function(){
                $("#modalDialog").hide();
                $(".modal-backdrop").hide();
            },
            reapplyGenomicFilters: function(){
                if (this.previousFilter) {
                    if (this.previousFilter.severity) {
                        $('#severity input[type="checkbox"]').each((i, checkbox)  => { 
                            console.log('checkbox', checkbox);
                            if (this.previousFilter.severity.includes(checkbox.value)) {
                                checkbox.checked = true;
                            }
                        });               
                    }
                    if (this.previousFilter.variantClass) {
                        $('#variant-class input[type="checkbox"]').each((i,checkbox)  => { 
                            console.log('checkbox', checkbox);
                            if (this.previousFilter.variantClass.includes(checkbox.value)) {
                                checkbox.checked = true;
                            }
                        });               
                    }
                    if (this.previousFilter.variantFrequencyText) {
                        $('#frequency-text input[type="checkbox"]').each((i, checkbox)  => { 
                            console.log('checkbox', checkbox);
                            if (this.previousFilter.variantFrequencyText.includes(checkbox.value)) {
                                checkbox.checked = true;
                            }
                        });               
                    }
                    if (this.previousFilter.variantFrequencyNumber) {
                        $('#frequency-number input[type="number"]').each((i, number)  => {
                            console.log('number', number);
                            number.value = this.previousFilter.variantFrequencyNumber[i];
                        });
                    }
                    this.updateGenomicFilter();
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
                        severityData.push($(el).val());
                    });
                }
                if (variantClass.length > 0) {
                    variantClass.each(function(i, el){
                        variantClassData.push($(el).val());
                    });
                }
                if (variantFrequencyText.length > 0) {
                    variantFrequencyText.each(function(i, el){
                        variantFrequencyData.push($(el).val());
                    });
                }
                if (variantFrequencyNumber.length > 0) {
                    variantFrequencyNumber.each(function(i, el){
                        variantFrequencyNumberData.push($(el).val());
                    });
                }
                this.data.filters = {
                    genes: geneData,
                    consequences: conData,
                    severity: severityData,
                    variantClass: variantClassData,
                    variantFrequencyText: variantFrequencyData,
                    variantFrequencyNumber: variantFrequencyNumberData
                }
                
                this.$el.find('#selected-filters').html(this.filterPartialTemplate({filters: this.data.filters}));
                console.log("End update genomic filter", this.data.filters);
                return this.data.filters;
            },
            render: function(){
                this.$el.html(this.template(this.data));
                this.geneSearchPanel.$el = $('#gene-search-container');
                this.consequenceSearchPanel.$el = $('#consequence-search-container');
                this.geneSearchPanel.render();
                this.consequenceSearchPanel.render();
                if (this.previousFilter) {
                    this.reapplyGenomicFilters();
                }
            }
        });
        return genomicFilterView;
});