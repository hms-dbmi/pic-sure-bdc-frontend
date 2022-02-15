define(["jquery","backbone","handlebars","search-interface/tag-filter-view","search-interface/tag-filter-model",
	"search-interface/search-results-view",
	"text!search-interface/search-view.hbs",
	"text!search-interface/search-results-view.hbs",
	"text!search-interface/tag-search-response.json"],
		function($, BB, HBS, tagFilterView, tagFilterModel,
			searchResultsView,
			searchViewTemplate,
			searchResultsViewTemplate,
			tagSearchResponseJson){

	var SearchView = BB.View.extend({
		
		initialize: function(opts){
			this.filters = [];
			this.queryTemplate = opts.queryTemplate;
			this.searchViewTemplate = HBS.compile(searchViewTemplate);
			let response = JSON.parse(tagSearchResponseJson);

			this.render();
			this.tagFilterView = new tagFilterView({
				tagSearchResponse:response,
				el : $('#tag-filters'),
				onTagChange: this.submitSearch.bind(this)
			});
			this.searchResultsView = new searchResultsView({
				tagSearchResponse:response,
				tagFilterView: this.tagFilterView,
				el : $('#search-results')
			});

			this.tagFilterView.render();
			this.searchResultsView.render();
			tagFilterModel.bind('change', this.submitSearch.bind(this));
		},

		findStudyAbbreviationFromId: function(study_id){
			let study = _.find(this.studiesData.bio_data_catalyst,
				function(studyData){
					return studyData.study_identifier === study_id.split('.')[0].toLowerCase();
				});
			if (study) {
				return study.abbreviated_name;
			}
			return study_id;
		},

		events: {
			"click #search-button": "submitSearch",
			"keypress #search-box": "handleSearchKeypress"
		},

		updateTags: function(response) {
			if(!tagFilterModel.changed.currentPage){
				this.tagFilterView.updateTags(response);
				this.tagFilterView.render();
			}
			this.searchResultsView.updateResponse(response);
			this.searchResultsView.render();
		},

		submitSearch: function() {
			this.searchTerm = $('#search-box').val();
			if(tagFilterModel.get("term")!==this.searchTerm){
				tagFilterModel.reset({silent:true});
				tagFilterModel.set("term", this.searchTerm);
			}
			this.requiredTags = $('.selected-required-tag').map(function(x) {
				return $(this).data('tag');
			}).toArray();
			this.excludedTags = $('.selected-excluded-tag').map(function(x) {
				return $(this).data('tag');
			}).toArray();
			$.ajax({
				url: window.location.origin + "/picsure/search/36363664-6231-6134-2D38-6538652D3131",
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({query: {
						searchTerm: this.searchTerm,
						includedTags: this.requiredTags,
						excludedTags: this.excludedTags,
						returnTags: true,
						offset: (tagFilterModel.get("currentPage")-1) * tagFilterModel.get("limit"),
						limit: tagFilterModel.get("limit")
					}}),
				success: function(response){
					this.updateTags(response);
				}.bind(this),
				error: function(response){
					console.log(response);
				}.bind(this)
			});
		},

		handleSearchKeypress: function(event){
			if(event.keyCode===13){
				this.submitSearch();
			}
		},

		render: function(){
			this.$el.html(this.searchViewTemplate());
		}
	});

	return SearchView;
});
