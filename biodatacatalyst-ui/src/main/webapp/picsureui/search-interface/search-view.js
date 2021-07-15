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
			$('#filter-list').html("");
			this.filters = [];
			this.resourceUUID = opts.resourceUUID;
			this.outputPanelView = opts.outputPanelView;
			this.queryTemplate = opts.queryTemplate;
			this.searchViewTemplate = HBS.compile(searchViewTemplate);
			this.studiesData = JSON.parse(studiesDataJson);
			let response = JSON.parse(tagSearchResponseJson);
			let findStudyAbbreviationFromId = this.findStudyAbbreviationFromId.bind(this);

			this.tagFilterView = new tagFilterView({
				tagSearchResponse:response, 
				findStudyAbbreviationFromId: findStudyAbbreviationFromId
			});
			this.searchResultsView = new searchResultsView({
				tagSearchResponse:response, 
				findStudyAbbreviationFromId: findStudyAbbreviationFromId
			});
			this.render();
			
		},
		findStudyAbbreviationFromId: function(study_id){
			return _.find(this.studiesData.bio_data_catalyst, 
							function(studyData){ 
								return studyData.study_identifier === study_id.split('.')[0].toLowerCase();
							}).abbreviated_name;
		},
		events: {

		},
		render: function(){
			$('#filter-list').html(this.searchViewTemplate());
			this.tagFilterView.render();
			this.searchResultsView.render();
		}
	});

	var filterList = {
		init : function(resourceUUID, outputPanelView, queryTemplate){
			new SearchView({resourceUUID: resourceUUID, outputPanelView: outputPanelView, queryTemplate:queryTemplate})
		}
	};

	return filterList;
});
