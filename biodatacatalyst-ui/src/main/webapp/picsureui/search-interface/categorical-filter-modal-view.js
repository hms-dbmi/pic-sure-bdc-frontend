define(["jquery","backbone","handlebars", "underscore", "text!search-interface/categorical-filter-modal-view.hbs", "search-interface/filter-model", "search-interface/search-util", 'common/selection-search-panel-view'],
    function($, BB, HBS, _, categoricalFilterModalViewTemplate, filterModel, searchUtil, searchPanel){

        var View = BB.View.extend({
            initialize: function(opts){
                this.categoricalFilterModalViewTemplate = HBS.compile(categoricalFilterModalViewTemplate);
                this.data = opts.data;
                this.data.studyName = searchUtil.findStudyAbbreviationFromId(this.data.searchResult.result.metadata.columnmeta_study_id);
                this.allVariables = _.values(this.data.searchResult.result.values);
                this.startLocation = 20;
                let topResults = this.allVariables;
                let nextOptionsFunction = undefined;
                if (this.allVariables.length > 100) {
                    topResults = this.allVariables.slice(0, this.startLocation);
                    nextOptionsFunction = this.getNextVariables.bind(this);
                }
                this.dataForSearchPanel = {
                    heading: 'Available values',
                    // todo: remove this _.values call and check for null/empty object
                    searchResultOptions: topResults,
                    results: this.allVariables,
                    searchContext: 'Select values of interest',
                    resultContext: 'Selected values',
                    placeholderText: 'Try searching for values',
                    description: null,
                    getNextOptions: nextOptionsFunction,
                }
                if (this.data.filter) {
                    // todo: remove this _.values call and check for null/empty object
                    this.dataForSearchPanel.searchResults = this.data.filter.type === 'required' ?
                        _.values(this.data.filter.searchResult.result.values) :
                        this.data.filter.values;
                }
                this.searchPanel = new searchPanel(this.dataForSearchPanel);
            },
            events: {
                "click #add-filter-button": "addFilter",
                'updatedLists' : 'updateButtonState',
            },
            addFilter: function(event) {
                if(this.data.searchResult.result.values.length <= $('.results-box .categorical-filter-input:checked').length){
                    filterModel.addRequiredFilter(
                        this.data.searchResult,
                    );
                }else{
                    let values = $('.results-box .categorical-filter-input:checked').map(function(x) {
                        return $(this).val();
                    }).toArray();
                    filterModel.addCategoryFilter(
                        this.data.searchResult,
                        values
                    );
                }
                $('.close').click();
            },
            updateButtonState: function() {
                if (this.searchPanel.data.selectedResults.length > 0) {
                    this.$el.find('#add-filter-button').prop('disabled', false);
                    this.$el.find('#add-filter-button').prop('title', 'Adds Filter');
                } else {
                    this.$el.find('#add-filter-button').prop('disabled', true);
                    this.$el.find('#add-filter-button').prop('title', 'Please select at least one option to add the filter to the query.');
                }
            },
            getNextVariables: function(page, searchTerm, returnAll = false) {
                let totalVars = this.allVariables.length;
                let start = this.startLocation * (page - 1);
                let end = returnAll ? totalVars : this.startLocation * page;
                if (end > totalVars) {
                    end = totalVars;
                }
                return new Promise((resolve, reject) => {
                    try {
                        if (searchTerm) {
                            let searchResults = this.allVariables.filter((result) => {
                                return result.toLowerCase().includes(searchTerm.toLowerCase());
                            });
                            let nextVars = searchResults.slice(start, end);
                            this.startLocation = end;
                            resolve({results: nextVars});
                        } else {
                            let nextVars = this.allVariables.slice(start, end);
                            this.startLocation = end;
                            resolve({results: nextVars});
                        }
                    } catch (e) {
                        this.startLocation = start;
                        console.error(e);
                        reject(e);
                    }
                });
            }, 
            render: function () {
                this.$el.html(this.categoricalFilterModalViewTemplate(this.data));
                this.searchPanel.$el = $('#value-container');
                if (this.data.filter !== undefined) {
                    _.each(
                        (this.data.filter.type === 'required' ? this.data.searchResult.result.values : this.data.filter.values), (value) => {
                            $('.categorical-filter-input[value="' + value + '"]').attr("checked", "true");
                        });
                }
                this.searchPanel.render();
            }
        });

        return View;
    });
