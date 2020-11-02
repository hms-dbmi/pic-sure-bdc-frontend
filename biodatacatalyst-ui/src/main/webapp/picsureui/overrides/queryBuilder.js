define(["jquery"], function($){
	return {
		
		/*
		 * A function to perform the inital population of the data export tree
		 */
		updateConsentFilters : function(query, settings) {
			
			
			console.log("update filters for query "  + query)
			
			parsedSettings = JSON.parse(settings);
			
			if(query.query.categoryFilters[parsedSettings.harmonizedPath] == undefined){
				console.log("removing harmonized consents");
				query.query.categoryFilters[parsedSettings.harmonizedConsentPath] = undefined;
			}
			
			
			topmedPresent = false;
			infoColumns = ["one", "two"];
			for(column in infoColumns){
				if(query.query.categoryFilters[column] != undefined){
					topmedPresent = true;
					break;
				}
			}
			
			if(query.query.variantInfoFilters[0].numericVariantInfoFilters.length == 0){
				topmedPresent = true;
			}
			
			if(query.query.variantInfoFilters[0].categoryVariantInfoFilters.length == 0){
				topmedPresent = true;
			}
			
			if(!topmedPresent){
				query.query.categoryFilters[parsedSettings.topmedConsentPath] = undefined;
			}
			
	    }
	};
});
