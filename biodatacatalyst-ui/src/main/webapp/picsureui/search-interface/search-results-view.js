define(["backbone", "handlebars", "text!search-interface/search-results-view.hbs"],
function(BB, HBS, searchResultsViewTemplate){
	let findStudyAbbreviationFromId;

	let StudyResultsView = BB.View.extend({
		initialize: function(opts){
			this.response = opts.tagSearchResponse;
			findStudyAbbreviationFromId = opts.findStudyAbbreviationFromId;
		},
		events: {},
		render: function(){
			$('#search-results').html(HBS.compile(searchResultsViewTemplate)(
				_.map(this.response.results.searchResults, function(result){
					let metadata = result.result.metadata;
					return {
						abbreviation: findStudyAbbreviationFromId(metadata.study_id),
						study_id: metadata.study_id,
						table_id: metadata.dataTableId,
						variable_id: metadata.varId,
						description: metadata.description
					}
				})
			));
		}
	});
	return StudyResultsView;
});