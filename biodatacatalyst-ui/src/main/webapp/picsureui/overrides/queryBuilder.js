define(["jquery"], function($){
	return {
		
		/*
		 * A function to perform the inital population of the data export tree
		 */
		updateConsentFilters : function(query, settings) {
			
			
			console.log("update consent filters for query "  + query)
			
			parsedSettings = JSON.parse(settings);
			
			
			if(_.filter(_.keys(query.query.categoryFilters), function(concept) {
				    return concept.includes(parsedSettings.harmonizedPath);
				}).length == 0 &&  
				_.filter(_.keys(query.query.numericFilters), function(concept) {
				    return concept.includes(parsedSettings.harmonizedPath);
				}).length  == 0
			){
				console.log("removing harmonized consents");
				query.query.categoryFilters[parsedSettings.harmonizedConsentPath] = undefined;
			}
			
			
			topmedPresent = false;
			
			if(_.keys(query.query.variantInfoFilters[0].numericVariantInfoFilters).length > 0){
				topmedPresent = true;
			}
			
			if(_.keys(query.query.variantInfoFilters[0].categoryVariantInfoFilters).length > 0){
				topmedPresent = true;
			}
			
			if(!topmedPresent){
				console.log("removing Topmed consents");
				query.query.categoryFilters[parsedSettings.topmedConsentPath] = undefined;
			}
			
	    }
	};
});
