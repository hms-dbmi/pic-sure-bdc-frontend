define(["backbone", "handlebars", "text!search-interface/search-results-view.hbs", "text!search-interface/search-results-list.hbs",
		"text!options/modal.hbs", "search-interface/variable-info-modal-view", "search-interface/search-util",
		"search-interface/numerical-filter-modal-view", "search-interface/categorical-filter-modal-view",
		"search-interface/filter-model", "search-interface/tag-filter-model",
		"search-interface/modal", "search-interface/variable-info-cache", "common/keyboard-nav", "search-interface/search-results-table-view",
		"text!search-interface/no-results-partial.hbs", "search-interface/no-results-help-view",],
function(BB, HBS, searchResultsViewTemplate, searchResultsListTemplate,
		 modalTemplate, dataTableInfoView, searchUtil, numericFilterModalView,
		 categoricalFilterModalView, filterModel, tagFilterModel,
		 modal, variableInfoCache, keyboardNav, tableView, noResultsTemplate, noResultHelpView,) {
	const SPACE = ' ';
	let shouldDisableActions = function(isHarmonized) {
		if (isHarmonized) {
			let nonHarmonizedFitlers = filterModel.get('activeFilters').filter(filter=>{
				return filter.get('type') !== 'genomic' && !filter.get('isHarmonized');
			});
			if (nonHarmonizedFitlers && nonHarmonizedFitlers.length>0) {
				return true;
			}
		} else {
			let harmonizedFitlers = filterModel.get('activeFilters').filter(filter=>{
				return filter.get('type') !== 'genomic' && filter.get('isHarmonized');
			});
			if (harmonizedFitlers && harmonizedFitlers.length>0) {
				return true;
			}
		}
		return false;
	}
	let StudyResultsView = BB.View.extend({
		initialize: function(opts){
			this.modalTemplate = HBS.compile(modalTemplate);
			this.noResultHelpView = new noResultHelpView();
			keyboardNav.addNavigableView("searchResults",this);
			filterModel.on('change reset add remove', this.updateExportIcons.bind(this));
			this.on({
				'keynav-arrowup document': this.previousSearchResult,
				'keynav-arrowdown document': this.nextSearchResult,
				'keynav-arrowright document': this.nextPage,
				'keynav-arrowleft document': this.previousPage
			});
			this.isSearching = false;
		},
		events: {
			"click .search-result": "infoClickHandler",
			"click #search-results-datatable tr": "infoClickHandler",
			"click .fa-filter": "filterClickHandler",
			"click #no-results-help, #no-results-help-empty": "helpViewClickHandler",
			"keypress #no-results-help, #no-results-help-empty": "helpViewClickHandler",
			"click .export-icon": "databaseClickHandler",
			"click .page-link>a":"pageLinkHandler",
			'focus #search-results-datatable': 'resultsDatatableFocus',
			'blur #search-results-datatable': 'resultsBlur',
			'keypress #search-results-datatable': 'resultKeyHandler',
		},
		pageLinkHandler: function(event){
			tagFilterModel.set("currentPage", event.target.innerText);
		},
		updateResponse: function(response) {
			tagFilterModel.set("searchResults",response, {silent:true});
		},
		resultsFocus: function(event){
			this.focusedSection = '#search-results-datatable';
			keyboardNav.setCurrentView("searchResults");
		},
		resultsDatatableFocus: function(event){
			this.focusedSection = '#search-results-datatable';
			keyboardNav.setCurrentView("searchResults");
		},
		resultsBlur: function(){
			this.focusedSection = undefined;
			keyboardNav.setCurrentView(undefined);
			this.$("#search-results-datatable .focused-search-result").removeClass('focused-search-result');
		},
		cacheVariableInfo: function(response, variableId){
			var isRequiredTag = false;
			var isExcludedTag = false;
			var isUnusedTag = false;
			var tagScore;
			let requiredTag = tagFilterModel.get("requiredTags").models.find(function(tag) {return tag.get('tag').toLowerCase() === response.metadata.columnmeta_study_id.toLowerCase()});
			let excludedTag = tagFilterModel.get("excludedTags").models.find(function(tag) {return tag.get('tag').toLowerCase() === response.metadata.columnmeta_study_id.toLowerCase()});
			if ( requiredTag !== undefined){
				isRequiredTag = true;
				tagScore = requiredTag.get('score');
			}
			else if (excludedTag !== undefined){
				isExcludedTag = true;
				tagScore = excludedTag.get('score');
			}
			else{

				let unusedTag = tagFilterModel.get("unusedTags").models.find(function(tag) {return tag.get('tag').toLowerCase() === response.metadata.columnmeta_study_id.toLowerCase()});
				isUnusedTag = (unusedTag) ? true : false ;
				tagScore = (unusedTag) ? unusedTag.get('score') : "" ;
			}
			variableInfoCache[variableId] = {
					studyDescription: response.metadata.study_description.length > 0 ? response.metadata.study_description :
					searchUtil.findStudyNameFromId(response.metadata.columnmeta_study_id.toLowerCase()),
					studyAccession: this.generateStudyAccession(response),
					studyAccessionTagId: this.generateStudyAccessionTagId(response.metadata.columnmeta_study_id.toLowerCase()),
					studyAccessionTagName: searchUtil.findStudyAbbreviationFromId(response.metadata.columnmeta_study_id.toLowerCase()),
					variableId: variableId,
					variableMetadata: response.variables[variableId].metadata,
					isRequiredTag: isRequiredTag,
					isExcludedTag: isExcludedTag,
					isUnusedTag: isUnusedTag,
					tagScore: tagScore,
					isExportField: filterModel.isExportFieldFromId(variableId),
					isHarmonized: searchUtil.isStudyHarmonized(response.metadata.columnmeta_study_id.toLowerCase())
			}
			variableInfoCache[variableId].columnmeta_var_id = variableId;
		},
		retrieveDataTableMeta: function(id, successHandler){
			$.ajax({
				url: window.location.origin + "/picsure/query/sync",
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({resourceUUID: "36363664-6231-6134-2d38-6538652d3131", query: {id: id, entityType: "DATA_TABLE"}}),
				success: successHandler,
				error: function(response){
					console.error("Error retrieving data table metadata: " + id);
					console.log(response);
				}.bind(this)
			});
		},
		infoClickHandler: function(event) {
			if(event.target.classList.contains('search-result-action-btn') ){
				return;
			}
			const rowData = this.searchResultsTable.row(event.target).data();
			$('#search-results-datatable').blur();
			this.retrieveDataTableMeta(rowData.study_id+'_'+rowData.table_id, function(response){
				this.cacheVariableInfo(response, rowData.variable_id);
				this.dataTableInfoView = new dataTableInfoView({
					varId: rowData.variable_id,
					dataTableData: response,
					isOpenAccess: JSON.parse(sessionStorage.getItem('isOpenAccess')),
					shouldDisableActions: shouldDisableActions(searchUtil.isStudyHarmonized(rowData.study_id)),
					el: $(".modal-body")
				});
				this.dataTableInfoView.render();
				modal.displayModal(this.dataTableInfoView, "Variable Information for " + response.variables[rowData.variable_id].metadata.columnmeta_name,  ()=>{
					$('#search-results-datatable').focus();
				});
			}.bind(this));
		},
		resultKeyHandler: function(event){
			if (event.key.toLowerCase()==='s') {
				if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
					event.preventDefault();
					this.isSearching = !this.isSearching;
					this.render();
				}
			}
			event.target = $('.focused-search-result')[0];
			if(event.key.toLowerCase()==='f'){
				this.filterClickHandler(event);
			}
			if(event.key.toLowerCase()==='e'){
				this.databaseClickHandler(event);
			}
			if(event.key.toLowerCase()==='i' || event.key.toLowerCase()==='enter' || event.key.toLowerCase()===SPACE){
				event.preventDefault();
				this.infoClickHandler(event);
			}
		},
		filterClickHandler: function(event) {
			if (event.target.classList.contains('disabled-icon')) {
				return;
			}
			let varId = $(event.target).data('variable-id');

			if (!varId && !event.target.classList.contains('search-result-action-btn')) {
				const exportIcon = $(event.target).find('.fa-filter.search-result-action-btn');
				if (exportIcon.classList.contains('disabled-icon')) return;
				varId = exportIcon.data('variable-id')
			}

			let searchResult = _.find(tagFilterModel.get("searchResults").results.searchResults, (result) => {
				return varId === result.result.varId;
			});

			let filter = filterModel.getByVarId(varId);

			let filterViewData = {
				isOpenAccess: JSON.parse(sessionStorage.getItem('isOpenAccess')),
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
			this.retrieveDataTableMeta(searchResult.result.studyId + "_" + searchResult.result.dtId, function(response){
				this.cacheVariableInfo(response, searchResult.result.varId);
				modal.displayModal(this.filterModalView, "Variable Information for " + response.variables[searchResult.result.varId].metadata.columnmeta_name, ()=>{
					$('#search-results-datatable').focus();
				});
			}.bind(this));
		},
		databaseClickHandler: function(event) {
			if (event.target.classList.contains('disabled-icon')) {
				return;
			}
			let resultIndex = $(event.target).data("result-index");
			if (!resultIndex && 
				!(event.target.classList.contains('.export-icon.search-result-action-btn') ||
			      event.target.classList.contains('.glyphicon-log-out.search-result-action-btn') )) {
					let target = $(event.target).find('.export-icon.search-result-action-btn');
					target = target ? target : $(event.target).find('.glyphicon-log-out.search-result-action-btn');
					if (!target || target.get(0).classList.contains('disabled-icon')) return
					resultIndex = target.data("result-index");
			}
			let searchResult = tagFilterModel.get("searchResults").results.searchResults[resultIndex];
			filterModel.toggleExportField(searchResult);
		},
		generateStudyAccession: function(response) {
			let studyAccession = response.metadata.columnmeta_study_id;
			if (response.metadata.participant_set) {
				studyAccession += '.p' + response.metadata.participant_set
			}
			return studyAccession;
		},
		generateStudyAccessionTagId: function(studyId) {
			return studyId.split('.')[0].toLowerCase();
		},
		nextPage: function(){
		    $('#search-results-datatable').DataTable().page( 'next' ).draw( 'page' );
			$('#aria-live').html("Now on page " + ($('#search-results-datatable').DataTable().page() + 1) + " of the results region.");
		},
		previousPage: function(){
			$('#search-results-datatable').DataTable().page( 'previous' ).draw( 'page' );
			$('#aria-live').html("Now on page " + ($('#search-results-datatable').DataTable().page() + 1) + " of the results region.");
		},
		previousSearchResult: function(event){
			let results = this.$("#search-results-datatable tbody tr");
			const focused = this.$el.find(".focused-search-result");
			if (focused.length === 0) {
				$(results[results.length-1]).addClass("focused-search-result");
			} else {
				this.adjustFocusedVariable(1, results);
			}
		},
		nextSearchResult: function(event){
			const results = this.$("#search-results-datatable tbody tr");
			const focused = this.$el.find(".focused-search-result");
			if (focused.length === 0) {
				$(results[0]).addClass("focused-search-result");
			} else {
				this.adjustFocusedVariable(-1, results);
			}
		},
		adjustFocusedVariable: function(adjustment, results){
			let focusedVariable = adjustment;
			for(var x = 0;x < results.length;x++){
				if($(results[x]).hasClass('focused-search-result')){
					focusedVariable = x;
					$(results[x]).removeClass('focused-search-result')
				}
			}
			focusedVariable = focusedVariable - adjustment;
			if(focusedVariable===-1){
				focusedVariable = results.length-1;
			}
			if(focusedVariable===results.length){
				focusedVariable=0;
			}
			$(results[focusedVariable]).addClass('focused-search-result');
            $("#search-results-datatable").attr("aria-activedescendant", results[focusedVariable].id);

			searchUtil.ensureElementIsInView(results[focusedVariable]);
		},
		helpViewClickHandler: function(event) {
			if (event.type === "keypress" && !(event.key === SPACE || event.key === 'Enter')) {
				return;
			}
			modal.displayModal(
                new noResultHelpView,
                'Why might I see unexpected search results?',
                () => {
                    $('#no-results-help').focus();
                }
            );
		},
		updateExportIcons() {
			let results = this.$("#search-results-datatable tbody tr");
			_.each(results, (result) => {
				if (filterModel.isExportFieldFromId(result.dataset.varId) || filterModel.isExportColFromId(result.dataset.varId)) {
					let test = $(result).find('.export-icon');
					test.removeClass('glyphicon glyphicon-log-out');
					test.addClass('fa-regular fa-square-check');
				} else {
					let resultIcon = $(result).find('.export-icon');
					if (resultIcon.hasClass('fa-square-check')) {
						resultIcon.removeClass('fa-regular fa-square-check');
						resultIcon.addClass('glyphicon glyphicon-log-out');
					}
				}
			});
		},
		render: function(){
			if($('#search-results-div')[0]===undefined){
				this.$el.html(HBS.compile(searchResultsViewTemplate));
			}

			if (tagFilterModel.get("searchResults")) {
				let filteredResults = tagFilterModel.get("searchResults").results.searchResults;
				filteredResults = _.filter(filteredResults, function(result) {
					let metadata = result.result.metadata;
					return (!(metadata.columnmeta_var_id.includes('_Parent Study Accession with Subject ID')) && !(metadata.columnmeta_var_id.includes('_Topmed Study Accession with Subject ID')))
				})
				if (JSON.parse(sessionStorage.getItem('isOpenAccess'))) {
					filteredResults = _.filter(filteredResults, function(result) {
						return result.result.metadata.columnmeta_is_stigmatized === "false";
					})
				}
				if (filteredResults.length === 0) {
					if ($('#no-results').length === 0) {
						$('#guide-me-button').show();
						$("#search-area").append(HBS.compile(noResultsTemplate));
						//Dynamically Adding click event after appending the element that gets clicked
						$('#no-results-help-empty').on({
							'click': this.helpViewClickHandler,
							'keypress': this.helpViewClickHandler
						});
					} else {
						$('#guide-me-button').show();
						//Ensures Element has click event
						$('#no-results-help-empty').on({
							'click': this.helpViewClickHandler,
							'keypress': this.helpViewClickHandler
						});
					}
				} else {
					$('#guide-me-button').hide();
					$('#no-results').remove();
				}
				let results = _.map(filteredResults, function(result, i){
					let metadata = result.result.metadata;
						return {
							abbreviation: searchUtil.findStudyAbbreviationFromId(metadata.columnmeta_study_id),
							study_id: metadata.columnmeta_study_id,
							table_id: metadata.columnmeta_var_group_id,
							variable_id: metadata.columnmeta_var_id,
							name: metadata.columnmeta_name,
							dataTableDescription: metadata.columnmeta_var_group_description,
							description: metadata.columnmeta_description,
							hashed_var_id: metadata.hashed_var_id,
							is_harmonized: searchUtil.isStudyHarmonized(metadata.columnmeta_study_id.toLowerCase()),
							result_index: i
						}

				});
				let pageSize = tagFilterModel.get("limit");
				let pages = [];
				for(var offset = 0;offset <tagFilterModel.get("searchResults").results.numResults; offset += pageSize){
					var pageNumber = parseInt(offset/pageSize) + 1;
					pages.push({
						pageNumber : parseInt(offset/pageSize) + 1,
						isActive : tagFilterModel.get("currentPage") == pageNumber
					});
				}
				let searchResultData = {
					"isAuthorized": !JSON.parse(sessionStorage.getItem('isOpenAccess')),
					"results": results,
					"variableCount": tagFilterModel.get("searchResults").results.numResults,
					"pages": pages
				}

				let searchResultsView = new tableView(searchResultData);
				searchResultsView.render();
				$('#search-results-div').html(searchResultsView.$el);
				this.searchResultsTable = $('#search-results-datatable').DataTable({
                    data: results,
					"searching": this.isSearching,
					"ordering": false,
					"bAutoWidth": false,
					"tabIndex": -1,
                    columns: [
                        {title:'Study', data:'abbreviation'},
                        {title:'Variable Name', data:'name'},
                        {title:'Variable Description',data:'description'},
						{title:'Actions'},
                    ],
					createdRow: function(row, data, dataIndex) {
						$(row).attr('data-hashed-var-id', data.hashed_var_id).attr('data-var-id', data.variable_id);
					},
					columnDefs: [
						{
							targets: [0, 1, 2, 3],
							className: 'dt-center',
							type: 'string'
						},
						{
							render: function (data, type, row, meta) {
								let shouldDisable = shouldDisableActions(row.is_harmonized);
								let disabledClass = shouldDisable ? "disabled-icon" : "";
								let filterTitleText = shouldDisable ? "Variable conflicts with current filter parameters." : "Click to configure a filter using this variable.";
								let exportTitleText = shouldDisable ? "Variable conflicts with current filter parameters." : "Click to add this variable to your data retrieval.";
								if (!JSON.parse(sessionStorage.getItem('isOpenAccess'))) {
									let exportClass = 'glyphicon glyphicon-log-out';
									if(filterModel.isExportFieldFromId(row.variable_id)){
										exportClass = 'fa-regular fa-square-check';
									}
									return '<span class="search-result-icons col center"><i data-data-table-id="'+row.table_id+'" data-variable-id="'+row.variable_id+'" data-result-index="'+row.result_index+'" title="'+filterTitleText+'" class="fa fa-filter search-result-action-btn '+disabledClass+'"></i><i data-data-table-id="'+row.table_id+'" data-variable-id="'+row.variable_id+'" data-result-index="'+row.result_index+'" title="'+exportTitleText+'" class="'+ exportClass + ' export-icon search-result-action-btn '+disabledClass+'"></i></span>';
								}
								return '<span class="search-result-icons col center"><i data-data-table-id="'+row.table_id+'" data-variable-id="'+row.variable_id+'" data-result-index="'+row.result_index+'" title="Click to configure a filter using this variable." class="fa fa-filter search-result-action-btn '+disabledClass+'"></i></span>';
							},
							type: 'string',
							targets: 3
						}
					],
                });
				$('#search-results-div').attr('aria-label',
					"You are in the results region on page " +
					tagFilterModel.get("currentPage") + " out of " + pages.length +
					" pages of search results with up to 10 results per page. There are " +
					tagFilterModel.get("searchResults").results.numResults + " total search results." +
					" Use the up and down arrows to move between search results." +
					" Use the left and right arrows to move between pages of search results. You are currently on page ");
			}
			this.updateExportIcons();
		}
	});
	return StudyResultsView;
});
