define(["jquery", "text!../settings/settings.json", "text!openPicsure/outputPanel.hbs",
		"backbone", "handlebars", "overrides/outputPanel", "text!../studyAccess/studies-data.json", "common/transportErrors"],
		function($, settings, outputTemplate,
				 BB, HBS, overrides, studiesDataJson, transportErrors){

	var studiesInfo = {};
	var studyConcepts = [];
	var conceptsLoaded = $.Deferred();

	var generateStudiesInfoKey = function(abbreviatedName, studyIdentifier) {
		return abbreviatedName + ' (' + studyIdentifier + ')';
	}

	var loadConcepts = function() {
		$.ajax({
			url: window.location.origin + "/picsure/search/" + JSON.parse(settings).openAccessResourceId,
			type: 'POST',
			headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
			contentType: 'application/json',
			data: JSON.stringify({"query":"\\_studies_consents\\"}),
			success:(function(response) {
				// copy the study_concepts to the study records
				studyConcepts = _.allKeys(response.results.phenotypes);
				// i.e \\_studies_consents\\ORCHID\\
				// not \\_studies_consents\\ORCHID\\consent-group\\ or \\_studies_consents\\
				let studyKeys = _.filter(studyConcepts, x => {
					return x.split("\\").length === 4;
				});
				_.forEach(studyKeys, x => {
					let studyName = x.split("\\")[2];
					studiesInfo[studyName] = {code:studyName, name:"", study_matches: 0, consents:[]}
				})

				let studiesData = JSON.parse(studiesDataJson).bio_data_catalyst;
				studiesData.forEach((studyRecord) => {
					var temp = studiesInfo[generateStudiesInfoKey(studyRecord.abbreviated_name, studyRecord.study_identifier)];
					if (temp) {
						temp.name = studyRecord.full_study_name;
						temp.study_type = studyRecord.study_type;
						temp.request_access = studyRecord.request_access;
						temp.identifier = studyRecord.study_identifier;

						studyRecord.study_matches = studyRecord.clinical_sample_size;
						var t = studyRecord.consent_group_name;
						if (t.lastIndexOf('(') === -1 && t.length > 10) {
							studyRecord.short_title = '(withdrawn)';
						} else {
							studyRecord.short_title = t.substring(t.lastIndexOf("(")).replace('(','').replace(')','');
							temp.study_matches += studyRecord.clinical_sample_size;
						}
						if (studyRecord.consent_group_code !== 'c0') temp.consents.push(studyRecord);
					}
				});

				for (var code in studiesInfo) {
					studiesInfo[code].study_concept = "\\_studies_consents\\" + code + "\\";
				}

				processAccessablity();
				conceptsLoaded.resolve();
			}).bind(this),
			error: (function(response) {
				alert("Could not get list of studies!");
			}).bind(this)
		});
	}

	var processAccessablity = function() {
        // extract the consent identifiers that user has access to from the query template
        var session = JSON.parse(sessionStorage.getItem("session"));
        var validConsents = [];
        if (session.queryTemplate) {
            var temp = JSON.parse(session.queryTemplate);

            if (temp && temp.categoryFilters && temp.categoryFilters["\\_consents\\"]) {
                validConsents = temp.categoryFilters["\\_consents\\"];
            }
        }

        for (var key in studiesInfo) {
            studiesInfo[key].consents.forEach((x) => {
                x.hasPermission = validConsents.includes(x.study_identifier + "." + x.consent_group_code);
            });
            studiesInfo[key].hasPermission = studiesInfo[key].consents.filter((x) => { return x.hasPermission}).length == studiesInfo[key].consents.length;
        }
    }

    var doUpdate = function(incomingQuery) {
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

		// query for the studies counts
		var queryStudies = JSON.parse(JSON.stringify(incomingQuery));
		queryStudies.query.crossCountFields = studyConcepts;
		queryStudies.query.expectedResultType="CROSS_COUNT";

		$.ajax({
			url: window.location.origin + "/picsure/query/sync",
			type: 'POST',
			headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
			contentType: 'application/json',
			data: JSON.stringify(queryStudies),
			success: (function(response) {
				let totalPatients = response["\\_studies_consents\\"];
				if (totalPatients.includes(" \u00B1")) {
					this.model.set("totalPatients", totalPatients.split(" ")[0]);
					this.model.set("totalPatientsSuffix", totalPatients.split(" ")[1]);
				} else {
					this.model.set("totalPatients", totalPatients);
					this.model.set("totalPatientsSuffix", "");
				}
				this.model.set("spinning", false);
				this.model.set("queryRan", true);
				this.render();

				// populate counts and sort
				var sorted_found = [];
				var sorted_unfound = [];
				for (var x in studiesInfo) {
					var cnt = response[studiesInfo[x].study_concept];
					if (cnt) {
						studiesInfo[x].study_matches = cnt;
						if (cnt.includes("<") || cnt.includes("\u00B1") || cnt > 0) {
							sorted_found.push(studiesInfo[x]);
						} else {
							sorted_unfound.push(studiesInfo[x]);
						}
					}
				}

				// perform additional sort
				var func_sort = function(a,b) {
					let codeComparison = a.code.localeCompare(b.code, undefined, {sensitivity: 'base'});
					if (codeComparison === 0) {
						return a.identifier.localeCompare(b.identifier, undefined, {sensitivity: 'base'});
					}
					return codeComparison;
				};
				sorted_found.sort(func_sort);
				sorted_unfound.sort(func_sort);
				var sorted_final = sorted_found.concat(sorted_unfound);

				this.model.set("studies",sorted_final);

				// populate the study consent counts
				for (var code in studiesInfo) {
					studiesInfo[code].consents.forEach((x) => {
						// todo: remove consents if not found? or 0?
						// yes
						x.study_matches = response["\\_studies_consents\\" + x.abbreviated_name + ' (' + x.study_identifier + ')' + "\\" + x.short_title + "\\"];
					});
				}
				this.render();
			}).bind(this),
			error: (function(response) {
				for (var x in studiesInfo) {
					studiesInfo[x].study_matches = "(error)";
				}
				this.render();
			}).bind(this)
		});
	}

    var outputModelDefaults = {
			totalPatients : 0,
			spinnerClasses: "spinner-medium spinner-medium-center ",
			spinning: false,
			studies: studiesInfo,
			resources : {}
	};

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
			loadConcepts();
		},
		events:{
			"click .study-glyph": "toggleConsentGroup",
			"click .consent-grouping": "toggleConsentGroup",
			"keypress .consent-grouping": "keyToggleConsentGroup",
			"mouseover .request-access": "highlightConsent",
			"mouseout .request-access": "unhighlightConsent",
			"keypress .request-access": "keyRequestAccess",
			"click .request-access": "requestAccess",
            "click .explore-access": "exploreAccess"
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
        exploreAccess: function(event) {
            console.log("Explore study: " + $(event.target).data("study"));
            window.history.pushState({}, "", "picsureui/queryBuilder");
        },
		totalCount: 0,
		tagName: "div",
		runQuery: function(incomingQuery) {
			if (conceptsLoaded.state() === 'resolved') {
				doUpdate.bind(this)(incomingQuery);
			} else if (conceptsLoaded.state() === 'pending') {
				conceptsLoaded.done(doUpdate.bind(this, incomingQuery));
			} else {
				// ???
			}
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
