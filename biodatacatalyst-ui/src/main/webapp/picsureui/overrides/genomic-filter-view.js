define(['search-interface/filter-model',], function(filterModel){
	return {
		/*
		 * Override how the genomic filters are applied.
		 */
		applyGenomicFilters : function(view){
            let filtersForQuery = {
                categoryVariantInfoFilters: view.data.categoryVariantInfoFilters,
                numericVariantInfoFilters: {}
            };
            //this.createUniqueId(filtersForQuery); uncomment to support multiple filters
            filterModel.addGenomicFilter(filtersForQuery, this.previousUniqueId);
            view.cancelGenomicFilters();
        },
	};
});
