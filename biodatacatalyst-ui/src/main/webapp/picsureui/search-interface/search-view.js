define(["jquery","backbone","handlebars",
	"text!search-interface/search-view.hbs","text!search-interface/tag-filter-view.hbs",
	"text!search-interface/search-results-view.hbs",
	"text!search-interface/tag-search-response.json"],
		function($, BB, HBS, 
			searchViewTemplate, 
			tagFilterViewTemplate, 
			searchResultsViewTemplate){

	var SearchView = BB.View.extend({
		initialize: function(opts){
			$('#filter-list').html("");
			this.filters = [];
			this.resourceUUID = opts.resourceUUID;
			this.outputPanelView = opts.outputPanelView;
			this.queryTemplate = opts.queryTemplate;
			this.searchViewTemplate = HBS.compile(searchViewTemplate);
			this.render();
			$('#tag-filters').html(HBS.compile(tagFilterViewTemplate)(
				{
					tags:["heart","lungs","asthma","pressure","blood"],
					hasRequiredTags:true,
					hasExcludedTags:true,
					requiredTags:["cardio"],
					excludedTags:["plasma"],
					studyTags:["FHS","ARIC","CHS","COPDgene"]
				}));
			$('#search-results').html(HBS.compile(searchResultsViewTemplate)(
				{results:[
					{
						studyName:"FHS",
						studyAccession:"phs001234.v1",
						variableDescription:"For how long altogether since yoour last ARIC exam have you hormone? Years. Q28A [Reproductive History Form, exam 4]"
					}
				]}));
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
