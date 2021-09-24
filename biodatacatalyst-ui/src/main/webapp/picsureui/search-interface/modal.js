define(["handlebars","jquery","backbone","text!options/modal.hbs"],
	function(HBS,$,BB,modalTemplate){
	let Modal = BB.View.extend({
		initialize: function(opts){
			this.render();
			this.title="";
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
            $("#modalDialog").show();
		},
		displayModal: function(view, title){
			this.title = title;
			this.render();
			view.setElement($(".modal-body"));
			view.render();
		}
	});
	return new Modal;
});