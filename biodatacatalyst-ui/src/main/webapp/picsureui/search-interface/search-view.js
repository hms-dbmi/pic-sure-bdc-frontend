define(["jquery","backbone","handlebars","search-interface/tag-filter-view","search-interface/tag-filter-model",
	"search-interface/search-results-view",
	"text!search-interface/search-view.hbs",
	"text!../studyAccess/studies-data.json",
	"search-interface/modal",
	"filter/genomic-filter-view",
	"common/spinner",
	"text!common/unexpected_error.hbs",
	"search-interface/search-util",
	"search-interface/filter-model",
	"common/pic-sure-dialog-view",
	"search-interface/tour-view",
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
			dialog,
			tourView
		){
	const authMessage = "By doing this, you will remove all active search tags, variable filters, genomic filters, and variables for export.";
	const openAccessMessage = "By doing this, you will remove all active search tags, variable filters, and variables for export.";
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

			if ($('#search-box').val() === "") {
				$('#search-box').val(tagFilterModel.get("term"));
			}

			this.tagFilterView.render();
			this.searchResultsView.render();
			Backbone.pubSub.on('destroySearchView', this.destroy.bind(this));
		},
		events: {
			"click #search-button": "submitSearch",
			"keypress #search-box": "handleSearchKeypress",
			"click #genomic-filter-btn": "openGenomicFilteringModal",
			"click #search-reset-button": "resetPage",
			"click #guide-me-button": "openGuideModal",
		},
		openGuideModal: function() {
			this.isStartTour = false;
			const dialogOptions = [
				{title: "Cancel", "action": ()=>{$('.close')?.get(0).click();}, classes: "btn btn-default"},
				{title: "Start Tour", "action": ()=>{
					this.isStartTour = true;
					$('.close')?.get(0).click();
				}, classes: "btn btn-primary"}
			];
			let title = 'Welcome to PIC-SURE Authorized Access';
			let message1 = 'PIC-SURE Authorized Access provides access to complete, participant-level data, in addition to aggregate counts, and access to the Tool Suite.';
			if (this.isOpenAccess) {
				title = 'Welcome to PIC-SURE Open Access';
				message1 = 'PIC-SURE Open Access allows you to search any clinical variable available in PIC-SURE. Your queries will return obfuscated aggregate counts per study and consent.';
			}
			const modalMessages = [
				message1,
				'Once the tour starts you can click anywhere to go to the next step. You can press the escape key to stop the tour at any point. You may also use the arrow keys, enter key, or the spacebar to navigate the tour.'
			];
			const dialogView = new dialog({options: dialogOptions, messages: modalMessages});
			modal.displayModal(dialogView, title, function() {
				// Pass in any tour element ids that are not currently present that maybe be added before the tour is started.
				this.tourView = new tourView({idsToWaitFor: ['study-tags-section-div','tags-section-div','search-results-datatable','first-search-result-row','first-actions-row']});
				if (this.isStartTour) {
					this.setUpTour().then(this.tourView.render());
				} else {
					this.tourView.destroy();
					$('#guide-me-button').focus();
				}
			}.bind(this), {isHandleTabs: true, width: 400});
		},
		setUpTour: function() {
			return new Promise((resolve, reject) => {
				try{
					const session = JSON.parse(sessionStorage.getItem("session"));
					let abbreviatedName;
					let results = $.Deferred();
					if (this.isOpenAccess) {
						$('#search-box').val('epilepsy');
							results = this.submitSearch($('#search-button').get());
							$.when(results).then(()=> {
								resolve();
							});
					} else {
						let phs = undefined;
						if (tagFilterModel.get('requiredTags').length > 0) {
							phs = tagFilterModel.get('requiredTags').at(0).get('tag');
						} else if (filterModel.get('activeFilters').length > 0) {
							abbreviatedName = filterModel.get('activeFilters').at(0).get('searchResult').result.metadata.derived_study_abv_name;
						} else if (session.queryScopes && session.queryScopes[0]) {
							phs = session.queryScopes.find(scope => scope.startsWith('\\p'));
							phs = phs.substring(1, phs.length-1); // remove the backslashes
						}
						if (!abbreviatedName) {
							abbreviatedName = searchUtil.findStudyAbbreviationFromId(phs) || 'epilepsy';
						}
						$('#search-box').val(abbreviatedName);
						results = this.submitSearch($('#search-button').get());
						$.when(results).then(()=> {
							resolve();
						});
					}
				} catch(e) {
					console.error(e);
					reject(e);
				}
			});
		},
		updateTags: function(response) {
			if(!tagFilterModel.changed.currentPage){
				this.tagFilterView.updateTags(response);
				tagFilterModel.set('showTagSection', true);
				this.tagFilterView.render();
			}
			this.searchResultsView.updateResponse(response);
			this.searchResultsView.render();
		},
		resetPage: function(){
			confirm(this.isOpenAccess ? openAccessMessage : authMessage) ? window.location.reload() : null;
		},
		submitSearch: function(e) {
			if(e){
				this.searchTerm = $('#search-box').val();
				if(tagFilterModel.get("term")!==this.searchTerm){
					tagFilterModel.set("term", this.searchTerm, {silent:true});
				}
			} else{
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
			$('#guide-me-button-container').hide();
			$('#search-results').hide();
			e && $('#tags-container').hide();
			$('#search-button').attr('disabled', 'disabled');
			$('#genomic-filter-btn').attr('disabled', 'disabled');

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
					this.processResults(response);
					this.updateTags(response);
					$('#tags-container').show();
					$('#search-results').show();
					$('#search-button').removeAttr('disabled');
					$('#genomic-filter-btn').removeAttr('disabled');
					$('#spinner-holder').removeClass('big-grow');
				}.bind(this),
				error: function(response){
					//deferredSearchResults.resolve();
					$("#spinner-holder").html("");
					$('#search-button').removeAttr('disabled');
					$('#genomic-filter-btn').removeAttr('disabled');
					const helpTemplate = HBS.compile(helpViewTemplate);
					this.$el.html(helpTemplate());
					console.log(response);
				}.bind(this)
			});

			spinner.medium(deferredSearchResults, '#spinner-holder', '');
			$('#spinner-holder').addClass('big-grow');
			return deferredSearchResults;
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
			modal.displayModal(genomicFilter, 'Genomic Filtering', function() {
				$('#filter-list').focus();
			}, {isHandleTabs: true});
			return false;
		},

		handleSearchKeypress: function(event){
			if(event.keyCode===13){
				$("#search-button", this.$el)[0].click();
				return false;
			}

		},
		destroy: function(){
			//https://stackoverflow.com/questions/6569704/destroy-or-remove-a-view-in-backbone-js/11534056#11534056
			this.undelegateEvents();
			$(this.el).removeData().unbind(); 
			this.remove();  
			Backbone.View.prototype.remove.call(this);
		},
		render: function(){
			this.$el.html(this.searchViewTemplate());
			if (JSON.parse(sessionStorage.getItem('isOpenAccess'))) {
				this.$el.find('#genomic-filter-btn').remove();
			}
			$('#search-box').focus();
		}
	});

	return SearchView;
});

