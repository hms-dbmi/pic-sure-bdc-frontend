define(["picSure/queryBuilder", "filter/filter", "jquery"],  function(queryBuilder, filter, $) {
	jasmine.pp = function(obj){return JSON.stringify(obj, undefined, 2);};
	describe("queryBuilder", function() {
		describe("as a module", function(){
			it("is an object with a function called createQuery", function(){
				expect(typeof queryBuilder.createQuery).toEqual("function");
			});
		});
		
		it("generates a properly formed simple query", function() {
			var expectedQuery = 
			{
					resourceUUID: "02e23f52-f354-4e8b-992c-d37c8b9ba140",
					    query: {
					  "categoryFilters": {},
					  "numericFilters": {},
					  "requiredFields": [
					    "Asthma"
					  ],
					  "anyRecordOf": [],
					  "variantInfoFilters": [
					    {
					      "categoryVariantInfoFilters": {},
					      "numericVariantInfoFilters": {}
					    }
					  ],
					  "expectedResultType": "COUNT"
					}
			}
			expect(queryBuilder.createQuery([new filter.Model({inclusive:true, searchTerm: "Asthma", and: false,theList:null})])).toEqual(expectedQuery);
		});
		
	});
});