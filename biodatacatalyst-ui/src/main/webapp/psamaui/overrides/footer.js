define(["handlebars", "text!overrides/footer.hbs"], function(HBS, template){
	return {
		/*
		 * The render function for the footer can be overridden here.
		 */
		
		
		
		
		render : function(){
			this.$el.html(HBS.compile(template)());
		}
	};
});