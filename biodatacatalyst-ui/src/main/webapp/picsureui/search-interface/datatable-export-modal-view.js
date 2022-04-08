define(['backbone', 'handlebars','text!search-interface/datatable-export-modal-view.hbs', 'datatables.net', "common/keyboard-nav", "search-interface/filter-model", "search-interface/search-util"],
	function(BB, HBS, datatableExportModalTemplate, datatables, keyboardNav,  filterModel, searchUtil){
	let DatatableExportModalView = BB.View.extend({
		initialize: function(opts){
			keyboardNav.addNavigableView("datatableExportModal",this);
			if (opts.model.dataTableInfo) {
				this.data.studyName = searchUtil.findStudyAbbreviationFromId(opts.model.dataTableInfo.studyId);
				this.data.studyId = opts.model.dataTableInfo.studyId;
				this.data.datasetName = opts.model.dataTableInfo.dataTableName;
			}
			this.data.datasetAccession = this.model.dtId;
			this.on({
				'keynav-arrowup document': this.previousVariable,
				'keynav-arrowdown document': this.nextVariable,
				'keynav-arrowright document': this.nextPage,
				'keynav-arrowleft document': this.previousPage
			});
		},
		events: {
			"click #add-exports-button":"addVariablesToExport",
			'click input[type="checkbox"]':"checkboxToggled",
			'click #select-all':'selectAll',
			'click #deselect-all':'deselectAll',
			'focus #vcfData': 'vcfDataFocus',
			'blur #vcfData': 'vcfDataBlur'
		},
		data: function(){
			return $('#vcfData').DataTable().rows( {order:'index', search:'applied'} ).data();
		},
		nextPage: function(){
		    $('#vcfData').DataTable().page( 'next' ).draw( 'page' );
			$('#aria-live').html("Now on page " + ($('#vcfData').DataTable().page() + 1) + " of the results region.");
		},
		previousPage: function(){
			$('#vcfData').DataTable().page( 'previous' ).draw( 'page' );
			$('#aria-live').html("Now on page " + ($('#vcfData').DataTable().page() + 1) + " of the results region.");
		},
		previousVariable: function(event){
			let variables = this.$("#vcfData tr");
			let focusedVariable = this.adjustFocusedVariable(1, variables);
		},
		nextVariable: function(event){
			let variables = this.$("#vcfData tr");
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
            $("#vcfData").attr("aria-activedescendant", variables[focusedVariable].id);

			searchUtil.ensureElementIsInView(variables[focusedVariable]);
		},
		vcfDataFocus: function(event){
			keyboardNav.setCurrentView("datatableExportModal");
		},
		vcfDataBlur: function(){
			keyboardNav.setCurrentView(undefined);
			this.$("#vcfData.focused-variable").removeClass('focused-variable');
		},
		selectAll: function(){
			_.each(this.data(),
				(row)=>{
					row[0]=true;
					let variableId = row[1];
					let dataRow = _.find(this.data(), (entry)=>{ return entry[1] === variableId;});
					dataRow[0] = true;
					let checkbox = $('input[data-varid="' + variableId +'"]')[0];
					if(checkbox!==undefined){
						checkbox.checked = true;
					}
				});
		},
		deselectAll: function(){
			_.each(this.data(),
				(row)=>{
					row[0]=false;
					let variableId = row[1];
					let dataRow = _.find(this.data(), (entry)=>{ return entry[1] === variableId;});
					dataRow[0] = false;
					let checkbox = $('input[data-varid="' + variableId +'"]')[0];
					if(checkbox!==undefined){
						checkbox.checked = false;
					}
				});
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
		},
		addVariablesToExport: function(){
			var exportView = this;
			 _.each(this.data(), (variable)=>{
				 if(variable[0] !== filterModel.isExportFieldFromId(variable[1])){
					 let toggledField = exportView.getVariableData(variable[1]);
					 filterModel.toggleExportField(toggledField);
				 }
			});
            $('.close').click();
		},
		getVariableData: function(id){
			let variable = _.find(this.model.dtVariables, function(searchResult){
				return id === searchResult.result.metadata.columnmeta_var_id;
			});
			return variable;
		},
		render: function(){
			const template = HBS.compile(datatableExportModalTemplate);
			this.$el.html(template(this.data));
			$('.modal-dialog').width('90%');
			$('#datatable-modal-table').html("<style scoped>th{width:auto !important;background:white;}</style> <table id='vcfData' class='display stripe' ></table>");
			let toggleable = true;
			let data = _.map(this.model.dtVariables,function(variable){
                	return [
						//TODO change to check for variable in ExportFields
                		filterModel.isExportField(variable),
						variable.result.metadata.columnmeta_var_id,
						variable.result.metadata.columnmeta_name,
						variable.result.metadata.columnmeta_description,
						variable.result.metadata.columnmeta_data_type,
						(variable.result.metadata.columnmeta_data_type == 'Continuous') ? "" : '[ ' + variable.result.value_tags.join(", ") + ' ]',
						variable.result.metadata.columnmeta_HPDS_PATH
                	];
                });
            $('#vcfData').DataTable( {
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
            $('<div id="datatable-selection-buttons"><button id="select-all">Select All</button><button id="deselect-all">Deselect All</button></div>').insertBefore('#vcfData_filter');
            this.setTabIndices();
		},
		setTabIndices: function(){
		    let tabcounter = 1000001;
	        $('.dataTables_length select').attr('tabindex', tabcounter++);
            $('.dataTables_filter input').attr('tabindex', tabcounter++);
            $('#select-all').attr('tabindex', tabcounter++);
            $('#deselect-all').attr('tabindex', tabcounter++);

            _.each($('.sorting', this.$el), function(sortHeader){
            	sortHeader.setAttribute('tabindex', tabcounter++);
            });
            _.each($('select', this.$el), function(checkbox){
            	checkbox.setAttribute('tabindex', tabcounter++);
            });
            _.each($('.paginate_button'), function(pagebutton){
            	pagebutton.setAttribute('tabindex', -1);
            });
            $('#vcfData').attr('tabindex', tabcounter++);
            $('#add-filter-button').attr('tabindex', tabcounter++);
		}
	});
	return DatatableExportModalView;
});
