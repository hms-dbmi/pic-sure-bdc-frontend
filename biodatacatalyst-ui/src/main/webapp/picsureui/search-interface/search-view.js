define(["jquery","backbone","handlebars","search-interface/tag-filter-view","search-interface/tag-filter-model",
	"search-interface/search-results-view",
	"text!search-interface/search-view.hbs",
	"text!../studyAccess/studies-data.json",
	"search-interface/modal",
	"search-interface/genomic-filter-view",
	"common/spinner",
	"text!common/unexpected_error.hbs",
	"search-interface/search-util",
	"search-interface/filter-model",
],
		function($, BB, HBS, tagFilterView, tagFilterModel,
			searchResultsView,
			searchViewTemplate,
			studiesDataJson,
			modal,
			genomicFilterView,
			spinner,
			helpViewTemplate,
			searchUtil,
			filterModel,
		){

	var SearchView = BB.View.extend({

		initialize: function(opts){
			this.filters = [];
			this.queryTemplate = opts.queryTemplate;
			this.searchViewTemplate = HBS.compile(searchViewTemplate);
			let studiesData = JSON.parse(studiesDataJson);
			this.isOpenAccess = JSON.parse(sessionStorage.getItem('isOpenAccess'));
			//tell the back end to exclude concepts from studies not in the user's scope'
			this.antiScopeStudies = _.filter(studiesData.bio_data_catalyst, function(studyData){
				//if this study is NOT in the query scopes, _.find will return NULL
				return _.find(opts.queryScopes, function(scopeElement){
					return scopeElement.toLowerCase().includes(studyData.study_identifier.toLowerCase());
				}) == null;
			})

			//only include each tag once
			this.antiScopeTags = new Set();
			_.each(this.antiScopeStudies, function(study){
				//add PHSxxxxxx (caps) and phsxxxxxx.vxx (lower) tags to anti-scope
				this.antiScopeTags.add(study.study_identifier.toUpperCase());
				this.antiScopeTags.add((study.study_identifier + "." + study.study_version).toLowerCase());
			}.bind(this));

			this.render();
			this.tagFilterView = new tagFilterView({
				el : $('#tag-filters'),
				isOpenAccess : JSON.parse(sessionStorage.getItem('isOpenAccess')),
				onTagChange: this.submitSearch.bind(this)
			});
			this.searchResultsView = new searchResultsView({
				tagFilterView: this.tagFilterView,
				isOpenAccess: JSON.parse(sessionStorage.getItem('isOpenAccess')),
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
			if(e){
				this.searchTerm = $('#search-box').val();
				if(tagFilterModel.get("term")!==this.searchTerm){
					tagFilterModel.set("term", this.searchTerm, {silent:true});
				}
			}
			else{
				this.searchTerm = tagFilterModel.get("term");
				$('#search-box').val(this.searchTerm);
			}
			this.requiredTags = tagFilterModel.get('requiredTags').models.map(function(x) {
				return x.get('tag');
			});
			this.excludedTags = tagFilterModel.get('excludedTags').models.map(function(x) {
				return x.get('tag');
			});

			//exclude the user selected tags as well as tags not in scope
			searchExcludeTags = JSON.parse(sessionStorage.getItem('isOpenAccess')) ? this.excludedTags : [...this.excludedTags, ...this.antiScopeTags];

			$('#search-results').hide();
			e && $('#tag-filters').hide();
			$('#search-button').attr('disabled', 'disabled');

			//let deferredSearchResults = $.Deferred();
			let deferredSearchResults = $.ajax({
				url: window.location.origin + "/picsure/search/36363664-6231-6134-2D38-6538652D3131",
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({query: {
					searchTerm: this.searchTerm,
					includedTags: this.requiredTags,
					excludedTags: searchExcludeTags,
					returnTags: true,
					limit: 1000000
				}}),
				success: function(response){
					//deferredSearchResults.resolve();
					this.processResults(response);
					this.updateTags(response);
					$('#tag-filters').show();
					$('#search-results').show();
					$('#search-button').removeAttr('disabled');
					$('#spinner-holder').removeClass('big-grow');
				}.bind(this),
				error: function(response){
					//deferredSearchResults.resolve();
					$("#spinner-holder").html("");
					$('#search-button').removeAttr('disabled');
					const helpTemplate = HBS.compile(helpViewTemplate);
					this.$el.html(helpTemplate());
					console.log(response);
				}.bind(this)
			});

			spinner.medium(deferredSearchResults, '#spinner-holder', '');
			$('#spinner-holder').addClass('big-grow');
		},
		// Reorders the results where the variables that are not compatible with the filters are moved to the end of the list.
		processResults: function(response){
			response.results.searchResults =  _.map(response.results.searchResults, function(searchResult){
				searchResult.result.is_harmonized = searchUtil.isStudyHarmonized(searchResult.result.studyId);
				return searchResult;
			});
			const nonHarmonizedFitlers = filterModel.get('activeFilters').filter(filter=>{
				return !filter.get('isHarmonized') && filter.get('type') !== 'genomic';
			});
			const harmonizedFilters = filterModel.get('activeFilters').filter(filter=>{
				return filter.get('isHarmonized') && filter.get('type') !== 'genomic';
			});
			if (nonHarmonizedFitlers && nonHarmonizedFitlers.length>0) {
				const harmonizedSearchResults = response.results.searchResults.filter(searchResult => {
					return searchResult.result.is_harmonized;
				});
				const nonHarmonizedResults = response.results.searchResults.filter(searchResult => {
					return !searchResult.result.is_harmonized;
				});
				response.results.searchResults = nonHarmonizedResults.concat(harmonizedSearchResults);
			} else if (harmonizedFilters && harmonizedFilters.length>0) {
				const harmonizedSearchResults = response.results.searchResults.filter(searchResult => {
					return searchResult.result.is_harmonized;
				});
				const nonHarmonizedResults = response.results.searchResults.filter(searchResult => {
					return !searchResult.result.is_harmonized;
				});
				response.results.searchResults = harmonizedSearchResults.concat(nonHarmonizedResults);
			}
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
				$("#search-button", this.$el)[0].click();
				return false;
			}

		},

		render: function(){
			this.$el.html(this.searchViewTemplate());
			if (JSON.parse(sessionStorage.getItem('isOpenAccess'))) {
				this.$el.find('#genomic-filter-btn').remove();
			}
		}
	});

	return SearchView;
});
