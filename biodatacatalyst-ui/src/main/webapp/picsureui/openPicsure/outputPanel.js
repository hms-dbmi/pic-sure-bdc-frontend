define(["jquery", "text!../settings/settings.json", "text!openPicsure/outputPanel.hbs","picSure/resourceMeta", "backbone", "handlebars", "overrides/outputPanel", "text!../studyAccess/studies-data.json", "common/transportErrors"],
		function($, settings, outputTemplate, resourceMeta, BB, HBS, overrides, studiesData, transportErrors){

	
	// build the studies display info
	studiesData = JSON.parse(studiesData).bio_data_catalyst;
	var studiesInfo = {};
	_.uniq(studiesData.map((x) => { return x.abbreviated_name + ' (' + x.study_identifier + ')'; })).forEach((y) => { studiesInfo[y] = {code:y, name:"", study_matches: 0, consents:[]}; });
	studiesData.forEach((x) => {
		var temp = studiesInfo[x.abbreviated_name + ' (' + x.study_identifier + ')'];
		temp.name = x.full_study_name;
		temp.study_type = x.study_type;
		temp.request_access = x.request_access;
		temp.identifier = x.study_identifier;

		x.study_matches = x.clinical_sample_size;
		var t = x.consent_group_name;
		if (t.lastIndexOf('(') === -1 && t.length > 10) {
			x.short_title = '(withdrawn)';
		} else {
			x.short_title = t.substring(t.lastIndexOf("(")).replace('(','').replace(')','');
			temp.study_matches += x.clinical_sample_size;
		}
		if (x.consent_group_code !== 'c0') temp.consents.push(x);
	});

	var outputModelDefaults = {
			totalPatients : 0,
			spinnerClasses: "spinner-medium spinner-medium-center ",
			spinning: false,
			studies: studiesInfo,
			resources : {}
	};
	
	_.each(resourceMeta, (resource) => {
		outputModelDefaults.resources[resource.id] = {
				id: resource.id,
				name: resource.name,
				patientCount: 0,
				spinnerClasses: "spinner-center ",
				spinning: false
		};
	});
	var outputModel = BB.Model.extend({
		defaults: outputModelDefaults,
		spinAll: function(){
			this.set('spinning', true);
			this.set('queryRan', false);
		}
	});

	var outputView = BB.View.extend({
		initialize: function(){
			this.template = HBS.compile(outputTemplate);
			overrides.renderOverride ? this.render = overrides.renderOverride.bind(this) : undefined;
			overrides.update ? this.update = overrides.update.bind(this) : undefined;
			HBS.registerHelper("outputPanel_obfuscate", function(count){
				if(count < 10 && false){
					return "< 10";
				} else {
					return count;
				}
			});
		},
		events:{
			"click .study-glyph": "toggleConsentGroup",
			"click .consent-grouping": "toggleConsentGroup",
			"keypress .consent-grouping": "keyToggleConsentGroup",
			"mouseover .request-access": "highlightConsent",
			"mouseout .request-access": "unhighlightConsent",
			"keypress .request-access": "keyRequestAccess",
			"click .request-access": "requestAccess"
		},
		keyToggleConsentGroup: function(event) {
			if (event.key === "Enter") this.toggleConsentGroup(event);
		},
		toggleConsentGroup: function(event) {
			var studyRoot = event.currentTarget.parentElement.parentElement;
			$(studyRoot).toggleClass("study-shown");
			var glyph = $('.study-glyph', studyRoot); 
			glyph.toggleClass("glyphicon-chevron-up");
			glyph.toggleClass("glyphicon-chevron-down");
		},
		highlightConsent: function(event) {
			event.currentTarget.parentElement.style.background = "#ddd";
		},
		unhighlightConsent: function(event) {
			event.currentTarget.parentElement.style.background = "";
		},
		keyRequestAccess: function(event) {
			if (event.key === "Enter") this.requestAccess(event);
		},
		requestAccess: function(event) {
			window.open(event.currentTarget.getAttribute("data-href"));
		},
		totalCount: 0,
		tagName: "div",
		update: function(incomingQuery){

			// clear counts
			for (var x in studiesInfo) {
				studiesInfo[x].study_matches = "--";
			}
			this.model.set("totalPatients",0);
			this.model.spinAll();
			this.render();

			// make safe deep copies of the incoming query so we don't modify it
			var query = JSON.parse(JSON.stringify(incomingQuery));
			query.resourceCredentials = {};
			query.query.expectedResultType="COUNT";
			this.model.set("query", query);

			// query for total count
			$.ajax({
			 	url: window.location.origin + "/picsure/query/sync",
			 	type: 'POST',
			 	headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
			 	contentType: 'application/json',
			 	data: JSON.stringify(query),
				dataType: "text",
			 	success: (function(response){
					this.model.set("totalPatients", response);
					this.model.set("spinning", false);
					this.model.set("queryRan", true);
					this.render();
			 	}).bind(this),
				error: function(response, message) {
					transportErrors.handleAll(response, message);
					this.model.set("spinning", false);
					this.model.set("queryRan", true);
					this.render();
				}
			});


			// get a list of all study concept paths
			$.ajax({
			 	url: window.location.origin + "/picsure/search/" + incomingQuery.resourceUUID,
			 	type: 'POST',
			 	headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
			 	contentType: 'application/json',
			 	data: JSON.stringify({"query":"\\_studies\\"}),
				success:(function(response) {
					// copy the study_concepts to the study records
					var studyConcepts = _.allKeys(response.results.phenotypes);
					for (var code in studiesInfo) {
						studiesInfo[code].study_concept = _.find(studyConcepts, (x) => { return x.indexOf(studiesInfo[code].identifier) > -1 });
					}

					// query for the studies counts
					var queryStudies = JSON.parse(JSON.stringify(incomingQuery));
					queryStudies.query.crossCountFields = _.allKeys(response.results.phenotypes);
					queryStudies.query.expectedResultType="CROSS_COUNT";

					$.ajax({
					 	url: window.location.origin + "/picsure/query/sync",
			 			type: 'POST',
					 	headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
					 	contentType: 'application/json',
					 	data: JSON.stringify(queryStudies),
						success: (function(response) {
							// populate counts and sort
							var sorted_found = [];
							var sorted_unfound = [];
							for (var x in studiesInfo) {
								var cnt = response[studiesInfo[x].study_concept];
								if (cnt.indexOf("<") > -1) {
									studiesInfo[x].study_matches = cnt;
									cnt = 1;
								} else {
									studiesInfo[x].study_matches = cnt;
								}
								if (cnt > 0) {
									sorted_found.push(studiesInfo[x]);
								} else {
									sorted_unfound.push(studiesInfo[x]);
								}
							}

							// perform additional sort
							var func_sort = function(a,b) { return a.code.localeCompare(b.code); };
							sorted_found = _.sortBy(sorted_found, func_sort);
							sorted_unfound = _.sortBy(sorted_unfound, func_sort);
							var sorted_final = sorted_found.concat(sorted_unfound);

							this.model.set("studies",sorted_final);
							this.render();
						}).bind(this),
						error: (function(response) {
							for (var x in studiesInfo) {
								studiesInfo[x].study_matches = "(error)";
							}
							this.render();
						}).bind(this)
					});

				}).bind(this),
				error: (function(response) {
					alert("Could not get list of studies!");
				}).bind(this)
			});



			// get a list of all _study_consent concept paths
			var study_consent_concepts = [];
			for (var code in studiesInfo) {
				studiesInfo[code].consents.forEach((x) => {
					study_consent_concepts.push("\\_studies_consents\\" + x.study_identifier + "." + x.consent_group_code + "\\");
				});
			}

			// query for the studies consents counts
			var queryStudies = JSON.parse(JSON.stringify(incomingQuery));
			queryStudies.query.crossCountFields = study_consent_concepts;
			queryStudies.query.expectedResultType="CROSS_COUNT";

			$.ajax({
				url: window.location.origin + "/picsure/query/sync",
				type: 'POST',
				headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
				contentType: 'application/json',
				data: JSON.stringify(queryStudies),
				success: (function(response) {
					// populate the study consent counts
					for (var code in studiesInfo) {
						studiesInfo[code].consents.forEach((x) => {
							x.study_matches = response["\\_studies_consents\\" + x.study_identifier + "." + x.consent_group_code + "\\"];
						});
					}
					this.render();
				}).bind(this),
				error: (function(response) {
					for (var code in studiesInfo) {
						studiesInfo[code].consents.forEach((x) => {
							x.study_matches = "(error)";
						});
					}
					this.render();
				}).bind(this)
			});



		},
		render: function(){
			var context = this.model.toJSON();
			this.$el.html(this.template(Object.assign({}, context, overrides)));
		}
	});
	
	
	return {
		View : (overrides.viewOverride ? overrides.viewOverride : outputView),
		Model: (overrides.modelOverride ? overrides.modelOverride : outputModel)
	}
});
