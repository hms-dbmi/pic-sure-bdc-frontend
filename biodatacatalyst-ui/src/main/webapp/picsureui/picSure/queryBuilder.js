define(["underscore", "picSure/settings"],
		function(_, settings){

    var queryTemplate = {
        categoryFilters: {},
        numericFilters:{},
        requiredFields:[],
        anyRecordOf:[],
        variantInfoFilters:[
            {
                categoryVariantInfoFilters:{},
                numericVariantInfoFilters:{}
            }
        ],
        expectedResultType: "COUNT"
    };

	var createQuery = function(filters, resourceUUID){
		var parsedSess = JSON.parse(sessionStorage.getItem("session"));
		if(parsedSess.queryTemplate){
			return generateQuery(filters,JSON.parse(parsedSess.queryTemplate), resourceUUID);
		} else {
			return generateQuery(filters,JSON.parse(JSON.stringify(queryTemplate)), resourceUUID);
		}
	};

	var createQueryNew = function(filters, exportFields, resourceUUID){
		var parsedSess = JSON.parse(sessionStorage.getItem("session"));
		if(parsedSess.queryTemplate && resourceUUID !== settings.openAccessResourceId){
			return generateQueryNew(filters,exportFields,JSON.parse(parsedSess.queryTemplate), resourceUUID);
		} else {
			return generateQueryNew(filters,exportFields,JSON.parse(JSON.stringify(queryTemplate)), resourceUUID);
		}
	};

	let updateConsentFilters = function(query, settings) {
		console.log("update consent filters for query "  + query);

		if(_.filter(_.keys(query.query.categoryFilters), function(concept) {
				return concept.includes(settings.harmonizedPath);
			}).length == 0 &&
			_.filter(_.keys(query.query.numericFilters), function(concept) {
				return concept.includes(settings.harmonizedPath);
			}).length  == 0 &&
			_.filter(query.query.fields, function(concept) {
				return concept.includes(settings.harmonizedPath);
			}).length  == 0 &&
			_.filter(query.query.requiredFields, function(concept) {
				return concept.includes(settings.harmonizedPath);
			}).length  == 0
		){
//				console.log("removing harmonized consents");
			delete query.query.categoryFilters[settings.harmonizedConsentPath];
		}


		topmedPresent = false;

		if(_.keys(query.query.variantInfoFilters[0].numericVariantInfoFilters).length > 0){
			topmedPresent = true;
		}

		if(_.keys(query.query.variantInfoFilters[0].categoryVariantInfoFilters).length > 0){
			topmedPresent = true;
		}

		if(!topmedPresent){
//				console.log("removing Topmed consents");
			delete query.query.categoryFilters[settings.topmedConsentPath];
		}

	};

	var generateQueryNew = function(filters, exportFields, template, resourceUUID) {
		if (!template)
			template = queryTemplate;

		var query = {
			resourceUUID: resourceUUID,
			query:  JSON.parse(JSON.stringify(template))};

		if (Array.isArray(query.query.expectedResultType)) {
			query.query.expectedResultType = "COUNT";
		}

		_.each(exportFields, function(field){
			query.query.fields.push(field.metadata.columnmeta_HPDS_PATH);
		});

		_.each(filters, function(filter){
			if(filter.type==="required"){
				query.query.requiredFields.push(filter.searchResult.result.metadata.columnmeta_HPDS_PATH);
			}else if(filter.type==="category"){
				query.query.categoryFilters[filter.searchResult.result.metadata.columnmeta_HPDS_PATH]=filter.values;
			}else if(filter.type==="numeric"){
				query.query.numericFilters[filter.searchResult.result.metadata.columnmeta_HPDS_PATH]={min:filter.min, max:filter.max};
			}else if (filter.type==='genomic'){
				if (query.query.variantInfoFilters.length && _.isEmpty(query.query.variantInfoFilters[0].categoryVariantInfoFilters)) {
					query.query.variantInfoFilters[0].categoryVariantInfoFilters = filter.variantInfoFilters.categoryVariantInfoFilters;
				} else {
					query.query.variantInfoFilters.push(filter.variantInfoFilters);
				}
			}else if(filter.type==="datatable"){
				if(query.query.anyRecordOf===undefined){
					query.query.anyRecordOf = [];
				}
				query.query.anyRecordOf = query.query.anyRecordOf.concat(_.map(filter.variables, (variable)=>{return variable[7];}));
			}
		});
		//this.updateConsentFilters(query, settings);
		return query;
	};

	var generateQuery = function(filters, template, resourceUUID) {
		if (!template)
			template = queryTemplate;

		var query = {
			resourceUUID: resourceUUID,
			query:  JSON.parse(JSON.stringify(template))};

		if (Array.isArray(query.query.expectedResultType)) {
			query.query.expectedResultType = "COUNT";
		}

		_.each(filters, function(filter){
			if(filter.get("searchTerm").trim().length !== 0){
				if ( filter.attributes.valueType === "ANYRECORDOF" ){
                    //any record of filter should just pull the list of observations  and stuff them in the list.
					if(query.query.anyRecordOf){
						query.query.anyRecordOf = query.query.anyRecordOf.concat(filter.get("anyRecordCategories"))
					} else {
						query.query.anyRecordOf = filter.get("anyRecordCategories");
					}
				} else if(filter.attributes.constrainByValue || filter.get("constrainParams").get("constrainByValue")){
					if(filter.attributes.valueType==="INFO"){
						if ( ! query.query.variantInfoFilters[0] ){
							query.query.variantInfoFilters.push({
								categoryVariantInfoFilters:{},
								numericVariantInfoFilters:{}
							    });
						}

						if( filter.get("constrainParams").get("metadata").continuous){
							query.query.variantInfoFilters[0].numericVariantInfoFilters[filter.attributes.category] =
							{
									min: filter.attributes.constrainParams.attributes.constrainValueOne,
									max: filter.attributes.constrainParams.attributes.constrainValueTwo
							}
						} else {
							query.query.variantInfoFilters[0].categoryVariantInfoFilters[filter.attributes.category] = filter.get("constrainParams").get("constrainValueOne");

						}
					} else if(filter.attributes.valueType==="NUMBER"){
						var one = filter.attributes.constrainParams.attributes.constrainValueOne;
						var two = filter.attributes.constrainParams.attributes.constrainValueTwo;
						var min, max;
						if(filter.attributes.constrainParams.attributes.valueOperator==="LT"){
							max = one;
						}else if(filter.attributes.constrainParams.attributes.valueOperator==="GT"){
							min = one;
						}else{
							min = one;
							max = two;
						}
						query.query.numericFilters[filter.get("searchTerm")] =
						{
								min: min,
								max: max
						}
					}else if(filter.attributes.valueType==="STR"){
						if(filter.get("constrainParams").get("constrainValueOne")==="Any Value"
							|| filter.get("constrainParams").get("constrainValueOne").length == 0){
							query.query.requiredFields.push(filter.get("searchTerm"));
						}else{
							//Categorical filters are already an array
							if ( filter.get("constrainParams").get("columnDataType") == "CATEGORICAL" ){
								query.query.categoryFilters[filter.get("searchTerm")] = filter.get("constrainParams").get("constrainValueOne");
							} else{
								query.query.categoryFilters[filter.get("searchTerm")] = [filter.get("constrainParams").get("constrainValueOne")];
							}
						}
					}else if(filter.attributes.valueType==="VARIANT"){
						var zygosities = [];
						query.query.categoryFilters[filter.get("constrainParams").get("constrainValueOne").split(/[:_/]/).join(",")] = zygosities;
						var zygosityText = filter.get("constrainParams").get("constrainValueTwo").trim();
						if(zygosityText.includes("Homozygous")){
							zygosities.push("1/1");
						}
						if(zygosityText.includes("Heterozygous")){
							zygosities.push("0/1");
						}
						if(zygosityText.includes("Exclude Variant")){
							zygosities.push("0/0");
						}
					}
				} else if (filter.attributes.valueType==="NUMBER") {
					query.query.requiredFields.push(filter.get("searchTerm"));
				}

			}
		});

		return query;
	};


	return {
		// TODO: update tests to test generateQuery and remove createQuery
		createQuery:createQuery,
		generateQuery: generateQuery,
		createQueryNew:createQueryNew,
		generateQueryNew: generateQueryNew,
		updateConsentFilters: updateConsentFilters,
	}
});
