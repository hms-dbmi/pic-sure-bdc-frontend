define([], function(){
	return {
		/*
		 * Override the ordering of search results
		 */
		orderResults : function(searchterm, a, b){
			var aValue = a.value.toLowerCase();
			var bValue = b.value.toLowerCase();
			var aOrder = 0;
			var bOrder = 0;
			
			var lastIndexTermA = aValue.lastIndexOf(searchterm);
			var lastIndexSeparatorA = aValue.lastIndexOf("\\");
			
			while(lastIndexTermA < lastIndexSeparatorA  && lastIndexSeparatorA >= 0){
				aOrder +=1000;
				lastIndexSeparatorA = aValue.substring(0, lastIndexSeparatorA).lastIndexOf("\\");
			}
			
			var lastIndexTermB = bValue.lastIndexOf(searchterm);
			var lastIndexSeparatorB = bValue.lastIndexOf("\\");
			while(lastIndexTermB < lastIndexSeparatorB  && lastIndexSeparatorB >= 0){
				bOrder +=1000;
				lastIndexSeparatorB = aValue.substring(0, lastIndexSeparatorB).lastIndexOf("\\");
			}
				
	        return aOrder - bOrder;
	    }	
	};
});