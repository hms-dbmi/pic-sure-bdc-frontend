define(["backbone", "handlebars", "text!search-interface/search-results-view.hbs", "text!options/modal.hbs",
		"search-interface/data-table-info-view", "search-interface/search-util", "search-interface/filter-modal-view",
		"search-interface/categorical-filter-modal-view"],
function(BB, HBS, searchResultsViewTemplate, modalTemplate,
		 dataTableInfoView, searchUtil, filterModalView,
		 categoricalFilterModalView){

	let StudyResultsView = BB.View.extend({
		initialize: function(opts){
			this.response = opts.tagSearchResponse;
			this.modalTemplate = HBS.compile(modalTemplate);
		},
		events: {
			"click .fa-info-circle": "infoClickHandler",
			"click .fa-filter": "filterClickHandler"
		},
		updateResponse: function(response) {
			this.response = response;
		},
		infoClickHandler: function(event) {
			let dataTableId = $(event.target).data('data-table-id');
			let variableId = $(event.target).data('variable-id');
			$.ajax({
				url: window.location.origin + "/jaxrs-service/rest/pic-sure/query/sync",
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({query: {id: dataTableId, entityType: "DATA_TABLE"}}),
				success: function(response){
					if ($("#modal-window").length === 0) {
						$('#main-content').append('<div id="modal-window"></div>');
					}
					$("#modal-window").html(this.modalTemplate({title: ""}));
					$("#modalDialog").show();
					$(".modal-header").html('<i class="fa fa-times close-variable-info"></i>' +
						'<i class="fa fa-database"></i>' +
						'<i class="fa fa-filter"></i>'
					);
					$('.close-variable-info').click(function() {$("#modalDialog").hide();});

					this.dataTableInfoView = new dataTableInfoView({
						data: {
							studyDescription: response.metadata.study_description,
							studyAccession: this.generateStudyAccession(response),
							studyAccessionTagId: this.generateStudyAccessionTagId(response.metadata.study_id),
							studyAccessionTagName: searchUtil.findStudyAbbreviationFromId(response.metadata.study_id),
							variableId: variableId,
							variableMetadata: response.variables[variableId].metadata
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
			let dataTableId = $(event.target).data('data-table-id');
			let variableId = $(event.target).data('variable-id');
			let resultIndex = $(event.target).data('result-index');
			$.ajax({
				url: window.location.origin + "/jaxrs-service/rest/pic-sure/query/sync",
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({query: {id: dataTableId, entityType: "DATA_TABLE"}}),
				success: function(response){
					let variableDescription = response.variables[variableId].metadata.description;
					if ($("#modal-window").length === 0) {
						$('#main-content').append('<div id="modal-window"></div>');
					}
					$("#modal-window").html(this.modalTemplate({title: ""}));
					$("#modalDialog").show();
					// todo: more info
					$(".modal-header").append('<h3>' + variableDescription + '</h3>');
					$('.close').click(function() {$("#modalDialog").hide();});

					let variableValues = this.response.results.searchResults[resultIndex].result.values;

					let filterViewData = {
						studyDescription: response.metadata.study_description,
							studyAccession: this.generateStudyAccession(response),
							studyAccessionTagId: this.generateStudyAccessionTagId(response.metadata.study_id),
							studyAccessionTagName: searchUtil.findStudyAbbreviationFromId(response.metadata.study_id),
							variableId: variableId,
							variableMetadata: response.variables[variableId].metadata,
							variableValues: variableValues
					}

					if (!_.isEmpty(variableValues)) {
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
			let results = _.map(this.response.results.searchResults, function(result, i){
				let metadata = result.result.metadata;
				return {
					abbreviation: searchUtil.findStudyAbbreviationFromId(metadata.study_id),
					study_id: metadata.study_id,
					table_id: metadata.dataTableId,
					variable_id: metadata.varId,
					name: metadata.name,
					dataTableDescription: metadata.dataTableDescription
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
	});
	return StudyResultsView;
});