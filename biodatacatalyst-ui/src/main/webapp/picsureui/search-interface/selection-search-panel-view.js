define(['jquery', 'backbone','handlebars', 'text!search-interface/selection-search-panel.hbs', 'common/keyboard-nav'],
    function($, BB, HBS, searchPanelTemplate, keyboardNav) {
        const LIST_ITEM = 'list-item';
        const SELECTED = 'selected';
        let selectionSearchView = BB.View.extend({
            initialize: function(opts){
                if (opts && opts.heading) {
                    this.data = opts;
                    this.data.searchId = opts.heading.toLowerCase().replace(/\s/g, '-');
                    this.data.searchResultOptionsText = opts.placeholderText || 'Search ' + opts.heading;
                    this.resetSearchResults();
                    this.data.cachedResults = this.data.searchResultOptions;
                    this.data.selectedResults = opts.searchResults || [];
                }
                console.debug('selectionSearchView', this.data);
                this.template = HBS.compile(searchPanelTemplate);
                keyboardNav.addNavigableView("selection-search-results", this);
                keyboardNav.addNavigableView("selections",this);
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
                'click #selection-clear-button' : 'clearSelection',
            },
            addEvents: function() {
                $('.genomic-value-container.selection-search-results input').on('change', this.selectItem.bind(this));
                $('.genomic-value-container.selections input').on('change', this.unselectItem.bind(this));
                $('#'+this.data.searchId+'-selection-clear-button').on('click', this.clearSelection.bind(this));
                $('#'+this.data.searchId+'-selection-select-all').on('click', this.selectAll.bind(this));
                $('.genomic-value-container').on('focus', this.focusItem.bind(this));
                $('.genomic-value-container').on('blur', this.blurItem.bind(this));
            },
            search: function(e) {
                console.debug('search', e.target.value);
                if (e.target.value.length > 1) {
                    this.data.searchResultOptions = this.data.results.filter((gene) => {
                        return gene.toLowerCase().startsWith(e.target.value.toLowerCase());
                    });
                    this.renderLists();
                }else if (e.target.value.length === 0) {
                    this.data.sample ? this.resetSearchResults(this.data.cachedResults) : this.resetSearchResults();
                    this.renderLists();
                }
            },
            clickItem: function(e) {
                console.debug(e.target);
                let selectedItem = e.target.querySelector('.' + SELECTED);
                selectedItem && selectedItem.click();
            },
            selectItem: function(e) {
                console.debug('selectItem', e.target);
                const index = this.data.searchResultOptions.indexOf(e.target.value);
                this.moveItem(this.data.searchResultOptions, this.data.selectedResults, index);
            },
            unselectItem: function(e) {
                console.debug('unselectItem', e.target);
                const index = this.data.selectedResults.indexOf(e.target.value);
                const searchIndex = this.data.searchResultOptions.indexOf(e.target.value)
                if (searchIndex > -1 && index > -1) {
                    this.data.searchResultOptions.splice(searchIndex, 1);
                }
                this.moveItem(this.data.selectedResults, this.data.searchResultOptions, index);
            },
            moveItem: function(from, to, index) {
                if (index > -1) {
                    let item = from.splice(index, 1)[0];
                    to.unshift(item);
                    this.renderLists();
                }
            },
            clearSelection: function() {
                console.debug('clearSelection from here');
                this.$el.find('#'+this.data.searchId).val('');
                this.data.selectedResults.forEach((item) => {
                    this.data.searchResultOptions.indexOf(item) === -1 && this.data.searchResultOptions.unshift(item);
                });
                this.data.selectedResults = [];
                this.renderLists();
            },
            selectAll: function() {
                console.debug('selectAll from here');
                let unselectedItems = $('.selection-search-results input:not(:checked)').map(function(){
                    return $(this).val();
                  }).get();
                this.data.selectedResults = this.data.selectedResults.concat(unselectedItems);
                this.data.searchResultOptions = [];
                this.renderLists();
            },
            focusItem: function(e) {
                console.debug('focusItem', e.target);
                keyboardNav.setCurrentView(e.target.classList[1]);
            },
            blurItem: function(e) {
                console.debug('blurItem', e.target);
                keyboardNav.setCurrentView(undefined);
                $(e.target).find('.'+SELECTED).removeClass(SELECTED);
            },
            resetSearchResults: function(cached) {
                    cached ? 
                        this.data.searchResultOptions = cached : 
                        this.data.sample ? this.data.searchResultOptions = _.sortBy(_.sample(this.data.results, 10)) : this.data.searchResultOptions = _.sortBy(this.data.results);
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
                    selectedItem.attr('role', 'option');
                    selectedItem.attr('aria-selected', false);
                    nextItem.addClass(SELECTED);
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
                    selectedItem.attr('role', 'option');
                    selectedItem.attr('aria-selected', false);
                    nextItem.addClass(SELECTED);
                    nextItem.attr('aria-selected', true);
                    nextItem.attr('aria-live', "polite");
                    $(nextItem)[0].scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
                }
            },
            reset() {
                this.data.sample ? this.data.searchResultOptions = _.sample(this.data.results, 10) : this.data.searchResultOptions = this.data.results;
                this.clearSelection();
            },
            renderLists: function() {
                const newHTMLList  = this.data.searchResultOptions.map((item) => {
                    return this.data.selectedResults.indexOf(item) > -1 ? 
                    `<input class="categorical-filter-input selectable list-item" role="option" type="checkbox" value="${item}" checked disabled/>${item}<br/>` : 
                    `<input class="categorical-filter-input selectable list-item" role="option" type="checkbox" value="${item}" />${item}<br/>`;
                }, this);
                const newHTMLRSelectionList  = this.data.selectedResults.map((item) => {
                    return `<input class="categorical-filter-input selectable list-item" type="checkbox" value="${item}" checked/>${item}<br/>`;
                });      
                this.$el.find('.selections').html(newHTMLRSelectionList).fadeIn('fast');
                const search = this.$el.find('#'+this.data.searchId)[0].value;
                if (this.data.searchResultOptions.length <= 0 && search) {
                    this.$el.find('.genomic-value-container.selection-search-results').html('<span>No results found</span>');
                } else if (this.data.searchResultOptions.length <= 0 && !search && this.data.results.length > this.data.selectedResults.length) {
                    this.$el.find('.genomic-value-container.selection-search-results').html('<span style="color: #AAA">Try searching for more</span>');
                } else {
                    this.$el.find('.selection-search-results').html(newHTMLList).fadeIn('fast');
                }
                this.addEvents();
                this.$el.trigger('updatedLists');
            },
            render: function(){
                this.$el.html(this.template(this.data));
                this.data.description ? this.$el.find('.search-heading').addClass('panel-extra-large') : this.$el.find('.search-heading').removeClass('panel-extra-large');
                const searchInput = this.$el.find('#'+this.data.searchId);
                searchInput && $(searchInput).on('input', this.search.bind(this));
                this.addEvents();
                this.renderLists();
            }
        });
        return selectionSearchView;
    });