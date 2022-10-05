define(["handlebars","jquery","backbone","text!options/modal.hbs"],
	function(HBS,$,BB,modalTemplate){
		const TAB_INDEX_START = 1000000;
	let Modal = BB.View.extend({
		initialize: function(opts){
			this.title="";
			HBS.registerHelper("tabindex", function(options) {
			  return TAB_INDEX_START + options;
			});
			this.createTabLoop();
		},

		events: {

		},

		render: function(){
			if ($("#modal-window").length === 0) {
                $('#main-content').append('<div id="modal-window" aria-modal="true"></div>');
            }
			if($("#modal-window").length !== 0) {
				$(".modal-backdrop").remove();
			}

            $("#modal-window").html(HBS.compile(modalTemplate)({title: this.title}));
            $('.close').click(function() {
                $("#modalDialog").hide();
                $(".modal-backdrop").hide();
            });
		},

		/*
			This function displays the Backbone.View passed in as the first argument. The
			second argument sets the title of the modal. The third is a callback which will
			be fired when the modal is dismissed. This dismissalAction enables chained modals
			where a modal can fire another modal and when that second modal is dismissed the
			prior modal can be displayed.
		*/
		displayModal: function(view, title, dismissalAction, opts){
			this.title = title;
			this.render();

	        $("#modalDialog").modal({keyboard:true});
			if(dismissalAction){
				$('#modalDialog').on('hidden.bs.modal', dismissalAction);
			}
            $('.close').attr('tabindex', 1100000);
			view.setElement($(".modal-body"));
			view.render();
			opts && opts.isHandleTabs && this.createTabIndex();
			opts && opts.width && $('.modal-dialog').width(opts.width);
		},

		/*
			This function contains tab navigation to the modal to prevent focusing on
			elements that are behind the modal. This is a requirement of 
			https://www.w3.org/TR/wai-aria-practices-1.1/#dialog_modal
		*/
		createTabLoop: function() {
            document.addEventListener('keydown', function(e) {
                let isTabPressed = e.key === 'Tab' || e.keyCode === 9;

                if (!isTabPressed) {
                    return;
                }

                if (e.shiftKey) { // if shift key pressed for shift + tab combination
                    if ($(document.activeElement).is($('[tabindex="'+TAB_INDEX_START+'"]'))) {
                        $('[tabindex="1100000"]').focus(); // add focus for the last focusable element
                        e.preventDefault();
                    }
                } else { // if tab key is pressed
                    if ($(document.activeElement).is($('[tabindex="1100000"]'))) { // if focused has reached to last focusable element then focus first focusable element after pressing tab
                        $('[tabindex="'+TAB_INDEX_START+'"]').focus(); // add focus for the first focusable element
                        e.preventDefault();
                    }
                }
            });
            // TODO : What?
            //$('[tabindex="1000000"]').focus();
           // $('.close').focus();
        },

		// Finds elements with a tab index or the class 'tabable' and sets the correct tab index for the modal. 
		// Ignores the close button.
		createTabIndex: function() {
			let tabIndex = TAB_INDEX_START;
			_.each($('#modalDialog').find('[tabindex]:not(.close),.tabable'), function(el) {
				$(el).attr('tabindex', tabIndex);
				tabIndex++;
			});
		}
        
	});
	return new Modal;
});