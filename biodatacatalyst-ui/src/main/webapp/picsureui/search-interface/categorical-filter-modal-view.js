define(["jquery","backbone","handlebars", "text!search-interface/categorical-filter-modal-view.hbs", "search-interface/filter-model", "search-interface/search-util", 'search-interface/selection-search-panel-view'],
    function($, BB, HBS, categoricalFilterModalViewTemplate, filterModel, searchUtil, searchPanel){

        var View = BB.View.extend({
            initialize: function(opts){
                this.categoricalFilterModalViewTemplate = HBS.compile(categoricalFilterModalViewTemplate);
                this.data = opts.data;
                this.data.studyName = searchUtil.findStudyAbbreviationFromId(this.data.searchResult.result.metadata.columnmeta_study_id);
                this.dataForSearchPanel = {
                    heading: 'Available values',
                    results: this.data.searchResult.result.values,
                    searchContext: 'Select values of interest',
                    resultContext: 'Selected values',
                    placeholderText: 'Try searching for values',
                    description: null,
                    sample: false
                }
                if (this.data.filter) {
                    this.dataForSearchPanel.searchResults = this.data.filter.type === 'required' ?
                        this.data.filter.searchResult.result.values :
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
