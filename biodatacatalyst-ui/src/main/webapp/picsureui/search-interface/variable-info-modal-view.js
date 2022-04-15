define(["jquery","backbone","handlebars", "text!search-interface/variable-info-modal-template.hbs",
		"search-interface/tag-filter-model", "text!options/modal.hbs", "search-interface/variable-info-cache",
		"search-interface/filter-model","search-interface/categorical-filter-modal-view",
		"search-interface/numerical-filter-modal-view", "search-interface/datatable-filter-modal-view","search-interface/datatable-export-modal-view",
		"search-interface/modal"],
	function($, BB, HBS, dataTableInfoTemplate,
			 tagFilterModel, modalTemplate, variableInfoCache,
			 filterModel, categoricalFilterModalView,
			 numericalFilterModalView, datatableFilterModalView, datatableExportModalView,
			 modal){

		var View = BB.View.extend({
			initialize: function(opts){
				this.dataTableInfoTemplate = HBS.compile(dataTableInfoTemplate);
				this.modalTemplate = HBS.compile(modalTemplate);
				this.varId = opts.varId;
				this.dataTableData = opts.dataTableData;
			},
			events: {
				'mouseover .badge': 'showTagControls',
				'mouseout .badge': 'hideTagControls',
				'click .require-tag-btn': 'requireTag',
				'click .exclude-tag-btn': 'excludeTag',
				'click .remove-required-tag-btn': 'removeRequiredTag',
				'click .remove-excluded-tag-btn': 'removeExcludedTag',
				'click .badge': 'clickTag',
				'click #show-all-tags-btn': 'showAllTags',
				'click #show-fewer-tags-btn': 'showFewerTags',
				'click .fa-filter': 'filterClickHandler',
				'click .export-icon': 'databaseClickHandler',
				'keypress .fa-filter': 'filterKeypressHandler',
				'keypress .export-icon': 'databaseKeypressHandler'
			},
			showTagControls: function(event){
				$('.hover-control', event.target).css('visibility','visible').hover(function() {
					$(this).css("visibility", "visible");
					$(this).css("cursor", "pointer");
				})
			},
			hideTagControls: function(event){
				$('.hover-control', event.target).css('visibility','hidden');
			},
			clickTag: function(event){
				if(event.target && event.target.classList.contains('hover-control')){
					tagFilterModel[event.target.dataset['action']](event.target.dataset['tag']);
				}
			},
			filterClickHandler: function(event) {
				let variableId = _.find($('.modal .fa-filter'),
					(filterButton)=>{return filterButton.dataset.target==='variable';}).dataset.id;

				let searchResult = _.find(tagFilterModel.attributes.searchResults.results.searchResults,
					function(variable){return variable.result.varId===variableId;});

				if(event.target.dataset.target==='variable'){
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
						this.filterModalView = new numericalFilterModalView({
							data: filterViewData,
							el: $(".modal-body")
						});
					}
					this.filterModalView.render();
					modal.displayModal(this.filterModalView, "Variable-level Filter for " + searchResult.result.metadata.columnmeta_name);
				}
				else if(event.target.dataset.target==='datatable'){
					let filter = filterModel.getByDatatableId(event.target.dataset.id);

					$.ajax({
						url: window.location.origin + "/picsure/search/36363664-6231-6134-2D38-6538652D3131",
						type: 'POST',
						contentType: 'application/json',
						data: JSON.stringify({query: {
								searchTerm: "",
								includedTags: [event.target.dataset.id],
								excludedTags: [],
								returnTags: false,
								offset: 0,
								limit: 100000
						}}),
						success: function(response){
							let dataTableInfo = {
								studyId: this.dataTableData.metadata.columnmeta_study_id,
								dataTableName: this.dataTableData.metadata.study_description
							};
							let filterViewData = {
								dtId: event.target.dataset.id,
								filter: filter ? filter.toJSON() : undefined,
								dtVariables: response.results.searchResults,
								dataTableInfo: dataTableInfo
							};
							this.filterModalView = new datatableFilterModalView({
								model: filterViewData,
								el: $(".modal-body"),
							});
							this.filterModalView.render();
							modal.displayModal(this.filterModalView, "Dataset : " + dataTableInfo.dataTableName);
						}.bind(this),
						error: function(response){
							console.log(response);
						}.bind(this)
					});
				}
			},
			filterKeypressHandler: function(event){
				if(event.key.toLowerCase()==='enter' || event.key.toLowerCase()===' '){
					this.filterClickHandler(event);
				}
			},
			databaseClickHandler: function(event) {
				this.toggleExportClasses(event.target);
				let variableId = _.find($('.modal .export-icon'), (filterButton) => {
					return filterButton.dataset.target === "variable";
				}).dataset.id;

				let searchResult = _.find(tagFilterModel.attributes.searchResults.results.searchResults,
					function(variable){return variable.result.varId===variableId;});

				if (event.target.dataset.target === "datatable") {
					let filter = filterModel.getByDatatableId(event.target.dataset.id);

					$.ajax({
						url: window.location.origin + "/picsure/search/36363664-6231-6134-2D38-6538652D3131",
						type: 'POST',
						contentType: 'application/json',
						data: JSON.stringify({query: {
								searchTerm: "",
								includedTags: [event.target.dataset.id],
								excludedTags: [],
								returnTags: false,
								offset: 0,
								limit: 100000
						}}),
						success: function(response){
							let dataTableInfo = {
								studyId: this.dataTableData.metadata.columnmeta_study_id,
								dataTableName: this.dataTableData.metadata.study_description
							};
							let exportViewData = {
								dtId: event.target.dataset.id,
								variable: filter ? filter.toJSON() : undefined,
								dtVariables: response.results.searchResults,
								dataTableInfo: dataTableInfo
							};
							this.exportModalView = new datatableExportModalView({
								model: exportViewData,
								el: $(".modal-body"),
							});
							this.exportModalView.render();
							modal.displayModal(this.exportModalView, "Dataset : " + dataTableInfo.dataTableName);
						}.bind(this),
						error: function(response){
							console.log(response);
						}.bind(this)
					});


				}
				else if (event.target.dataset.target === "variable") {
						this.filterModalView = new numericalfilterModalView({
							data: filterViewData,
							el: $(".modal-body"),
						});

					this.filterModalView.render();
					modal.displayModal(
						this.filterModalView,
						searchResult.result.metadata.description
					);
				}

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
			databaseKeypressHandler: function(event){
				if(event.key.toLowerCase()==='enter' || event.key.toLowerCase()===' '){
					this.filterClickHandler(event);
				}
			},
			render: function(){
				this.$el.html(this.dataTableInfoTemplate(variableInfoCache[this.varId]));
			}
		});

		return View;
	});
