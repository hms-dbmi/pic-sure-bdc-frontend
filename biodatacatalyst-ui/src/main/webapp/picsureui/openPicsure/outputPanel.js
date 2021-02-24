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
			this.model.set("totalPatients",0);

			this.model.spinAll();
			this.render();

			// make a safe deep copy of the incoming query so we don't modify it
			var query = JSON.parse(JSON.stringify(incomingQuery));
			query.resourceCredentials = {};
			query.query.expectedResultType="COUNT";
			this.model.set("query", query);

			var dataCallback = function(result){
				this.model.set("totalPatients", parseInt(result));
				this.model.set("spinning", false);
				this.model.set("queryRan", true);
				this.render();
			}.bind(this);

			var errorCallback = function(message){
				this.model.set("spinning", false);
                                        this.model.set("queryRan", true);
                                        this.render();
				$("#patient-count").html(message);
			}.bind(this);

			$.ajax({
			 	url: window.location.origin + "/picsure/query/sync",
			 	type: 'POST',
			 	headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
			 	contentType: 'application/json',
			 	data: JSON.stringify(query),
			 	success: function(response){
			 		dataCallback(response);
			 	},
			 	error: function(response){
					if (response.status === 401) {
						sessionStorage.clear();
						window.location = "/";
					} else {
						response.responseText = "<h4>"
							+ overrides.outputErrorMessage ? overrides.outputErrorMessage : "There is something wrong when processing your query, please try it later, if this repeats, please contact admin."
							+ "</h4>";
				 		errorCallback(response.responseText);//console.log("error");console.log(response);
					}
				}
			});
		},
		render: function(){
			var context = this.model.toJSON();
			this.$el.html(this.template(Object.assign({},context , overrides)));
		}
	});
	
	
	return {
		View : new (overrides.viewOverride ? overrides.viewOverride : outputView)({
			model: new (overrides.modelOverride ? overrides.modelOverride : outputModel)()
		})
	}
});
