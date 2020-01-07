define(["handlebars", "backbone"], function(HBS, BB){
	return {
		/*
		 * Sometimes you may want to do some validation or other logic prior
		 * to submitting a search for results. This is used in the GRIN project
		 * to handle gNOME variant spec queries which are not searchable.
		 * 
		 * This should be a function that takes a JavaScript key event as it's only parameter.
		 */
		enterKeyHandler : undefined,

        showSearchResult : undefined
	};
});