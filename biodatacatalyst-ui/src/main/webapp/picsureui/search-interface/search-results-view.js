define(["backbone", "handlebars", "text!search-interface/search-results-view.hbs", "text!search-interface/search-results-list.hbs",
		"text!options/modal.hbs", "search-interface/variable-info-modal-view", "search-interface/search-util",
		"search-interface/numerical-filter-modal-view", "search-interface/categorical-filter-modal-view",
		"search-interface/filter-model", "search-interface/tag-filter-model",
		"search-interface/modal", "search-interface/variable-info-cache", "common/keyboard-nav", "search-interface/search-results-table-view",],
function(BB, HBS, searchResultsViewTemplate, searchResultsListTemplate,
		 modalTemplate, dataTableInfoView, searchUtil, numericFilterModalView,
		 categoricalFilterModalView, filterModel, tagFilterModel,
		 modal, variableInfoCache, keyboardNav, tableView){

	let StudyResultsView = BB.View.extend({
		initialize: function(opts){
			this.modalTemplate = HBS.compile(modalTemplate);
			this.isAuthorized = !opts.isOpenAccess;
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
			"click #search-results-datatable tr": "infoClickHandler",
			"click .fa-filter": "filterClickHandler",
			"click .export-icon": "databaseClickHandler",
			"click .page-link>a":"pageLinkHandler",
			'focus #search-results-datatable': 'resultsDatatableFocus',
			'blur #search-results-datatable': 'resultsBlur',
			'keypress #search-results-div': 'resultKeyHandler'
		},
		pageLinkHandler: function(event){
			tagFilterModel.set("currentPage", event.target.innerText);
		},
		updateResponse: function(response) {
			tagFilterModel.set("searchResults",response, {silent:true});
		},
		resultsFocus: function(event){
			this.focusedSection = '#search-results-div';
			keyboardNav.setCurrentView("searchResults");
		},
		resultsDatatableFocus: function(event){
			this.focusedSection = '#search-results-datatable';
			keyboardNav.setCurrentView("searchResults");
		},
		resultsBlur: function(){
			this.focusedSection = undefined;
			keyboardNav.setCurrentView(undefined);
			this.$("#search-results-datatable  .search-result.focused-search-result").removeClass('focused-search-result');
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
				isUnusedTag = true;
				tagScore = tagFilterModel.get("unusedTags").models.find(function(tag) {return tag.get('tag').toLowerCase() === response.metadata.columnmeta_study_id.toLowerCase()}).get('score');
			}
			variableInfoCache[variableId] = {
					studyDescription: response.metadata.study_description,
					studyAccession: this.generateStudyAccession(response),
					studyAccessionTagId: this.generateStudyAccessionTagId(response.metadata.columnmeta_study_id),
					studyAccessionTagName: searchUtil.findStudyAbbreviationFromId(response.metadata.columnmeta_study_id),
					variableId: variableId,
					variableMetadata: response.variables[variableId].metadata,
					isRequiredTag: isRequiredTag,
					isExcludedTag: isExcludedTag,
					isUnusedTag: isUnusedTag,
					tagScore: tagScore,
					isExportField: filterModel.isExportFieldFromId(variableId)
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
			$('#search-results-div').blur();
			this.retrieveDataTableMeta(rowData.study_id+'_'+rowData.table_id, function(response){
				this.cacheVariableInfo(response, rowData.variable_id);
				this.dataTableInfoView = new dataTableInfoView({
					varId: rowData.variable_id,
					dataTableData: response,
					isOpenAccess: !this.isAuthorized,
					el: $(".modal-body")
				});
				this.dataTableInfoView.render();
				modal.displayModal(this.dataTableInfoView, "Variable Information for " + response.variables[rowData.variable_id].metadata.columnmeta_name,  ()=>{
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
				isOpenAccess: !this.isAuthorized,
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
					$('#search-results-div').focus();
				});
			}.bind(this));
		},
		databaseClickHandler: function(event) {
			let resultIndex = $(event.target).data("result-index");
			this.toggleExportClasses(event.target);
			let searchResult = tagFilterModel.get("searchResults").results.searchResults[resultIndex];
			filterModel.toggleExportField(searchResult);
		},
		toggleExportClasses: function(target) {
			if (target.classList.contains('glyphicon-log-out')) {
				target.classList.remove('glyphicon', 'glyphicon-log-out');
				target.classList.add('fa', 'fa-check-square-o');
			} else {
				target.classList.remove('fa', 'fa-check-square-o');
				target.classList.add('glyphicon', 'glyphicon-log-out');
			}
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
		render: function(){
			if($('#search-results-div')[0]===undefined){
				this.$el.html(HBS.compile(searchResultsViewTemplate));
			}

			if (tagFilterModel.get("searchResults")) {
				let filteredResults = tagFilterModel.get("searchResults").results.searchResults;
				if (!this.isAuthorized) {
					filteredResults = _.filter(filteredResults, function(result) {
						return result.result.metadata.columnmeta_is_stigmatized === "false";
					})
				}
				if (filteredResults.length === 0) {
					$('#no-results').length === 0 && $("#search-area").append('<div id="no-results" style="margin-right: 20px;" aria-label="0 results match your search">0 results match your search</div>');
				} else {
					$('#no-results').remove();
				}
				let results = _.map(filteredResults, function(result, i){
					let metadata = result.result.metadata;
					return {
						abbreviation: searchUtil.findStudyAbbreviationFromId(metadata.columnmeta_study_id),
						study_id: metadata.columnmeta_study_id,
						table_id: metadata.columnmeta_var_group_id,
						variable_id: result.result.varId,
						name: metadata.columnmeta_name,
						dataTableDescription: metadata.columnmeta_var_group_description,
						description: metadata.columnmeta_description,
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
					"isAuthorized": this.isAuthorized,
					"results": results,
					"variableCount": tagFilterModel.get("searchResults").results.numResults,
					"pages": pages
				}

				let searchResultsView = new tableView(searchResultData);
				searchResultsView.render();
				$('#search-results-div').html(searchResultsView.$el);
				const isAuthorized = this.isAuthorized;
				this.searchResultsTable = $('#search-results-datatable').DataTable({
                    data: results,
					"searching": false,
					"sorting": false,
					"bAutoWidth": false,
					"tabIndex": -1,
                    columns: [
                        {title:'Study', data:'abbreviation'},
						{title:'Dataset ID', data:'table_id'},
                        {title:'Variable ID', data:'variable_id'},
                        {title:'Variable Name', data:'name'},
                        {title:'Variable Description',data:'description'},
						{title:'Actions'},
                    ],
					columnDefs: [
						{
							targets: [0, 1, 2, 3, 4, 5],
							className: 'dt-center',
							type: 'string'
						},
						{
							render: function (data, type, row, meta) {
								if (isAuthorized) {
									return '<span class="search-result-icons col center"><i data-data-table-id="'+row.table_id+'" data-variable-id="'+row.variable_id+'" data-result-index="'+row.result_index+'" title="Click to configure a filter using this variable." class="fa fa-filter search-result-action-btn"></i><i data-data-table-id="'+row.table_id+'" data-variable-id="'+row.variable_id+'" data-result-index="'+row.result_index+'" title="Click to add this variable to your data retrieval." class="glyphicon glyphicon-log-out export-icon search-result-action-btn"></i></span>';
								}
								return '<span class="search-result-icons col center"><i data-data-table-id="'+row.table_id+'" data-variable-id="'+row.variable_id+'" data-result-index="'+row.result_index+'" title="Click to configure a filter using this variable." class="fa fa-filter search-result-action-btn"></i></span>';
							},
							type: 'string',
							targets: 5
						}
					],
                });
				// abbreviation: "CARDIA"
				// dataTableDescription: "Subject Identifier"
				// description: "REASON(S) FOR HOSPITALIZATION"
				// name: "YTRCARR"
				// result_index: 0
				// study_id: "phs000285"
				// table_id: "pht001867"
				// variable_id: "phv00121188"
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
