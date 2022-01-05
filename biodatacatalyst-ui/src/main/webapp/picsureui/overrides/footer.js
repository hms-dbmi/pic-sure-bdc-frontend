define(["handlebars", "text!overrides/footer.hbs"], function(HBS, template){
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
		}
	};
});
