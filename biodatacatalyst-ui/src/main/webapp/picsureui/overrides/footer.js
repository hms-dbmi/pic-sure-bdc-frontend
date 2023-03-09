define(["handlebars", "text!overrides/footer.hbs", "common/modal", "common/link-redirect-warning"], function(HBS, template, modal, linkRedirect){
	return {
		/*
		 * The render function for the footer can be overridden here.
		 */
		render : function(){
			let title  = window.location.pathname.split("/");
			title = title[2]; // begins with empty string
			switch(title) {
				case "dataAccess":
					title = "Data Access";
					break;
				case "openAccess":
					title = "Open Access";
					break;
				case "queryBuilder":
					title = "Authorized Builder";
					break;
				default:
					title = "";
					break;
			}
			title = "BioData Catalyst Powered by PIC-SURE: " + title;
			if(!$('title').length){
				$('head').append("<title></title>");
			}
			$('title').html(title);
			this.$el.html(HBS.compile(template)());

			$(document).ready(function() {
				$('a[target="_blank"]').on('click', function (event) {
					event.preventDefault();
					console.log(event.target.href);

					const linkView = new linkRedirect({href: event.target.href});
					modal.displayModal(
						linkView
						, "Leaving BDC-PIC-SURE"
						, () => {}
						, {handleTabs: true, width: "450px"}
					);
				});
			});
		}
	};
});
