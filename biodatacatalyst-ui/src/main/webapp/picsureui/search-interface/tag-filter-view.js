define(["backbone", "handlebars", "text!search-interface/tag-filter-view.hbs"],
function(BB, HBS, tagFilterViewTemplate){
	let studyRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d$');
	let studyVersionRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d');
	let findStudyAbbreviationFromId;

	let TagFilterView = BB.View.extend({
		initialize: function(opts){
			this.response = opts.tagSearchResponse;
			findStudyAbbreviationFromId = opts.findStudyAbbreviationFromId;
		},
		events: {},
		render: function(){
			$('#tag-filters').html(HBS.compile(tagFilterViewTemplate)(
				{
					tags:_.filter(this.response.results.tags, function(tag){return ! studyVersionRegex.test(tag.tag);}),
					hasRequiredTags:true,
					hasExcludedTags:true,
					requiredTags:["cardio"],
					excludedTags:["plasma"],
					studyTags:_.map(
						_.filter(this.response.results.tags, function(tag){
							return studyRegex.test(tag.tag);
						}), function(tag){
							return {
								study_id: tag,
								abbreviation: findStudyAbbreviationFromId(tag.tag)
							};
						})
				})
			);
		}
	});
	return TagFilterView;
});