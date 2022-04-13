define(["jquery","backbone","handlebars","search-interface/tag-filter-view","search-interface/tag-filter-model",
	"search-interface/search-results-view",
	"text!search-interface/search-view.hbs",
	"text!../studyAccess/studies-data.json",
	"search-interface/modal",
	"search-interface/genomic-filter-view",
	"common/spinner",
	"text!common/unexpected_error.hbs"
],
		function($, BB, HBS, tagFilterView, tagFilterModel,
			searchResultsView,
			searchViewTemplate,
			studiesDataJson,
			modal,
			genomicFilterView,
			spinner,
			helpViewTemplate
		){

	var SearchView = BB.View.extend({

		initialize: function(opts){
			this.filters = [];
			this.queryTemplate = opts.queryTemplate;
			this.searchViewTemplate = HBS.compile(searchViewTemplate);
			let studiesData = JSON.parse(studiesDataJson);

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
				onTagChange: this.submitSearch.bind(this)
			});
			this.searchResultsView = new searchResultsView({
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
				tagFilterModel.set("term", this.searchTerm, {silent:true});
			}
			this.requiredTags = $('.selected-required-tag').map(function(x) {
				return $(this).data('tag');
			}).toArray();
			this.excludedTags = $('.selected-excluded-tag').map(function(x) {
				return $(this).data('tag');
			}).toArray();

			//exclude the user selected tags as well as tags not in scope
			searchExcludeTags= [...this.excludedTags, ...this.antiScopeTags];

			$('#search-results').hide();
			e && $('#tag-filters').hide();
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
					offset: (tagFilterModel.get("currentPage")-1) * tagFilterModel.get("limit"),
					limit: tagFilterModel.get("limit")
				}}),
				success: function(response){
					//deferredSearchResults.resolve();
					this.updateTags(response);
					$('#tag-filters').show();
					$('#search-results').show();
					$('#spinner-holder').removeClass('big-grow');
				}.bind(this),
				error: function(response){
					//deferredSearchResults.resolve();
					$("#spinner-holder").html("");
					const helpTemplate = HBS.compile(helpViewTemplate);
					this.$el.html(helpTemplate());
					console.log(response);
				}.bind(this)
			});

			spinner.medium(deferredSearchResults, '#spinner-holder', '');
			$('#spinner-holder').addClass('big-grow');
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
		}
	});

	return SearchView;
});
