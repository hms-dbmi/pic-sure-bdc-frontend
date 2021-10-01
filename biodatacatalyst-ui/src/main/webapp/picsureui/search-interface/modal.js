define(["handlebars","jquery","backbone","text!options/modal.hbs"],
	function(HBS,$,BB,modalTemplate){
	let Modal = BB.View.extend({
		initialize: function(opts){
			this.title="";
			HBS.registerHelper("tabindex", function(options) {
			  return 1000000 + options;
			});
			this.createTabLoop();
		},
		events: {

		},
		render: function(){
			if ($("#modal-window").length === 0) {
                $('#main-content').append('<div id="modal-window"></div>');
            }

            $("#modal-window").html(HBS.compile(modalTemplate)({title: this.title}));
            $('.close').click(function() {
                $("#modalDialog").hide();
                $(".modal-backdrop").hide();
            });
		},
		displayModal: function(view, title, dismissalAction){
			this.render();
	        $("#modalDialog").modal({keyboard:true});
			if(dismissalAction){
				$('#modalDialog').on('hidden.bs.modal', dismissalAction);
			}
            $('.close').attr('tabindex', 1100000);
			this.title = title;
			view.setElement($(".modal-body"));
			view.render();
		},
		createTabLoop: function() {
            document.addEventListener('keydown', function(e) {
                let isTabPressed = e.key === 'Tab' || e.keyCode === 9;

                if (!isTabPressed) {
                    return;
                }

                if (e.shiftKey) { // if shift key pressed for shift + tab combination
                    if ($(document.activeElement).is($('[tabindex="1000000"]'))) {
                        $('[tabindex="1100000"]').focus(); // add focus for the last focusable element
                        e.preventDefault();
                    }
                } else { // if tab key is pressed
                    if ($(document.activeElement).is($('[tabindex="1100000"]'))) { // if focused has reached to last focusable element then focus first focusable element after pressing tab
                        $('[tabindex="1000000"]').focus(); // add focus for the first focusable element
                        e.preventDefault();
                    }
                }
            });
            $('[tabindex="1000000"]').focus();
            $('.close').focus();
        }
        
	});
	return new Modal;
});