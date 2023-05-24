define(["jquery","backbone","handlebars", "underscore", "text!search-interface/numerical-filter-modal-partial.hbs", "text!search-interface/numerical-filter-modal-view.hbs", "search-interface/filter-model", "picSure/search", "picSure/settings", "search-interface/search-util"],
    function($, BB, HBS, _, partialTemplate, filterModalViewTemplate, filterModel, search, settings, searchUtil){

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
                    JSON.parse(sessionStorage.getItem('isOpenAccess')) ? 
                        settings.openAccessResourceId : 
                        settings.picSureResourceId)

            }
        });

        return View;
    });
