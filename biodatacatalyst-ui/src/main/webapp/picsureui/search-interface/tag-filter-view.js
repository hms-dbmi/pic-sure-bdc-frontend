define(["backbone", "handlebars", "text!search-interface/tag-filter-view.hbs"],
function(BB, HBS, tagFilterViewTemplate){
	let studyRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d$');
	let studyVersionRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d');
	let findStudyAbbreviationFromId;

	let TagFilterModel = BB.Model.extend({
		defaults:{
			requiredTags:[],
			excludedTags:[],
			hasRequiredTags: false,
			hasExcludedTags: false
		}
	});

	let TagFilterView = BB.View.extend({
		initialize: function(opts){
			this.response = opts.tagSearchResponse;
			findStudyAbbreviationFromId = opts.findStudyAbbreviationFromId;
			this.model = new TagFilterModel();
		},
		events: {
			'mouseover .badge': 'showTagControls',
			'mouseout .badge': 'hideTagControls',
			'click .requireTag': 'requireTag',
			'click .excludeTag': 'excludeTag'
		},
		showTagControls: function(event){
			$('.hover-control', event.target).show();
		},
		hideTagControls: function(event){
			$('.hover-control', event.target).hide();
		},
		requireTag: function(event){
			console.log(event);
		},
		excludeTag: function(event){
			console.log(event);
		},
		render: function(){
			this.$el.html(HBS.compile(tagFilterViewTemplate)(
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