define(["jquery","backbone","handlebars",
	"text!search-interface/search-view.hbs","text!search-interface/tag-filter-view.hbs",
	"text!search-interface/search-results-view.hbs",
	"text!search-interface/tag-search-response.json",
	"text!studyAccess/studies-data.json"],
		function($, BB, HBS, 
			searchViewTemplate, 
			tagFilterViewTemplate, 
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
			this.render();
			let response = JSON.parse(tagSearchResponseJson);
			let studiesData = JSON.parse(studiesDataJson);
			let studyRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d');
			$('#tag-filters').html(HBS.compile(tagFilterViewTemplate)(
				{
					tags:_.filter(response.results.tags, function(tag){return ! studyRegex.test(tag.tag);}),
					hasRequiredTags:true,
					hasExcludedTags:true,
					requiredTags:["cardio"],
					excludedTags:["plasma"],
					studyTags:_.filter(response.results.tags, function(tag){return studyRegex.test(tag.tag);})
				}));
			$('#search-results').html(HBS.compile(searchResultsViewTemplate)(
				_.map(response.results.searchResults, function(result){
					let metadata = result.result.metadata;
					return {
						abbreviation: _.find(studiesData.bio_data_catalyst, function(studyData){ return studyData.study_identifier === metadata.study_id.split('.')[0];}).abbreviated_name,
						study_id: metadata.study_id,
						table_id: metadata.dataTableId,
						variable_id: metadata.varId,
						description: metadata.description
					}
				})
			));
		},
		events: {

		},
		render: function(){
			$('#filter-list').html(this.searchViewTemplate());
		}
	});

	var filterList = {
		init : function(resourceUUID, outputPanelView, queryTemplate){
			new SearchView({resourceUUID: resourceUUID, outputPanelView: outputPanelView, queryTemplate:queryTemplate})
		}
	};

	return filterList;
});
