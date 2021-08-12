define(["jquery","backbone","handlebars","search-interface/tag-filter-view","search-interface/search-results-view",
	"text!search-interface/search-view.hbs",
	"text!search-interface/search-results-view.hbs",
	"text!search-interface/tag-search-response.json",
	"search-interface/search-util",
	"search-interface/filter-list-view"],
		function($, BB, HBS, tagFilterView, searchResultsView,
			searchViewTemplate,
			searchResultsViewTemplate,
			tagSearchResponseJson,
			searchUtil,
			filterListView){

	var SearchView = BB.View.extend({
		initialize: function(opts){
			this.filters = [];
			this.resourceUUID = opts.resourceUUID;
			this.outputPanelView = opts.outputPanelView;
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
			this.filterListView = new filterListView({
				el : $('#filter-list-panel')
			});

			this.tagFilterView.render();
			this.searchResultsView.render();
			
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
			this.tagFilterView.updateTags(response);
			this.tagFilterView.render();
			this.searchResultsView.updateResponse(response);
			this.searchResultsView.render();
		},
		submitSearch: function() {
			this.searchTerm = $('#search-box').val();
			this.requiredTags = $('.selected-required-tag').map(function(x) {
				return $(this).data('tag');
			}).toArray();
			this.excludedTags = $('.selected-excluded-tag').map(function(x) {
				return $(this).data('tag');
			}).toArray();
			$.ajax({
				url: window.location.origin + "/jaxrs-service/rest/pic-sure/search",
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({query: {
						searchTerm: this.searchTerm,
						includedTags: this.requiredTags,
						excludedTags: this.excludedTags,
						returnTags: true,
						returnAllResults: false
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

	var filterList = {
		init : function(resourceUUID, outputPanelView, queryTemplate){
			new SearchView({resourceUUID: resourceUUID, outputPanelView: outputPanelView, queryTemplate:queryTemplate, el : $('#filter-list')})
		}
	};

	return filterList;
});
