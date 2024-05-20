define(["jquery", "underscore", "picSure/settings", "text!openPicsure/outputPanel.hbs",
		"backbone", "handlebars", "overrides/outputPanel", "text!../studyAccess/studies-data.json", "common/transportErrors", "openPicsure/outputModel", "search-interface/filter-model", "common/modal", "openPicsure/openPicsureHelpView"],
		function($, _, settings, outputTemplate,
				 BB, HBS, overrides, studiesDataJson, transportErrors, outputModel, filterModel, modal, helpView) {

	let studiesInfo = {};
	var studyConcepts = [];
	var conceptsLoaded = $.Deferred();

	var generateStudiesInfoKey = function(abbreviatedName, studyIdentifier) {
		return abbreviatedName + ' (' + studyIdentifier + ')';
	};

	var loadConcepts = function() {
		$.ajax({
			url: window.location.origin + "/picsure/search/" + settings.openAccessResourceId,
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
					let studyName = x.split("\\")[2].split(" ")[0];
					studiesInfo[studyName] = {code:studyName, name:"", study_matches: 0, consents:[]}
				});

				let studiesData = JSON.parse(studiesDataJson).bio_data_catalyst;
				studiesData.forEach((studyRecord) => {
					var temp = studiesInfo[studyRecord.study_identifier];
					if (!temp) {
						temp = studiesInfo[studyRecord.abbreviated_name.toUpperCase()]
					}
					if (temp) {
						temp.display_name = generateStudiesInfoKey(studyRecord.abbreviated_name, studyRecord.study_identifier);
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
				let consent = x.consent_group_code && x.consent_group_code != "" ? "." + x.consent_group_code : "";
                x.hasPermission = validConsents.includes(x.study_identifier + consent);
            });
            studiesInfo[key].hasPermission = studiesInfo[key].consents.filter((x) => { return x.hasPermission}).length == studiesInfo[key].consents.length;
        }
    };

			var doUpdate = function(incomingQuery) {
		if (JSON.parse(sessionStorage.getItem('isOpenAccess')) === true) {
			// clear counts
			for (var x in studiesInfo) {
				studiesInfo[x].study_matches = "--";
			}
			outputModel.set("totalPatients",0);
			outputModel.spinAll();
			this.render();

			// make safe deep copies of the incoming query so we don't modify it
			var query = JSON.parse(JSON.stringify(incomingQuery));
			query.resourceCredentials = {};
			query.query.expectedResultType="COUNT";
			outputModel.set("query", query);

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
					let totalPatients = String(response["\\_studies_consents\\"]);
					if (totalPatients.includes(" \u00B1")) {
						outputModel.set("totalPatients", totalPatients.split(" ")[0]);
						filterModel.set("totalPatients", totalPatients.split(" ")[0]);
						outputModel.set("totalPatientsSuffix", totalPatients.split(" ")[1]);
					} else {
						outputModel.set("totalPatients", totalPatients);
						filterModel.set("totalPatients", totalPatients);
						outputModel.set("totalPatientsSuffix", "");
					}
					outputModel.stopAll();
					this.render();

					// populate counts and sort
					var sorted_found = [];
					var sorted_unfound = [];
					for (var x in studiesInfo) {
						let cnt = String(response[studiesInfo[x].study_concept]);
						if (cnt) {
							studiesInfo[x].study_matches = String(cnt);
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

					// populate the study consent counts
					for (var code in studiesInfo) {
						studiesInfo[code].consents.forEach((x) => {
							x.study_matches = response[studiesInfo[code].study_concept + x.short_title + '\\'];
						});
					}
					outputModel.set("studies",sorted_final);
					this.toolSuiteView.render();
					this.render();
				}).bind(this),
				error: (function(response) {
					for (var x in studiesInfo) {
						studiesInfo[x].study_matches = "(error)";
					}
					outputModel.stopAll();
					const message = '<div class="error-text-box">' +
						overrides.outputErrorMessage ? 
							overrides.outputErrorMessage : 
							"There is something wrong when processing your query, please try it later, if this repeats, please contact admin." +
            "</div>";
					$("#patient-count").html(message);

					this.toolSuiteView.render();
					this.render();
				}).bind(this)
			});
		}
	};

	var outputView = BB.View.extend({
		initialize: function(opts){
			this.template = HBS.compile(outputTemplate);
			this.helpView = new helpView();
			this.toolSuiteView = opts.toolSuiteView;
			loadConcepts();
			Backbone.pubSub.on('destroySearchView', this.destroy.bind(this));
		},
		events:{
			"click .study-glyph": "toggleConsentGroup",
			"click .consent-grouping": "toggleConsentGroup",
			"keypress .consent-grouping": "keyToggleConsentGroup",
			"mouseover .request-access": "highlightConsent",
			"mouseout .request-access": "unhighlightConsent",
			"keypress .request-access": "keyRequestAccess",
			"click .request-access": "requestAccess",
            "click .explore-access": "exploreAccess",
			"click #open-access-output-help": "openHelpModal",
			"keypress #open-access-output-help": "openHelpModal",
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
		openHelpModal: function(event) {
			if (event.type === "keypress" && !(event.key === ' ' || event.key === 'Enter')) {
				return;
			}
			modal.displayModal(
                this.helpView,
                'Data Summary Help',
                () => {
                    $('#patient-count-box').focus();
                }, {isHandleTabs: true}
            );
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
		destroy: function(){
			this.undelegateEvents();	
			$(this.el).removeData().unbind(); 
			this.remove();  
			Backbone.View.prototype.remove.call(this);
		},
		render: function(){
			var context = outputModel.toJSON();
			this.$el.html(this.template(Object.assign({}, context, overrides)));
		}
	});
	
	
	return {
		View : (overrides.viewOverride ? overrides.viewOverride : outputView),
		Model: (overrides.modelOverride ? overrides.modelOverride : outputModel)
	};
});
