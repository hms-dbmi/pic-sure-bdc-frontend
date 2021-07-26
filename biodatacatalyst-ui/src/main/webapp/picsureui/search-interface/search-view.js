define(["jquery","backbone","handlebars","search-interface/tag-filter-view","search-interface/search-results-view",
	"text!search-interface/search-view.hbs",
	"text!search-interface/search-results-view.hbs",
	"text!search-interface/tag-search-response.json",
	"text!studyAccess/studies-data.json"],
		function($, BB, HBS, tagFilterView, searchResultsView,
			searchViewTemplate,
			searchResultsViewTemplate,
			tagSearchResponseJson,
			studiesDataJson){

	var SearchView = BB.View.extend({
		initialize: function(opts){
			this.filters = [];
			this.resourceUUID = opts.resourceUUID;
			this.outputPanelView = opts.outputPanelView;
			this.queryTemplate = opts.queryTemplate;
			this.searchViewTemplate = HBS.compile(searchViewTemplate);
			this.studiesData = JSON.parse(studiesDataJson);
			let response = JSON.parse(tagSearchResponseJson);
			let findStudyAbbreviationFromId = this.findStudyAbbreviationFromId.bind(this);

			this.render();
			this.tagFilterView = new tagFilterView({
				tagSearchResponse:response, 
				findStudyAbbreviationFromId: findStudyAbbreviationFromId,
				el : $('#tag-filters'),
				onTagChange: this.submitSearch.bind(this)
			});
			this.searchResultsView = new searchResultsView({
				tagSearchResponse:response, 
				findStudyAbbreviationFromId: findStudyAbbreviationFromId,
				el : $('#search-results')
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
			return "";
		},
		events: {
			"click #search-button": "submitSearch"
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
