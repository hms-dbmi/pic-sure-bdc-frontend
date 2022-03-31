define(["jquery",'backbone', 'handlebars','text!search-interface/package-view.hbs', 'datatables.net', "common/keyboard-nav", "search-interface/filter-model", "search-interface/search-util", "picSure/queryBuilder", "search-interface/query-results-view"],
function($, BB, HBS, packageModalTemplate, datatables, keyboardNav,  filterModel, searchUtil, queryBuilder, queryResultsView){

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
			this.listenTo(this.model.get('exportStatus'), 'change reset add remove', this.updateHeader);
		},
		events: {
			'click input[type="checkbox"]':"checkboxToggled",
			'focus #exportData': 'exportDataFocus',
			'blur #exportData': 'exportDataBlur'
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
					return filter.get("result").varId === target[1];
				});
				filterModel.get("exportFields").add(varToAdd);
				this.model.get("deletedExports").remove(varToAdd);
			}
			else{
				let varToRemove = filterModel.get("exportFields").find((filter) => {
					return filter.get("result").varId === target[1];
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
			if(exportStatus === 'Ready'){
				statusMessage = 'Status:  Ready to package. \nClick "Package Data" to proceed.';
				$('#package-package-button').prop('disabled', false);
				$('.package-query-container').hide();
				$('#package-download-button').hide();
			}
			else if (exportStatus === 'Overload') {
				fontColor = 'Red';
				statusMessage = 'Status: NUMBER OF DATA POINTS EXCEEDED \nRemove data selections';
				$('#package-package-button').prop('disabled', true);
				$('.package-query-container').hide();
				$('#package-download-button').hide();
			}
			else if (exportStatus === 'Progress') {
				statusMessage = 'Status: In Progress';
				$('#package-package-button').prop('disabled', true);
				$('.package-query-container').hide();
				$('#package-download-button').hide();
			}
			else if (exportStatus === 'Done') {
				statusMessage = 'Status: Available';
				$('#package-package-button').prop('disabled', false);
				$('.package-query-container').show();
				$('#package-download-button').show();
			}
			$('#package-participants-value').html(filterModel.get("totalPatients"));
			$('#package-variables-value').html(filterModel.get("totalVariables"));
			$('#package-est-data-value').html(filterModel.get("estDataPoints"));
			$('#package-status').html(statusMessage);
			$('#package-status').css('color', fontColor);
		},

		render: function(){
			this.$el.html((HBS.compile(packageModalTemplate))(this.model));
			$('.modal-dialog').width('90%');
			$('#package-datatable-table').html("<style scoped>th{width:auto !important;background:white;}</style> <table id='exportData' class='display stripe' ></table>");
			this.updateHeader();
			let toggleable = true;
			let data = _.map(this.tempExportFields,function(variable){
				return [
					true,
					variable.attributes.result.varId,
					variable.attributes.result.metadata.name,
					variable.attributes.result.metadata.description,
					variable.attributes.result.is_continuous ? "Continuous" : "Categorical",
					variable.attributes.result.is_continuous ? "" : '[ ' + variable.attributes.result.value_tags.join(", ") + ' ]',
					variable.attributes.result.metadata.HPDS_PATH
				];
			});
			$('#exportData').DataTable( {
				data: data,
				columns: [
					{title:'Selected'},
					{title:'Variable ID'},
					{title:'Name'},
					{title:'Description'},
					{title:'Type'},
					{title:'Values'}
				],
				select: {
					style:    'os',
					selector: 'td:first-child',
					toggleable: toggleable
				},
				columnDefs: [
					{
						targets: [1,2,3,4,5],
						className: 'dt-center',
						type:'string'
					},
					{
						render: function(data,type,row,meta){
							return '<input data-sort-token=' + (data?0:1) + ' checked='+data+' type="checkbox" tabindex="-1" data-varid="'+row[1]+'"></input>';
						},
						type:'string',
						targets: 0
					}
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
