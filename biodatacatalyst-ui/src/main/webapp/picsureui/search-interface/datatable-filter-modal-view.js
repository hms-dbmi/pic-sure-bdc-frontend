define(['backbone', 'handlebars','text!search-interface/datatable-filter-modal-view.hbs', 'datatables.net', "search-interface/keyboard-nav", "search-interface/filter-model"],
	function(BB, HBS, datatableFilterModalTemplate, datatables, keyboardNav,  filterModel){
	let DatatableFilterModalView = BB.View.extend({
		initialize: function(){
			keyboardNav.addNavigableView("datatableFilterModal",this);
		},
		events: {
			"click #add-filter-button":"addFilterToQuery",
			'click input[type="checkbox"]':"checkboxToggled"
		},
		checkboxToggled: function(){
			let target = _.find(this.data,(variable)=>{
	    		return event.target.id.substring(12) === variable[1];
	    	});
	    	target[0] = !target[0];
		},
		addFilterToQuery: function(){
			let selectedVariables = _.filter(this.data, (variable)=>{
				return variable[0];
			});
			console.log(selectedVariables);
			filterModel.addDatatableFilter({
				variables: selectedVariables,
				dtId:this.model.dtId,
				title: "\\" + this.model.dtVariables[0].result.metadata.study_id + "\\" + this.model.dtId + "\\",
				searchResult: this.model.dtVariables[0]
			});
            $('.close').click();
		},
		nextPage: function(){
			let nextPageLink = document.getElementById('page-link-' + tagFilterModel.get("currentPage")).nextElementSibling;
			if(nextPageLink){
				tagFilterModel.set("currentPage", nextPageLink.dataset["page"]);
			}
			$('#aria-live').html("Now on page " + tagFilterModel.get("currentPage") + " of the results region.");
		},
		previousPage: function(){
			let previousPageLink = document.getElementById('page-link-' + tagFilterModel.get("currentPage")).previousElementSibling;
			if(previousPageLink){
				tagFilterModel.set("currentPage", previousPageLink.dataset["page"]);
			}
			$('#aria-live').html("Now on page " + tagFilterModel.get("currentPage") + " of the results region.");
		},
		render: function(){
			this.$el.html(HBS.compile(datatableFilterModalTemplate)());
			$('.modal-dialog').width('90%');
			$('#datatable-modal-table').html("<style scoped>th{width:auto !important;background:white;}</style> <table id='vcfData' class='display stripe' ></table>");
			let tabcounter = 1000000;
			let toggleable = true;
			let existingFilter = filterModel.getByDatatableId(this.model.dtId);
			this.data = _.map(this.model.dtVariables,function(variable){
                	return [
                		existingFilter ? 
                			(_.find(existingFilter.get('variables'), (conceptPath)=>{
                			return conceptPath.includes(variable.result.varId);
                			}) !== undefined ? true : false) : true,
                		variable.result.varId,
                		variable.result.metadata.name,
                		variable.result.metadata.description,
                		variable.result.is_continuous ? "Continuous" : "Categorical",
                		variable.result.is_continuous ? "" : '[ ' + variable.result.value_tags.join(", ") + ' ]',
                		variable.result.metadata.HPDS_PATH
                	];
                });
            $('#vcfData').DataTable( {
                data: this.data,
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
                        className: 'dt-center'
                    },
                    {
                    	render: function(data,type,row,meta){
                    		return '<input type="checkbox" id="dt-checkbox-'+row[1]+'" checked='+data+'></input>';
                    	},
                    	targets:0
                    }
                  ],
        		order: [[ 1, 'asc' ]],
                deferRender: true,
                drawCallback: function(){
                	if(existingFilter !== undefined){
	                	_.each($('input[type="checkbox"]'), (checkbox)=>{
	                		if(_.find(existingFilter.get('variables'), (conceptPath)=>{
	                			return conceptPath.includes(checkbox.id.substring(12));
							}) === undefined){
							    checkbox.checked = false;	
							}
	                	});
                	}
                    this.delegateEvents();
                }.bind(this)
            } );
            _.each($('select', this.$el), function(checkbox){
            	checkbox.setAttribute('tabindex', tabcounter++);
            });
            _.each($('input[type="search"]', this.$el), function(checkbox){
            	checkbox.setAttribute('tabindex', tabcounter++);
            });
            $('#vcfData').attr('tabindex', tabcounter++);
            $('#add-filter-button').attr('tabindex', tabcounter++);
		}
	});
	return DatatableFilterModalView;
});