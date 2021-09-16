define(["backbone", "handlebars", "text!search-interface/search-results-view.hbs", "text!options/modal.hbs",
		"search-interface/data-table-info-view", "search-interface/search-util", "search-interface/filter-modal-view",
		"search-interface/categorical-filter-modal-view", "search-interface/filter-model", "search-interface/modal"],
function(BB, HBS, searchResultsViewTemplate, modalTemplate,
		 dataTableInfoView, searchUtil, filterModalView,
		 categoricalFilterModalView, filterModel, modal){

	let StudyResultsView = BB.View.extend({
		initialize: function(opts){
			this.modalTemplate = HBS.compile(modalTemplate);
		},
		events: {
			"click .search-result": "infoClickHandler",
			"click .fa-filter": "filterClickHandler"
		},
		updateResponse: function(response) {
			this.response = response;
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
					if ($("#modal-window").length === 0) {
						$('#main-content').append('<div tabindex="-1" id="modal-window"></div>');
					}
					$("#modal-window").html(this.modalTemplate({title: _.find(this.response.results.searchResults, function(result){return result.result.varId===variableId;}.bind(this)).result.metadata.HPDS_PATH}));
					$("#modalDialog").modal({keyboard:true});
					
					this.dataTableInfoView = new dataTableInfoView({
						data: {
							studyDescription: response.metadata.study_description,
							studyAccession: this.generateStudyAccession(response),
							studyAccessionTagId: this.generateStudyAccessionTagId(response.metadata.study_id),
							studyAccessionTagName: searchUtil.findStudyAbbreviationFromId(response.metadata.study_id),
							variableId: variableId,
							variableMetadata: response.variables[variableId].metadata,
							searchResult: this.response
						},
						el: $(".modal-body")
					});
					this.dataTableInfoView.render();
				}.bind(this),
				error: function(response){
					console.log(response);
				}.bind(this)
			});
		},
		filterClickHandler: function(event) {
			let resultIndex = $(event.target).data('result-index');

			let searchResult = this.response.results.searchResults[resultIndex];

			if ($("#modal-window").length === 0) {
				$('#main-content').append('<div id="modal-window"></div>');
			}
			$("#modal-window").html(this.modalTemplate({title: ""}));
			$("#modalDialog").modal({keyboard:true});
			// todo: more info
			$(".modal-header").append('<h3>' + searchResult.result.metadata.description + '</h3>');
			$('.close').click(function() {$("#modalDialog").hide();});

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
			this.filterModalView.render();
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
			if (this.response) {
				let results = _.map(this.response.results.searchResults, function(result, i){
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
				this.$el.html(HBS.compile(searchResultsViewTemplate)(
					{
						"results": results,
						"variableCount": this.response.results.numResults
					}
				));
			}
		}
	});
	return StudyResultsView;
});