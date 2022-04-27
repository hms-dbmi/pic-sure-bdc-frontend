define(["jquery",'backbone', 'handlebars','text!search-interface/package-view.hbs', 'datatables.net', "common/keyboard-nav", "search-interface/filter-model", "search-interface/search-util", "picSure/queryBuilder", "search-interface/query-results-view", "overrides/outputPanel", "picSure/settings", "search-interface/variable-values-view", "search-interface/modal"],
function($, BB, HBS, packageModalTemplate, datatables, keyboardNav,  filterModel, searchUtil, queryBuilder, queryResultsView, output, settings, variableValuesView, modal){

	var packageView = BB.View.extend({
		initialize: function(){
			keyboardNav.addNavigableView("datatablePackageModal",this);
			this.on({
				'keynav-arrowup document': this.previousVariable,
				'keynav-arrowdown document': this.nextVariable,
				'keynav-arrowright document': this.nextPage,
				'keynav-arrowleft document': this.previousPage
			});
			this.tempExportFields = filterModel.get("exportFields").models;
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
					return filter.attributes.metadata.columnmeta_var_id === target[1];
				});
				filterModel.get("exportFields").add(varToAdd);
				this.model.get("deletedExports").remove(varToAdd);
			}
			else{
				let varToRemove = filterModel.get("exportFields").find((filter) => {
					return filter.attributes.metadata.columnmeta_var_id === target[1];
				});
				filterModel.get("exportFields").remove(varToRemove);
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
					viewObj.downloadData(viewObj);
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
				$("#package-download-button", this.$el).off('click');
				$("#package-download-button", this.$el).attr("href", responseDataUrl);
				$("#package-download-button", this.$el)[0].click();
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
			return varId === variable.attributes.metadata.columnmeta_var_id;
		});
		if (!target){
			target = _.find(this.model.get('deletedExports').models,(variable)=>{
				return varId === variable.attributes.metadata.columnmeta_var_id;
			});
		}
		var valuesModelTemplate = Backbone.Model.extend({
						defaults: {},
					});
		valuesModel = new valuesModelTemplate();
		keyboardNav.addNavigableView("variableValuesModal",this);
		valuesModel.varId = target.attributes.metadata.columnmeta_var_id;
		valuesModel.varDesc = target.attributes.metadata.columnmeta_description;
		valuesModel.varName = target.attributes.metadata.columnmeta_name;
		valuesModel.varDataset = target.attributes.metadata.columnmeta_var_group_id;
		valuesModel.varStudy = target.attributes.metadata.columnmeta_study_id;
		valuesModel.isNumerical = target.attributes.is_continuous;
		valuesModel.isCategorical = target.attributes.is_categorical;
		if(valuesModel.isCategorical){
			valuesModel.varValues = target.attributes.value_tags;
		}
		else{
			valuesModel.varMin = target.attributes.metadata.columnmeta_min;
			valuesModel.varMax = target.attributes.metadata.columnmeta_max;
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
			}
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
			data = _.map(this.tempExportFields,function(variable){
				return [
					true,
					variable.attributes.metadata.columnmeta_var_id,
					variable.attributes.metadata.columnmeta_name,
					variable.attributes.metadata.columnmeta_description,
					variable.attributes.metadata.columnmeta_data_type,
					'See Values',
					(variable.attributes.metadata.columnmeta_data_type == 'Continuous') ? "" : '[ ' + variable.attributes.value_tags.join(", ") + ' ]',
					variable.attributes.metadata.columnmeta_HPDS_PATH
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
				{title: 'ValuesHidden', visible: false}
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
						return '<input data-sort-token=' + (data?0:1) + ' checked='+data+' type="checkbox" tabindex="-1" data-varid="'+row[1]+'"></input>';
					},
					type:'string',
					targets: 0
				},
				{
					render: function(data,type,row,meta){
						return '<button class="btn btn-primary" id="varValuesButton" data-sort-token=' + (data?0:1) + ' tabindex="-1" data-varid="'+row[1]+'">See Values</button>';
					},
					type:'string',
					targets: 5
				},

			],
			order: [[0,'asc'],[ 1, 'asc' ]],
			deferRender: true,
			drawCallback: function(){
				let x = 0;
				_.each($('input[type="checkbox"]'), (checkbox)=>{
					let varId = checkbox.dataset['varid'];
					let dataRow = _.find(this.data(), (entry)=>{ return entry[1] === varId;});
					if(dataRow[0]){
						$('input[data-varid="' + varId +'"]')[0].checked = true;
					}else{
						$('input[data-varid="' + varId +'"]')[0].checked = false;
					}
					checkbox.parentElement.parentElement.id = "table_" + x;
					x++;
				});
				this.setTabIndices();
				this.delegateEvents();
			}.bind(this)
		} );
		this.setTabIndices();
		return this;
	},
	setTabIndices: function(){
		let tabcounter = 1000001;
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
