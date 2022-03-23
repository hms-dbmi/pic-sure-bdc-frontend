define(['jquery', 'backbone','handlebars', 
'search-interface/filter-model',
'text!search-interface/genomic-filter-view.hbs', 
'search-interface/selection-search-panel-view', 
'text!search-interface/selection-panel.hbs', 
'text!search-interface/numerical-filter-modal-partial.hbs', 
'text!search-interface/genomic-filter-partial.hbs',
'text!../studyAccess/variant-data.json',
'picSure/ontology', "common/spinner",
'common/keyboard-nav'],
    function($, BB, HBS, filterModel, genomicView, searchPanel, selectionPanel, numericalPanel, filterContainer, variantDataJson, ontology, spinner, keyboardNav) {
        const geneKey = 'Gene_with_variant';
        const consequenceKey = 'Variant_consequence_calculated';
        const severityKey = 'Variant_severity';
        const classKey = 'Variant_class';
        const frequencyKey = 'Variant_frequency_as_text';
        const TABABLE_CLASS = '.tabable';
        const SELECTED = 'selected';
        const LIST_ITEM = 'list-item';
        let isLoading = true;
        let genomicFilterView = BB.View.extend({
            initialize: function(opts){
                this.previousUniqueId = 0;
                $("body").tooltip({ selector: '[data-toggle=tooltip]' });
                this.data = opts;
                this.infoColumns = [];
                this.loadingData = ontology.getInstance().allInfoColumnsLoaded.then(function(){
                    this.infoColumns = ontology.getInstance().allInfoColumns();
                    this.data.geneDesc = this.infoColumns.find(col => col.key === geneKey).description.split('"')[1];
                    this.data.consequenceDesc = this.infoColumns.find(col => col.key === consequenceKey).description.split('"')[1];
                    this.data.severityDescription = this.infoColumns.find(col => col.key === severityKey).description.split('"')[1];
                    this.data.classDescription = this.infoColumns.find(col => col.key === classKey).description.split('"')[1];
                    this.data.frequencyDescription = this.infoColumns.find(col => col.key === frequencyKey).description.split('"')[1];
                    isLoading = false;
                    this.render();
                }.bind(this));
                this.template = HBS.compile(genomicView);
                this.filterPartialTemplate = HBS.compile(filterContainer);
                const selectionPanelTemplate = HBS.compile(selectionPanel);
                const numericalPanelTemplate = HBS.compile(numericalPanel);
                keyboardNav.addNavigableView('genomic-filter-view', this);
                HBS.registerPartial('selection-panel', selectionPanelTemplate);
                HBS.registerPartial('numerical-filter-partial', numericalPanelTemplate);
                this.on({
                    'keynav-arrowup document': this.navigateUp.bind(this),
                    'keynav-arrowdown document': this.navigateDown.bind(this),
                    'keynav-arrowright document': this.navigateDown.bind(this),
                    'keynav-arrowleft document': this.navigateUp.bind(this),
                    'keynav-enter': this.clickItem.bind(this),
                    'keynav-space': this.clickItem.bind(this)
                });
            },
            events: {
              'click #cancel-genomic-filters' : 'cancelGenomicFilters',
              'click #apply-genomic-filters' : 'applyGenomicFilters',
              'click #clear-genomic-filters' : 'clearGenomicFilters',
              'change input[type="checkbox"],input[type="number"]' : 'updateGenomicFilter',
              'updatedLists' : 'updateGenomicFilter',
              'focus #severity .selection-box' : 'onFocusSelection',
              'blur #severity .selection-box' : 'onBlurSelection',
              'focus #variant-class .selection-box' : 'onFocusSelection',
              'blur #variant-class .selection-box' : 'onBlurSelection',
              'focus #frequency-text .selection-box' : 'onFocusSelection',
              'blur #frequency-text .selection-box' : 'onBlurSelection',
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
                    searchContext: 'Select genes of interest',
                    resultContext: 'Selected genes',
                    placeholderText: 'Try searching for a gene (Ex: CHD8)',
                    description: this.data.geneDesc,
                    sample: true
                }
                this.dataForConsequenceSearch = {
                    heading: 'Variant consequence calculated',
                    results: consequencesList,
                    searchContext: 'Select calculated variant consequence',
                    resultContext: 'Selected calculated variant consequence',
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
                console.debug("apply genomic filters");
                let filtersForQuery = {
                    categoryVariantInfoFilters: this.data.categoryVariantInfoFilters,
                    numericVariantInfoFilters: {}
                };
                //this.createUniqueId(filtersForQuery); uncomment to support multiple filters
                console.debug(filtersForQuery);
                filterModel.addGenomicFilter(filtersForQuery, this.previousUniqueId);
                this.cancelGenomicFilters();
            },
            clearGenomicFilters: function(){
                console.debug("clear genomic filters");
                this.geneSearchPanel.reset();
                this.consequenceSearchPanel.reset();
                this.$el.find('input[type="checkbox"]').prop('checked', false);
                this.$el.find('input[type="number"]').val('');
                this.data.filters = {};
                this.$el.find('#selected-filters').html(this.filterPartialTemplate({filters: this.data.categoryVariantInfoFilters}));
                this.$el.find('#apply-genomic-filters').prop('disabled', true);
            },
            cancelGenomicFilters: function(){
                this.undelegateEvents();
                $('.close').click();
            },
            createTabIndex: function() {
                let genomicTabIndex = 1000000;
                $('#gene-search-container').find(TABABLE_CLASS).each((i, el) => {
                    $(el).attr('tabindex', genomicTabIndex);
                    genomicTabIndex++;
                });
                $('#consequence-search-container').find(TABABLE_CLASS).each((i, el) => {
                    $(el).attr('tabindex', genomicTabIndex);
                    genomicTabIndex++;
                });
                $('#severity').find(TABABLE_CLASS).each((i, el) => {
                    $(el).attr('tabindex', genomicTabIndex);
                    genomicTabIndex++;
                });
                $('#variant-class').find(TABABLE_CLASS).each((i, el) => {
                    $(el).attr('tabindex', genomicTabIndex);
                    genomicTabIndex++;
                });
                $('#frequency-text').find(TABABLE_CLASS).each((i, el) => {
                    $(el).attr('tabindex', genomicTabIndex);
                    genomicTabIndex++;
                });
                $('#filters').find(TABABLE_CLASS).each((i, el) => {
                    $(el).attr('tabindex', genomicTabIndex);
                    genomicTabIndex++;
                });
            }, 
            reapplyGenomicFilters: function(){
                if (this.previousFilter) {
                    this.previousUniqueId = this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.__uniqueid;
                    if (this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_severity) {
                        $('#severity input[type="checkbox"]').each((i, checkbox)  => {
                            if (this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_severity.includes(checkbox.value.toUpperCase())) {
                                checkbox.checked = true;
                            }
                        });               
                    }
                    if (this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_class) {
                        $('#variant-class input[type="checkbox"]').each((i,checkbox)  => {
                            let value = checkbox.value === 'SNV' ? checkbox.value.toUpperCase() : checkbox.value.toLowerCase();
                            if (this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_class.includes(value)) {
                                checkbox.checked = true;
                            }
                        });               
                    }
                    if (this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_frequency_as_text) {
                        $('#frequency-text input[type="checkbox"]').each((i, checkbox)  => {
                            let value = checkbox.value.substr(0,1).toUpperCase() + checkbox.value.substr(1).toLowerCase();
                            if (this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_frequency_as_text.includes(value)) {
                                checkbox.checked = true;
                            }
                        });               
                    }
                    if (!(_.isEmpty(this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Gene_with_variant)) && this.geneSearchPanel.$el.length > 0) {
                        this.geneSearchPanel.$el.find('.selections input[type="checkbox"]').each((i, checkbox)  => {
                            checkbox.checked = true;
                        });
                    }
                    if (!(_.isEmpty(this.previousFilter.variantInfoFilters.categoryVariantInfoFilters.Variant_consequence_calculated)) && this.consequenceSearchPanel.$el.length > 0) {
                        this.consequenceSearchPanel.$el.find('.selections input[type="checkbox"]').each((i, checkbox)  => {
                            checkbox.checked = true;
                        });
                    }
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
                console.debug("Start update genomic filter");
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
                        variantClassData.push(elVal);
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
                };

                this.updateDisabledButton();
                
                this.$el.find('#selected-filters').html(this.filterPartialTemplate({filters: {
                        categoryVariantInfoFilters: this.data.categoryVariantInfoFilters
                    }
                }));
                console.debug("End update genomic filter", this.data.categoryVariantInfoFilters);
            },
            createUniqueId: function(obj){
                let uniqueId = '';
                if (obj && Object.keys(obj).length > 0 && Object.values(obj).length > 0) {
                        _.each(obj, (value) => {
                            if (value && typeof value === 'object' && !Array.isArray(value)) {
                                uniqueId += this.createUniqueId(value);
                            } else if (value && Array.isArray(value)) {
                                _.each(value, (entry) => {
                                    uniqueId += entry;
                                });
                            } else if (value) {
                                uniqueId += value
                            }
                        });
                } else {
                    return;
                }
                let hash = 0;
                if (uniqueId.length > 0) {
                    for (let i=0; i<uniqueId.length; i++) {
                        hash = ((hash << 5) - hash) + uniqueId.charCodeAt(i);
                        hash |= 0;
                    }
                }
                Object.defineProperty(obj, "__uniqueid", {value: parseInt(hash), configurable: true, enumerable: false, writable: true});
            },
            onFocusSelection: function(e){
                keyboardNav.setCurrentView('genomic-filter-view');
            },
            onBlurSelection: function(e){
                console.debug("Blur selection", e.target);
                keyboardNav.setCurrentView(undefined);
                $(e.target).find('.' + SELECTED).removeClass(SELECTED);
            },
            navigateUp: function(e) {
                console.debug('navigateUp', e);
                let selectionItems = e.target.querySelectorAll('.' + LIST_ITEM);
                let selectedItem = $(selectionItems).filter('.' + SELECTED);
                if ($(selectedItem).length <= 0) {
                    $(selectionItems).eq(0).addClass(SELECTED);
                    return;
                }
                let index = $(selectionItems).index(selectedItem);
                let nextItem = $(selectionItems).eq(index - 1);
                if (nextItem.length > 0) {
                    selectedItem.removeClass(SELECTED);
                    selectedItem.attr('aria-selected', false);
                    nextItem.attr('aria-selected', true);
                    nextItem.attr('aria-live', "polite");
                    $(nextItem)[0].scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
                }
            },
            navigateDown: function(e) {
                console.debug('navigateDown', e);
                let selectionItems = e.target.querySelectorAll('.' + LIST_ITEM);
                let selectedItem = $(selectionItems).filter('.' + SELECTED);
                if ($(selectedItem).length <= 0) {
                    $(selectionItems).eq(0).addClass(SELECTED);
                    return;
                }
                let index = $(selectionItems).index(selectedItem);
                nextItem = (index === selectionItems.length - 1) ? $(selectionItems).eq(0) : $(selectionItems).eq(index + 1);
                if (nextItem.length > 0) {
                    selectedItem.removeClass(SELECTED);
                    selectedItem.attr('aria-selected', false);
                    nextItem.addClass(SELECTED);
                    nextItem.attr('aria-selected', true);
                    nextItem.attr('aria-live', "polite");
                    $(nextItem)[0].scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
                }
            },
            clickItem: function(e) {
                console.debug(e.target);
                let selectedItem = e.target.querySelector('.' + SELECTED);
                selectedItem && selectedItem.click();
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
                    this.createTabIndex();
                } 
                else {
                    this.$el.html('<div id="genomic-spinner"></div>');
                    spinner.medium(this.loadingData, '#genomic-spinner', '');
                }
            }
        });
        return genomicFilterView;
});