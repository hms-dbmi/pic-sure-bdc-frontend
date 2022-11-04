define(["jquery",
		'backbone', 
		'handlebars',
		'text!search-interface/package-view.hbs',
		'datatables.net', 
		"common/keyboard-nav",
		"search-interface/filter-model", 
		"search-interface/search-util", 
		"picSure/queryBuilder", 
		"search-interface/query-results-view", 
		"overrides/outputPanel",
		"picSure/settings",
		"search-interface/variable-values-view",
		"search-interface/modal",
		"common/pic-sure-dialog-view"],
function($, BB, HBS, packageModalTemplate, datatables, keyboardNav,
	filterModel, searchUtil, queryBuilder, queryResultsView, output, settings,
	variableValuesView, modal, dialog){
	var packageView = BB.View.extend({
		initialize: function(){
			keyboardNav.addNavigableView("datatablePackageModal",this);
			this.on({
				'keynav-arrowup document': this.previousVariable,
				'keynav-arrowdown document': this.nextVariable,
				'keynav-arrowright document': this.nextPage,
				'keynav-arrowleft document': this.previousPage
			});
			this.tempExportFields = filterModel.get("exportColumns").models;
		},
		events: {
			'click input[type="checkbox"]':"checkboxToggled",
			'focus #exportData': 'exportDataFocus',
			'blur #exportData': 'exportDataBlur',
			'click button[id="varValuesButton"]':"openVariableValues"
		},
		data: function(){
			return $('#exportData').DataTable().rows( {order:'index', search:'applied'} ).data();
		},
		nextPage: function(){
			$('#exportData').DataTable().page( 'next' ).draw( 'page' );
			$('#aria-live').html("Now on page " + ($('#exportData').DataTable().page() + 1) + " of the results region.");
		},
		previousPage: function(){
			$('#exportData').DataTable().page( 'previous' ).draw( 'page' );
			$('#aria-live').html("Now on page " + ($('#exportData').DataTable().page() + 1) + " of the results region.");
		},
		previousVariable: function(event){
			let variables = this.$("#exportData tr");
			let focusedVariable = this.adjustFocusedVariable(1, variables);
		},
		nextVariable: function(event){
			let variables = this.$("#exportData tr");
			let focusedVariable = this.adjustFocusedVariable(-1, variables);
		},
		adjustFocusedVariable: function(adjustment, variables){
			let focusedVariable = adjustment;
			for(var x = 1;x < variables.length;x++){
				if($(variables[x]).hasClass('focused-variable')){
					focusedVariable = x;
					$(variables[x]).removeClass('focused-variable')
				}
			}
			focusedVariable = focusedVariable - adjustment;
			if(focusedVariable===0){
				focusedVariable = variables.length-1;
			}
			if(focusedVariable===variables.length){
				focusedVariable=1;
			}
			$(variables[focusedVariable]).addClass('focused-variable');
			$("#exportData").attr("aria-activedescendant", variables[focusedVariable].id);

			searchUtil.ensureElementIsInView(variables[focusedVariable]);
		},
		exportDataFocus: function(event){
			keyboardNav.setCurrentView("datatablePackageModal");
		},
		exportDataBlur: function(){
			keyboardNav.setCurrentView(undefined);
			this.$("#exportData.focused-variable").removeClass('focused-variable');
		},

		checkboxToggled: function(event){
			let target = _.find(this.data(),(variable)=>{
				return event.target.dataset['varid'] === variable[1];
			});
			let valueToSet = !target[0];
			_.each(this.data(),
			(row)=>{
				if(row[1]===target[1]){
					row[0]=valueToSet;
				}
			});
			target[0] = valueToSet;
			if(valueToSet){
				let varToAdd = this.model.get("deletedExports").find((filter) => {
					return filter.attributes.variable.metadata.columnmeta_var_id === target[1];
				});
				filterModel.get('exportColumns').add(varToAdd);
				filterModel.get('exportFields').add(varToAdd.attributes.variable);
				this.model.get("deletedExports").remove(varToAdd);
			}
			else{
				let varToRemove = filterModel.get("exportColumns").find((filter) => {
					return filter.attributes.variable.metadata.columnmeta_var_id === target[1] && target[7] === filter.attributes.type;
				});
				filterModel.get('exportColumns').remove(varToRemove);
				filterModel.get('exportFields').remove(
					filterModel.get('exportFields').find((field)=>{
						return varToRemove.attributes.variable.metadata.columnmeta_var_id === field.attributes.metadata.columnmeta_var_id;
					})
				);
				this.model.get("deletedExports").add(varToRemove);
			}
			filterModel.updateExportValues();
			if(filterModel.get('estDataPoints') > 1000000){
				this.model.set('exportStatus', 'Overload');
			}
			else{
				this.model.set('exportStatus', 'Ready');
			}
			this.updateHeader();
		},
		updateHeader: function(){
			let exportStatus = this.model.get('exportStatus');
			let fontColor = '#333';
			let statusMessage = '';
			var viewObj = this;
			if(exportStatus === 'Ready'){
				statusMessage = 'Status:  Ready to package. \nClick "Package Data" to proceed.';
				$('#package-package-button').attr('disabled', false);
				$('#package-package-button', this.$el).click(function(){
					viewObj.initiatePackage();
				}.bind(viewObj));
				$('#package-package-button').css('background-color', '#337ab7');
				$('.package-query-container').hide();
				$('#package-download-button').hide();
			}
			else if (exportStatus === 'Overload') {
				fontColor = 'Red';
				statusMessage = 'Status: NUMBER OF DATA POINTS EXCEEDED\nRemove data selections';
				$('#package-package-button').attr('disabled', true);
				$('#package-package-button', this.$el).off('click');
				$('#package-package-button').css('background-color', 'lightgrey');
				$('.package-query-container').hide();
				$('#package-download-button').hide();
			}
			else if (exportStatus === 'Progress') {
				statusMessage = 'Status: In Progress';
				$('#package-package-button').attr('disabled', true);
				$('#package-package-button', this.$el).off('click');
				$('#package-package-button').css('background-color', 'lightgrey');
				$('.package-query-container').hide();
				$('#package-download-button').hide();
			}
			else if (exportStatus === 'Done') {
				statusMessage = 'Status: Available';
				$('#package-package-button').attr('disabled', false);
				$('#package-package-button', this.$el).click(function(){
					viewObj.initiatePackage();
				}.bind(viewObj));
				$('#package-package-button').css('background-color', '#337ab7');
				$('.package-query-container').show();
				$('#package-query-id').html(this.model.get('queryId'));
				$('#package-download-button').show();
				$('#package-download-button', this.$el).off('click');
				$('#package-download-button', this.$el).click(function(){
					viewObj.openDownloadConfirmationModal();
				}.bind(viewObj));
				$('#package-copy-query-button', this.$el).click(function(){
					viewObj.copyQueryId();
				}.bind(viewObj));
			}
			else {
				statusMessage = 'Error-please try again';
				fontColor = 'Red';
				$('#package-package-button').prop('disabled', false);
				$('#package-package-button', this.$el).click(function(){
					viewObj.initiatePackage();
				}.bind(viewObj));
				$('#package-package-button').css('background-color', '#337ab7');
			}

			$('#package-download-button', this.$el).removeAttr("href");
			$('#package-participants-value').html(filterModel.get("totalPatients"));
			$('#package-variables-value').html(filterModel.get("totalVariables"));
			$('#package-est-data-value').html(filterModel.get("estDataPoints"));
			$('#package-status').html(statusMessage);
			$('#package-status').css('color', fontColor);
		},
		initiatePackage: function(){
			this.model.set('exportStatus', 'Progress');
			this.updateHeader();
			var query = queryBuilder.createQueryNew(filterModel.get("activeFilters").toJSON(), filterModel.get("exportFields").toJSON(), "02e23f52-f354-4e8b-992c-d37c8b9ba140");
			query = JSON.parse(JSON.stringify(query));
			query.query.expectedResultType="DATAFRAME";
			queryBuilder.updateConsentFilters(query, settings);
			var deferredQueryId = $.Deferred();
			var viewObj = this;
			this.queryAsync(query, deferredQueryId);
			$.when(deferredQueryId).then(function(queryUUID){
				viewObj.model.set('exportStatus', 'Done');
				viewObj.updateHeader();
			});
		},
	queryAsync: function(query, promise){
		var queryUUID = null;
		var queryUrlFragment = '';
		var interval = 0;
		var viewObj = this;

		(function updateStatus(){
			$.ajax({
				url: window.location.origin + "/picsure/query" + queryUrlFragment,
				type: 'POST',
				headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
				contentType: 'application/json',
				dataType: 'text',
				data: JSON.stringify(query),
				success: function(response){
					respJson = JSON.parse(response);
					queryUUID = respJson.picsureResultId;
					status = respJson.status;
					if( !status || status == "ERROR" ){
						viewObj.model.set("exportStatus", status);
						viewObj.updateHeader();
						return;
					} else if (status == "AVAILABLE"){
						//resolve any waiting functions.
						if(promise) {
							viewObj.model.set("queryId", queryUUID);
							promise.resolve(queryUUID);
						}
						return;
					}

					//check again, but back off at 2, 4, 6, ... 30 second (max) intervals
					interval = Math.min(interval + 2000, 30000);
					//hit the status endpoint after the first request
					queryUrlFragment = "/" + queryUUID + "/status";
					setTimeout(updateStatus, interval);
				},
				error: function(response){
					$('#resource-id-display', this.$el).html("Error running query, Please see logs");
					console.log("error preparing async download: ");
					console.dir(response);
				}
			});
		}());
	},
	openDownloadConfirmationModal: function(){
		const dialogOptions = [
			{title: "Cancel", "action": ()=>{$('.close')?.get(0).click();}, classes: "btn btn-default"},
			{title: "Download", "action": ()=>{
				this.downloadData(this);
				$('.close')?.get(0).click();
			}, classes: "btn btn-primary"}
		];
		const message = 'You are transferring data through the BioData Catalyst security boundary which may or may not be supported by your Data Use Agreement(s), Limitation(s), or your Institutional Review Board policies and guidelines. As a BioData Catalyst user, you are solely responsible for adhering to the terms of these policies.';
		const dialogView = new dialog({options: dialogOptions, messages: [message], previousView: {view: this, title: 'Review and Package Data', model: this.model}});
		modal.displayModal(dialogView, 'Are you sure you want to download data?', function(){
			$('#package-download-button').focus();
			dialogView.remove();
		}.bind(this), {isHandleTabs: true, width: 500});
	},
	downloadData: function(viewObj){
		$('#package-download-button', this.$el).removeAttr("href");
		let queryId = viewObj.model.get('queryId');
		$.ajax({
			url: window.location.origin + "/picsure/query/" + queryId + "/result",
			type: 'POST',
			headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
			contentType: 'application/json',
			dataType: 'text',
			data: "{}",
			success: function(response){
				responseDataUrl = URL.createObjectURL(new Blob([response], {type: "octet/stream"}));
				const link = document.createElement('a');
				link.download = 'data.csv';
				link.href = responseDataUrl;
				link.click();
				link.remove();
			}.bind(this),
			error: function(response){
				console.log("error preparing download : ");
				console.dir(response);
			}.bind(this)
		})
	}.bind(this),
	copyQueryId: function(){
		//this will copy the query ID to the user's clipboard
		var sel = getSelection();
		var range = document.createRange();
		document.getElementById("package-query-id").value
		= document.getElementById("package-query-id").textContent;
		range.selectNode(document.getElementById("package-query-id"));
		sel.removeAllRanges();
		sel.addRange(range);
		document.execCommand("copy");
	},
	openVariableValues: function(event){
		let varId = event.target.dataset['varid'];
		let target = _.find(this.tempExportFields,(variable)=>{
			return '\\' + varId + '\\' === '\\' + variable.attributes.variable.metadata.columnmeta_var_id + '\\';
		});
		if (!target){
			target = _.find(this.model.get('deletedExports').models,(variable)=>{
				return varId === variable.attributes.variable.metadata.columnmeta_var_id;
			});
		}
		var valuesModelTemplate = Backbone.Model.extend({
						defaults: {},
					});
		valuesModel = new valuesModelTemplate();
		keyboardNav.addNavigableView("variableValuesModal",this);
		let metadata = target.attributes.variable.metadata;
		valuesModel.varId = metadata.columnmeta_var_id;
		valuesModel.varDesc = metadata.columnmeta_description;
		valuesModel.varName = metadata.columnmeta_name;
		valuesModel.varDataset = metadata.columnmeta_var_group_id;
		valuesModel.varStudy = metadata.columnmeta_study_id;
		valuesModel.isNumerical = target.attributes.variable.is_continuous ? target.attributes.variable.is_continuous : false;
		valuesModel.isCategorical = target.attributes.variable.is_categorical ? target.attributes.variable.is_categorical : true;
		if(valuesModel.isCategorical){
			valuesModel.varValues = target.attributes.variable.values;
		}
		else{
			valuesModel.varMin = metadata.columnmeta_min;
			valuesModel.varMax = metadata.columnmeta_max;
		}
		this.valuesView = new variableValuesView({
			prevModal: {
				view: this,
				title: 'Review and Package Data',
				div: '#package-modal'
			},
			model: valuesModel});
		let title = 'Values for ' + varId;
		modal.displayModal(
			this.valuesView,
			title,
			() => {
				$('#values-modal').focus();
			}, {isHandleTabs: true}
		);
	},
	render: function(){
		this.$el.html((HBS.compile(packageModalTemplate))(this.model));
		$('.modal-dialog').width('90%');
		$('#package-datatable-table').html("<style scoped>th{width:auto !important;background:white;}</style> <table id='exportData' class='display stripe' ></table>");
		this.updateHeader();
		let toggleable = true;
		let data = this.dtData;
		if(!data){

			data = _.map(this.tempExportFields,function(model){
				let variable = model.attributes;

				let metadata = variable.variable.metadata;
				let values = variable.variable.values.join(", ");

				return [
					true,
					metadata.columnmeta_var_id,
					metadata.columnmeta_name,
					metadata.columnmeta_description,
					(metadata.columnmeta_data_type.toLowerCase() == 'continuous')  ? metadata.columnmeta_data_type.toLowerCase() : 'categorical',
					(metadata.columnmeta_data_type.toLowerCase() == 'continuous') ? 'Min: '+ metadata.columnmeta_min + ', Max: ' + metadata.columnmeta_max : '',
					(metadata.columnmeta_data_type.toLowerCase() == 'categorical') ?  '[ ' + values + ' ]' :  "",
					variable.type,
					metadata.columnmeta_HPDS_PATH
				];
			});
			this.dtData = data;
		}

		$('#exportData').DataTable( {
			data: data,
			columns: [
				{title:'Selected'},
				{title:'Variable ID'},
				{title:'Name'},
				{title:'Description'},
				{title:'Type'},
				{title: 'Values'},
				{title: 'ValuesHidden', visible: false},
				{title: 'exportType', visible: false}
			],
			select: {
				style:    'os',
				selector: 'td:first-child',
				toggleable: toggleable
			},
			columnDefs: [
				{
					targets: [1,2,3,4],
					className: 'dt-center',
					type:'string'
				},
				{
					render: function(data,type,row,meta){
						if(row[7] === 'auto'){
							return '<input data-sort-token=' + (data?0:1) + ' checked='+data+' type="checkbox" tabindex="-1" data-varid="'+row[1]+'" title= "This variable cannot be removed from the export." disabled></input>'
						}
						else if (row[7] === 'filter'){
							return '<input data-sort-token=' + (data?0:1) + ' checked='+data+' type="checkbox" tabindex="-1" data-varid="'+row[1]+'" title = "This variable cannot be removed from the export." disabled></input>'
						}
						return '<input data-sort-token=' + (data?0:1) + ' checked='+data+' type="checkbox" tabindex="-1" data-varid="'+row[1]+'"></input>';
					},
					type:'string',
					targets: 0
				},
				{
					render: function(data,type,row,meta){

						if(row[4].toLowerCase() === 'categorical' && row[6] !== ""){
						return '<button class="btn btn-primary" id="varValuesButton" data-sort-token=' + (data?0:1) + ' tabindex="-1" data-varid="'+row[1]+'">See Values</button>';
						}
						else{
						return '<td class="dt-center" data-sort-token=' + (data?0:1) + ' tabindex="-1" data-varid="'+row[1]+'">'+data+'</td>'
					}
					},
					type:'string',
					targets: 5
				},

			],
			order: [[7,'desc'],[ 0, 'asc' ], [1, 'asc']],
			deferRender: true,
			drawCallback: function(){
				this.setTabIndices();
				this.delegateEvents();
			}.bind(this)
		} );
		this.setTabIndices();
		return this;
	},
	setTabIndices: function(){
		let tabcounter = 1000000;
		$('.dataTables_length select').attr('tabindex', tabcounter++);
		$('.dataTables_filter input').attr('tabindex', tabcounter++);

		_.each($('.sorting', this.$el), function(sortHeader){
			sortHeader.setAttribute('tabindex', tabcounter++);
		});
		_.each($('select', this.$el), function(checkbox){
			checkbox.setAttribute('tabindex', tabcounter++);
		});
		_.each($('.paginate_button'), function(pagebutton){
			pagebutton.setAttribute('tabindex', -1);
		});
		$('#exportData').attr('tabindex', tabcounter++);
		$('#add-filter-button').attr('tabindex', tabcounter++);
	}
});
return packageView;
;

});
