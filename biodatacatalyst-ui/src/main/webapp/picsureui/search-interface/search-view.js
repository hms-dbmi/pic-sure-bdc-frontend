define(["jquery","backbone","handlebars","search-interface/tag-filter-view","search-interface/tag-filter-model",
	"search-interface/search-results-view",
	"text!search-interface/search-view.hbs",
	"text!search-interface/search-results-view.hbs",
	"text!search-interface/tag-search-response.json",
	"search-interface/modal",
	"search-interface/genomic-filter-view",
	"common/spinner",
	"text!common/unexpected_error.hbs",

],
		function($, BB, HBS, tagFilterView, tagFilterModel,
			searchResultsView,
			searchViewTemplate,
			searchResultsViewTemplate,
			tagSearchResponseJson,
			modal,
			genomicFilterView,
			spinner,
			helpViewTemplate,
		){

	var SearchView = BB.View.extend({
		
		initialize: function(opts){
			this.filters = [];
			this.queryTemplate = opts.queryTemplate;
			this.searchViewTemplate = HBS.compile(searchViewTemplate);
			let response = JSON.parse(tagSearchResponseJson);

			//tell the back end to exclude concepts from studies not in the user's scope'
			this.antiScopeTags = _.filter( _.pluck(results.tags, 'tag'), function(tag){
				return tag.startsWith("PHS") && _.find(opts.queryScope, function(scopeElement){
					scopeElement.toLowerCase().includes(tag.toLowerCase());
				}) == null;
			});
			
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
			"keypress #search-box": "handleSearchKeypress",
			"click #genomic-filter-btn": "openGenomicFilteringModal",
		},

		updateTags: function(response) {
			if(!tagFilterModel.changed.currentPage){
				this.tagFilterView.updateTags(response);
				this.tagFilterView.render();
			}
			this.searchResultsView.updateResponse(response);
			this.searchResultsView.render();
		},

		submitSearch: function(e) {
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
			
			//exclude the user selected tags as well as tags not in scope
			searchExcludeTags = [].push(...this.excludedTags, ...this.antiScopeTags)
			
			$('#search-results').hide();
			e && $('#tag-filters').hide();
			let deferredSearchResults = $.Deferred();
			spinner.medium(deferredSearchResults, '#spinner-holder', '');
			$.ajax({
				url: window.location.origin + "/picsure/search/36363664-6231-6134-2D38-6538652D3131",
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({query: {
						searchTerm: this.searchTerm,
						includedTags: this.requiredTags,
						excludedTags: searchExcludeTags,
						returnTags: true,
						offset: (tagFilterModel.get("currentPage")-1) * tagFilterModel.get("limit"),
						limit: tagFilterModel.get("limit")
					}}),
					success: function(response){
						deferredSearchResults.resolve()
						this.updateTags(response);
						$('#tag-filters').show();
						$('#search-results').show();
					}.bind(this),
					error: function(response){
						deferredSearchResults.resolve()
						const helpTemplate = HBS.compile(helpViewTemplate);
						this.$el.html(helpTemplate());
						console.log(response);
					}.bind(this)
			});
		},

		openGenomicFilteringModal: function() {
			const genomicFilter = new genomicFilterView({el: $(".modal-body")});
			genomicFilter.render()
			modal.displayModal(genomicFilter, 'Genomic Filtering', function() {
				$('#filter-list').focus();
			});
			return false;
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
