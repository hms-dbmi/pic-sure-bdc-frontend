define(["backbone", "handlebars", "text!search-interface/search-results-view.hbs", "text!search-interface/search-results-list.hbs",
		"text!options/modal.hbs", "search-interface/variable-info-modal-view", "search-interface/search-util",
		"search-interface/numerical-filter-modal-view", "search-interface/categorical-filter-modal-view",
		"search-interface/filter-model", "search-interface/tag-filter-model",
		"search-interface/modal", "search-interface/variable-info-cache", "common/keyboard-nav"],
function(BB, HBS, searchResultsViewTemplate, searchResultsListTemplate,
		 modalTemplate, dataTableInfoView, searchUtil, numericFilterModalView,
		 categoricalFilterModalView, filterModel, tagFilterModel,
		 modal, variableInfoCache, keyboardNav){

	let StudyResultsView = BB.View.extend({
		initialize: function(opts){
			this.modalTemplate = HBS.compile(modalTemplate);
			keyboardNav.addNavigableView("searchResults",this);
			this.on({
				'keynav-arrowup document': this.previousSearchResult,
				'keynav-arrowdown document': this.nextSearchResult,
				'keynav-arrowright document': this.nextPage,
				'keynav-arrowleft document': this.previousPage
			});
		},
		events: {
			"click .search-result": "infoClickHandler",
			"click .fa-filter": "filterClickHandler",
			"click .fa-database": "databaseClickHandler",
			"click .page-link>a":"pageLinkHandler",
			'focus #search-results-div': 'resultsFocus',
			'blur #search-results-div': 'resultsBlur',
			'keypress #search-results-div': 'resultKeyHandler'
		},
		nextPage: function(){
			let nextPageLink = document.getElementById('page-link-' + tagFilterModel.get("currentPage")).nextElementSibling;
			if(nextPageLink){
				tagFilterModel.set("currentPage", nextPageLink.dataset["page"]);
			}
			$('#aria-live').html("Now on page " + tagFilterModel.get("currentPage") + " of the results region.");
		},
		previousPage: function(){
			let previousPageLink = document.getElementById('page-link-' + tagFilterModel.get("currentPage")).previousElementSibling;
			if(previousPageLink){
				tagFilterModel.set("currentPage", previousPageLink.dataset["page"]);
			}
			$('#aria-live').html("Now on page " + tagFilterModel.get("currentPage") + " of the results region.");
		},
		pageLinkHandler: function(event){
			tagFilterModel.set("currentPage", event.target.innerText);
		},
		updateResponse: function(response) {
			tagFilterModel.set("searchResults",response, {silent:true});
		},
		adjustFocusedResult: function(adjustment, results){
			let focusedResult = adjustment;
			for(var x = 0;x < results.length;x++){
				if($(results[x]).hasClass('focused-search-result')){
					focusedResult = x;
					$(results[x]).removeClass('focused-search-result')
				}
			}
			focusedResult = focusedResult - adjustment;
			if(focusedResult===-1){
				focusedResult = results.length-1;
			}
			if(focusedResult===results.length){
				focusedResult=0;
			}
			$(results[focusedResult]).addClass('focused-search-result');
			$("#search-results-div").attr("aria-activedescendant", results[focusedResult].id);

			searchUtil.ensureElementIsInView(results[focusedResult]);
		},
		previousSearchResult: function(event){
			let results = this.$(".search-result.row");
			let focusedResult = this.adjustFocusedResult(1, results);
		},
		nextSearchResult: function(event){
			let results = this.$(".search-result.row");
			let focusedResult = this.adjustFocusedResult(-1, results);
		},
		resultsFocus: function(event){
			this.focusedSection = '#search-results-div';
			keyboardNav.setCurrentView("searchResults");
		},
		resultsBlur: function(){
			this.focusedSection = undefined;
			keyboardNav.setCurrentView(undefined);
			this.$("#search-results-div  .search-result.focused-search-result").removeClass('focused-search-result');
		},
		cacheVariableInfo: function(response, variableId){
			variableInfoCache[variableId] = {
					studyDescription: response.metadata.study_description,
					studyAccession: this.generateStudyAccession(response),
					studyAccessionTagId: this.generateStudyAccessionTagId(response.metadata.study_id),
					studyAccessionTagName: searchUtil.findStudyAbbreviationFromId(response.metadata.study_id),
					variableId: variableId,
					variableMetadata: response.variables[variableId].metadata
				};
		},
		retrieveDataTableMeta: function(dataTableId, successHandler){
			$.ajax({
				url: window.location.origin + "/picsure/query/sync",
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({resourceUUID: "36363664-6231-6134-2d38-6538652d3131", query: {id: dataTableId, entityType: "DATA_TABLE"}}),
				success: successHandler,
				error: function(response){
					console.log(response);
				}.bind(this)
			});
		},
		infoClickHandler: function(event) {
			if(event.target.classList.contains('fa')){
				return;
			}
			let dataTableId = $(event.target).data('data-table-id');
			let variableId = $(event.target).data('variable-id');
			$('#search-results-div').blur();
			this.retrieveDataTableMeta(dataTableId, function(response){
				this.cacheVariableInfo(response, variableId);
				this.dataTableInfoView = new dataTableInfoView({
					varId: variableId,
					el: $(".modal-body")
				});
				this.dataTableInfoView.render();
				modal.displayModal(this.dataTableInfoView, response.metadata.description,  ()=>{
					$('#search-results-div').focus();
				});
			}.bind(this));
		},
		resultKeyHandler: function(event){
			event.target = $('.focused-search-result')[0];
			if(event.key.toLowerCase()==='f'){
				this.filterClickHandler(event);
			}
			if(event.key.toLowerCase()==='i'){
				this.infoClickHandler(event);
			}
			if(event.key.toLowerCase()==='enter'){
				this.infoClickHandler(event);
			}
		},
		filterClickHandler: function(event) {
			let resultIndex = $(event.target).data('result-index');

			let searchResult = tagFilterModel.get("searchResults").results.searchResults[resultIndex];

			let filter = filterModel.getByVarId(searchResult.result.varId);

			let filterViewData = {
				data: {
					searchResult: searchResult,
					filter: filter ? filter.toJSON() : undefined
				},
				el: $(".modal-body")
			}

			if (!_.isEmpty(searchResult.result.values)) {
				this.filterModalView = new categoricalFilterModalView(filterViewData);
			} else {
				this.filterModalView = new numericFilterModalView(filterViewData);
			}
			this.retrieveDataTableMeta(searchResult.result.dtId, function(response){
				this.cacheVariableInfo(response, searchResult.result.varId);
				modal.displayModal(this.filterModalView, searchResult.result.metadata['description'], ()=>{
					$('#search-results-div').focus();
				});
			}.bind(this));
		},
		databaseClickHandler: function(event) {
			let resultIndex = $(event.target).data("result-index");

			let searchResult = tagFilterModel.get("searchResults").results
			.searchResults[resultIndex];
			filterModel.toggleExportField(searchResult);
			console.log(
				"Current export field count is " + filterModel.getExportFieldCount()
			);
		},
		generateStudyAccession: function(response) {
			let studyAccession = response.metadata.study_id;
			if (response.metadata.participant_set) {
				studyAccession += '.p' + response.metadata.participant_set
			}
			return studyAccession;
		},
		generateStudyAccessionTagId: function(studyId) {
			return studyId.split('.')[0].toUpperCase();
		},
		render: function(){
			if($('#search-results-div')[0]===undefined){
				this.$el.html(HBS.compile(searchResultsViewTemplate));
			}

			if (tagFilterModel.get("searchResults")) {
				if (tagFilterModel.get("searchResults").results.searchResults.length === 0) {
					$("#search-area").html('<div style="margin-left: 35px" aria-label="0 results match your search">0 results match your search</div>');
				}
				let results = _.map(tagFilterModel.get("searchResults").results.searchResults, function(result, i){
					let metadata = result.result.metadata;
					return {
						abbreviation: searchUtil.findStudyAbbreviationFromId(metadata.study_id),
						study_id: metadata.study_id,
						table_id: metadata.dataTableId,
						variable_id: metadata.varId,
						name: metadata.name,
						dataTableDescription: metadata.dataTableDescription,
						description: metadata.description,
						result_index: i
					}
				});
				let pageSize = tagFilterModel.get("limit");
				let pages = [];
				for(var offset = 0;offset < tagFilterModel.get("searchResults").results.numResults; offset += pageSize){
					var pageNumber = parseInt(offset/pageSize) + 1;
					pages.push({
						pageNumber : parseInt(offset/pageSize) + 1,
						isActive : tagFilterModel.get("currentPage") == pageNumber
					});
				}
				$('#search-results-div').html(HBS.compile(searchResultsListTemplate)(
					{
						"results": results,
						"variableCount": tagFilterModel.get("searchResults").results.numResults,
						"pages": pages
					}
				));
				$('#search-results-div').attr('aria-label',
					"You are in the results region on page " +
					tagFilterModel.get("currentPage") + " out of " + pages.length +
					" pages of search results with up to 10 results per page. There are " +
					tagFilterModel.get("searchResults").results.numResults + " total search results." +
					" Use the up and down arrows to move between search results." +
					" Use the left and right arrows to move between pages of search results. You are currently on page ");
			}
		}
	});
	return StudyResultsView;
});
