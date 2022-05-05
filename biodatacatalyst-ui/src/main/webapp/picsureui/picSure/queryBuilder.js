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

	let getDefaultQueryTemplate = function(){
		return queryTemplate;
	}


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


	return {
		createQueryNew:createQueryNew,
		generateQueryNew: generateQueryNew,
		updateConsentFilters: updateConsentFilters,
	}
});
