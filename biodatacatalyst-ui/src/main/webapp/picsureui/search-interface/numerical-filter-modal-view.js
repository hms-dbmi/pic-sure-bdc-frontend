define(["jquery","backbone","handlebars", "text!search-interface/numerical-filter-modal-partial.hbs", "text!search-interface/numerical-filter-modal-view.hbs", "search-interface/filter-model", "picSure/search", "picSure/settings", "search-interface/search-util"],
    function($, BB, HBS, partialTemplate, filterModalViewTemplate, filterModel, search, settings, searchUtil){

        var View = BB.View.extend({
            initialize: function(opts){
                this.filterModalViewTemplate = HBS.compile(filterModalViewTemplate);
                this.partialTemplate = HBS.compile(partialTemplate);
                this.data = opts.data;
                this.data.studyName = searchUtil.findStudyAbbreviationFromId(this.data.searchResult.result.studyId);
                HBS.registerPartial('numerical-filter-partial', this.partialTemplate);
            },
            events: {
                "click #add-filter-button": "addFilter",
                "keyup #min-value-input": "checkForEntry",
                "keyup #max-value-input": "checkForEntry"
            },
            addFilter: function(event) {
                let min = $('#min-value-input').val();
                let max = $('#max-value-input').val();
                filterModel.addNumericFilter(
                    this.data.searchResult,
                    min,
                    max
                );
                $('.close').click();
            },
            checkForEntry: function(event){
                if($('#min-value-input').val().length != 0 && $('#max-value-input').val().length != 0){
                    $('#add-filter-button').removeAttr('disabled');
                }
                else{
                    $('#add-filter-button').attr('disabled', 'disabled');
                }
            },
            render: function(){
                search.dictionary(
                    this.data.searchResult.result.metadata.columnmeta_HPDS_PATH,
                    function(searchResponse){
                        let concept = _.values(searchResponse.results.phenotypes)[0];
                        this.data.min = concept.min;
                        this.data.max = concept.max;
                        this.$el.html(this.filterModalViewTemplate(this.data));
                        if(this.data.filter!==undefined){
                            this.$('#max-value-input').val(this.data.filter.max);
                            this.$('#min-value-input').val(this.data.filter.min);
                        }
                    }.bind(this),
                    function(){
                        console.log(arguments);
                    },
                    settings.picSureResourceId)

            }
        });

        return View;
    });
