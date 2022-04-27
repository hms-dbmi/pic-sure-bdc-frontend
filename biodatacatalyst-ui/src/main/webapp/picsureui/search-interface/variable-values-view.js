define(['backbone', 'handlebars','text!search-interface/variable-values-view.hbs', 'datatables.net', "common/keyboard-nav", "search-interface/modal"],
	function(BB, HBS, variableValuesModalTemplate, datatables, keyboardNav, modal){
	let VariableValuesModalView = BB.View.extend({
		initialize: function(opts){
			this.prevModal = opts.prevModal;
			this.model = opts.model;
			this.on({
				'keynav-arrowup document': this.previousVariable,
				'keynav-arrowdown document': this.nextVariable,
				'keynav-arrowright document': this.nextPage,
				'keynav-arrowleft document': this.previousPage
			});

		},
		events: {
			'focus #vcfData': 'vcfDataFocus',
			'blur #vcfData': 'vcfDataBlur',
			'click #return-to-results': 'returnToPrevModal'
		},
		returnToPrevModal: function(opts){
			let prevModal = this.prevModal;
			if(opts){
				prevModal = opts;
			}
			modal.displayModal(
				prevModal.view,
				prevModal.title,
					() => {
						$(prevModal.div).focus();
					}
			);
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
			keyboardNav.setCurrentView("datatableFilterModal");
		},
		vcfDataBlur: function(){
			keyboardNav.setCurrentView(undefined);
			this.$("#vcfData.focused-variable").removeClass('focused-variable');
		},
		render: function(){
			const template = HBS.compile(variableValuesModalTemplate);
			this.$el.html(template(this.model));
			$('.modal-dialog').width('90%');

			if(this.model.isCategorical){
				$('#value-modal-table').html("<style scoped>th{width:auto !important;background:white;}</style> <table id='valueData' class='display stripe' ></table>");
				let data = _.map(this.model.varValues,function(value){return [
					value
				]
                });
	            $('#valueData').DataTable( {
	                data: data,
	                columns: [
	                	{title:'Value'}
	               	],
	                columnDefs: [
	                    {
	                        targets: [0],
	                        className: 'dt-left',
	                        type:'string'
	                    },

	                  ],
	        		order: [[0,'asc']],
	                deferRender: true,
	            } );
	            this.setTabIndices();
			}
			$('#close-modal-button').off('click');
			let valueView = this;
			$('#close-modal-button').one('click', function(){valueView.returnToPrevModal(valueView.prevModal)});

		},
		setTabIndices: function(){
		    let tabcounter = 1000001;
	        $('.dataTables_length select').attr('tabindex', tabcounter++);
            $('.dataTables_filter input').attr('tabindex', tabcounter++);

            _.each($('.sorting', this.$el), function(sortHeader){
            	sortHeader.setAttribute('tabindex', tabcounter++);
            });
            _.each($('.paginate_button'), function(pagebutton){
            	pagebutton.setAttribute('tabindex', -1);
            });
            $('#vcfData').attr('tabindex', tabcounter++);
		}
	});
	return VariableValuesModalView;
});
