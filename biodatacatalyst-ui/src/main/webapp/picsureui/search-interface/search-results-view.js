define(["backbone", "handlebars", "text!search-interface/search-results-view.hbs", "text!search-interface/search-results-list.hbs", 
		"text!options/modal.hbs", "search-interface/data-table-info-view", "search-interface/search-util", "search-interface/filter-modal-view",
		"search-interface/categorical-filter-modal-view", "search-interface/filter-model", "search-interface/tag-filter-model", 
		"search-interface/modal", "search-interface/variable-info-cache", "search-interface/keyboard-nav"],
function(BB, HBS, searchResultsViewTemplate, searchResultsListTemplate, 
		 modalTemplate, dataTableInfoView, searchUtil, filterModalView,
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
			"click .page-link>a":"pageLinkHandler",
			'focus #search-results-div': 'resultsFocus',
			'blur #search-results-div': 'resultsBlur',
			'keypress #search-results-div': 'resultKeyHandler'
		},
		nextPage: function(){
			let nextPageLink = document.getElementById('page-link-' + tagFilterModel.get("currentPage")).nextSibling.nextSibling;
			if(nextPageLink){
				tagFilterModel.set("currentPage", nextPageLink.dataset["page"]);
			}
		},
		previousPage: function(){
			let previousPageLink = document.getElementById('page-link-' + tagFilterModel.get("currentPage")).previousSibling.previousSibling;
			if(previousPageLink){
				tagFilterModel.set("currentPage", previousPageLink.dataset["page"]);
			}
		},
		pageLinkHandler: function(event){
			tagFilterModel.set("currentPage", event.target.innerText);
		},
		updateResponse: function(response) {
			tagFilterModel.set("searchResults",response);
		},
		previousSearchResult: function(event){
			let results = this.$(".search-result.row");
			let focusedResult = 1;
			for(var x = 0;x < results.length;x++){
				if($(results[x]).hasClass('focused-search-result')){
					focusedResult = x;
					$(results[x]).removeClass('focused-search-result')
				}
			}
			if(focusedResult===0){
				focusedResult = results.length;
			}
			$(results[focusedResult - 1]).addClass('focused-search-result');
		},
		nextSearchResult: function(event){
			let results = this.$(".search-result.row");
			let focusedResult = -1;
			for(var x = 0;x < results.length;x++){
				if($(results[x]).hasClass('focused-search-result')){
					focusedResult = x;
					$(results[x]).removeClass('focused-search-result')
				}
			}
			$(results[(focusedResult + 1) % results.length]).addClass('focused-search-result');
		},
		resultsFocus: function(event){
			this.focusedSection = '#search-results-div';
			this.nextSearchResult();
			keyboardNav.setCurrentView("searchResults");
		},
		resultsBlur: function(){
			this.focusedSection = undefined;
			this.$("#search-results-div  .search-result.focused-search-result").removeClass('focused-search-result');
		},
		infoClickHandler: function(event) {
			if(event.target.classList.contains('fa')){
				return;
			}
			let dataTableId = $(event.target).data('data-table-id');
			let variableId = $(event.target).data('variable-id');
			$.ajax({
				url: window.location.origin + "/jaxrs-service/rest/pic-sure/query/sync",
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({query: {id: dataTableId, entityType: "DATA_TABLE"}}),
				success: function(response){
					variableInfoCache[variableId] = {
							studyDescription: response.metadata.study_description,
							studyAccession: this.generateStudyAccession(response),
							studyAccessionTagId: this.generateStudyAccessionTagId(response.metadata.study_id),
							studyAccessionTagName: searchUtil.findStudyAbbreviationFromId(response.metadata.study_id),
							variableId: variableId,
							variableMetadata: response.variables[variableId].metadata
						};
					this.dataTableInfoView = new dataTableInfoView({
						varId: variableId,
						el: $(".modal-body")
					});
					this.dataTableInfoView.render();
					modal.displayModal(this.dataTableInfoView, response.metadata.description,  ()=>{
						$('#search-results-div').focus();
					});
				}.bind(this),
				error: function(response){
					console.log(response);
				}.bind(this)
			});
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
				searchResult: searchResult,
				filter: filter ? filter.toJSON() : undefined
			}

			if (!_.isEmpty(searchResult.result.values)) {
				this.filterModalView = new categoricalFilterModalView({
					data: filterViewData,
					el: $(".modal-body")
				});
			} else {
				this.filterModalView = new filterModalView({
					data: filterViewData,
					el: $(".modal-body")
				});
			}
			$.ajax({
				url: window.location.origin + "/jaxrs-service/rest/pic-sure/query/sync",
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({query: {id: searchResult.result.dtId, entityType: "DATA_TABLE"}}),
				success: function(response){
					variableInfoCache[searchResult.result.varId] = {
									studyDescription: response.metadata.study_description,
									studyAccession: this.generateStudyAccession(response),
									studyAccessionTagId: this.generateStudyAccessionTagId(response.metadata.study_id),
									studyAccessionTagName: searchUtil.findStudyAbbreviationFromId(response.metadata.study_id),
									variableId: searchResult.result.varId,
									variableMetadata: response.variables[searchResult.result.varId].metadata
								};

					modal.displayModal(this.filterModalView, searchResult.result.metadata['description']);
				}.bind(this),
				error: function(response){
					console.log(response);
				}.bind(this)
			});
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
			}
		}
	});
	return StudyResultsView;
});