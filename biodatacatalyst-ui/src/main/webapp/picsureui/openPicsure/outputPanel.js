define(["jquery", "text!../settings/settings.json", "text!openPicsure/outputPanel.hbs","picSure/resourceMeta", "backbone", "handlebars", "overrides/outputPanel", "text!../studyAccess/studies-data.json"],
		function($, settings, outputTemplate, resourceMeta, BB, HBS, overrides, studiesData){

	
	// build the studies display info
	studiesData = JSON.parse(studiesData).bio_data_catalyst;	
	var studiesInfo = {};
	_.uniq(studiesData.map((x) => { return x.abbreviated_name + ' (' + x.study_identifier + ')'; })).forEach((y) => { studiesInfo[y] = {code:y, name:"", study_matches: 0, consents:[]}; });
	studiesData.forEach((x) => {
		var temp = studiesInfo[x.abbreviated_name + ' (' + x.study_identifier + ')'];
		temp.name = x.full_study_name;
		temp.study_type = x.study_type;
		temp.request_access = x.request_access;
		temp.study_concept = "\\_studies\\" + temp.name + " ( " + x.study_identifier + " )\\"; 

		x.study_matches = x.clinical_sample_size.toLocaleString();
		var t = x.consent_group_name;
		if (t.lastIndexOf('(') === -1) {
			x.short_title = '(withdrawn)';
		} else {
			x.short_title = t.substring(t.lastIndexOf("(")).replace('(','').replace(')','');
			temp.study_matches += x.clinical_sample_size;
		}
		if (x.consent_group_code !== 'c0') temp.consents.push(x);
	});
	for (var idx in studiesInfo) {
		studiesInfo[idx].study_matches = studiesInfo[idx].study_matches.toLocaleString(); 
	}

	

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
			 	success: (function(response){
					this.model.set("totalPatients", parseInt(response).toLocaleString());
					this.model.set("spinning", false);
					this.model.set("queryRan", true);
					this.render();
			 	}).bind(this),
			 	error: (function(response){
					if (response.status === 401) {
						history.pushState({}, "", "/psamaui/not_authorized");
					} else {
						this.model.set("spinning", false);
        		                        this.model.set("queryRan", true);

						// handle return of "< 10" response
						if (response.responseText.indexOf("<") > -1) {
							this.model.set("totalPatients", response.responseText);
	               				        this.render();
						} else {
							response.responseText = "<h4>"
							+ overrides.outputErrorMessage ? overrides.outputErrorMessage : "There is something wrong when processing your query, please try it later, if this repeats, please contact admin."
							+ "</h4>";
	               				        this.render();
							$("#patient-count").html(response.responseText);
						}
					}
				}).bind(this)
			});


			// query for the studies counts
			var queryStudies = JSON.parse(JSON.stringify(incomingQuery));
			queryStudies.query.crossCountFields = [];
			for (var x in studiesInfo) { 
				queryStudies.query.crossCountFields.push(studiesInfo[x].study_concept);
			}
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
							studiesInfo[x].study_matches = parseInt(cnt).toLocaleString();
						}
						if (cnt > 0) {
							sorted_found.push(studiesInfo[x]);
						} else {
							sorted_unfound.push(studiesInfo[x]);
						}
					}

					// perform additional sort
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


		},
		render: function(){
			var context = this.model.toJSON();
			// reorder the studies
			 context.studies
			this.$el.html(this.template(Object.assign({}, context, overrides)));
		}
	});
	
	
	return {
		View : (overrides.viewOverride ? overrides.viewOverride : outputView),
		Model: (overrides.modelOverride ? overrides.modelOverride : outputModel)
	}
});
