define(["handlebars", "backbone", "picSure/settings", "common/transportErrors", "picSure/queryBuilder"],
	function(HBS, BB, settings, transportErrors, queryBuilder){

	return {
		/*
		 * This should be a function that returns the name of a Handlebars partial
		 * that will be used to render the count. The Handlebars partial should be
		 * registered at the top of this module.
		 */
		countDisplayOverride : undefined,
		/*
		 * This is a function that if defined replaces the normal render function
		 * from outputPanel.
		 */
		renderOverride : function(result){
			var context = this.model.toJSON();
			this.$el.html(this.template(Object.assign({},context , this.overrides)));
			
			if(result){
				//hide 'select data' button if this is the first query or if no patients were filtered out 
				if(!this.initialQueryCount || this.initialQueryCount == parseInt(result)){
					this.initialQueryCount = parseInt(result);
				}else if(parseInt(result) > 0){
					$("#select-btn", this.$el).css("display", "block");
					//have to rebind this function to render the data selection, so it only shows after a click.
					if(this.dataSelection){
						$("#select-btn", this.$el).click(function() {
							this.dataSelection.setElement($("#concept-tree-div",this.$el));
							this.dataSelection.render();
						}.bind(this));
					}
				}
			}
		},
		/*
		 * If you want to replace the entire Backbone.js View that is used for
		 * the output panel, define it here.
		 */
		viewOverride : undefined,
		/*
		 * If you want to replace the entire Backbone.js Model that is used for
		 * the output panel, define it here.
		 */
		modelOverride : undefined,
		/*
		 * In case you want to change the update logic, but not the rendering or
		 * anything else, you can define a function that takes an incomingQuery
		 * and dispatches it to the resources you choose, and handles registering
		 * callbacks for the responses and error handling.
		 */
		update: undefined,
		/*
		 * A function that takes two parameters, the first being a PUI, the second
		 * being a picsureInstance such as is configured in settings.json and returns
		 * a PUI that is valid for that picsureInstance.
		 */
		mapPuiForResource: undefined,
		/*
		 * If you want to show your customized error message, please override this
		 */
		outputErrorMessage: undefined,
		/*
		 * The new hook for overriding all custom query logic
		 */
		runQuery: function(defaultOutput, incomingQuery, defaultDataCallback, defaultErrorCallback){
			defaultOutput.queryRunning();
			
			defaultOutput.model.baseQuery = JSON.parse(JSON.stringify(incomingQuery));  //store base query with all consent filters
			var query = JSON.parse(JSON.stringify(incomingQuery)); //make a safe copy for filtering out consents

			//BDC requires appropriate consent filters to be supplied
			queryBuilder.updateConsentFilters(query, settings);
			
			$.ajax({
				url: window.location.origin + "/picsure/query/sync",
				type: 'POST',
				headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
				contentType: 'application/json',
				data: JSON.stringify(query),
				success: function(response, textStatus, request){
					defaultDataCallback(response, request.getResponseHeader("resultId"));
					defaultOutput.render(response);
				}, //.bind(this),
				error: function(response){
					if (!transportErrors.handleAll(response, "Error while processing query")) {
						history.pushState({}, "Unexpected Error", "/picsureui/unexpected_error");
					}
				}
			});
		}
	};
});
