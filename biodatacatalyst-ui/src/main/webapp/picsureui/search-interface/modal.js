define(["handlebars","jquery","backbone","text!options/modal.hbs"],
	function(HBS,$,BB,modalTemplate){
	let Modal = BB.View.extend({
		initialize: function(opts){
			this.render();
		},
		events: {

		},
		render: function(){
			// if ($("#modal-window").length === 0) {
   //                  $('#header').append('<div id="modal-window"></div>');
   //          }
   //          this.setElement($("#modal-window"));

   //          $("#modal-window").html(HBS.compile(modalTemplate)({title: ""}));
   //          $("#modal-window").modal({keyboard:true});
   //          $("#modal-window").modal('hide');
		},
		displayModal: function(view, title){
			this.render();
			$("#modal-window").modal('show');
			this.$(".modal-title").html(title);
			view.setElement(this.$(".modal-body"));
			view.render();
		}
	});
	return new Modal;
});