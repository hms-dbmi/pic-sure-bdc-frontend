define(["jquery", "backbone", "handlebars", "text!search-interface/visualization-modal-view.hbs", "search-interface/filter-model", "picSure/queryBuilder", "text!search-interface/visualization-image-partial.hbs", "picSure/settings", "common/spinner"],
function($, BB, HBS, template, filterModel, queryBuilder, imageTemplate, settings, spinner) {
    var defaultModel = BB.Model.extend({
		defaults: {
			spinnerClasses: "spinner-medium spinner-medium-center ",
			spinning: false,
            numParticipants: 0,
            numVariables: 0,
            numData: 0,
            viusalizations: [],
		}
	});
    var visualizationModalView = BB.View.extend({
        initialize: function(){
            this.data = {};
            this.template = HBS.compile(template);
            HBS.registerPartial("visualization-image-partial", imageTemplate);
            this.getImages();
            this.updateExport();
            //this.getInfo();
        },
        events: {
            'click #package-data' : 'openPackageData',
        },
        getInfo: function() {
            $.ajax({
				url: window.location.origin + '/picsure/info/ca0ad4a9-130a-3a8a-ae00-e35b07f1108b',
				type: 'POST',
				contentType: 'application/json',
				success: function(response){
                    console.log(response);
                }.bind(this),
				error: function(response){
					console.error(response);
				}.bind(this)
			});
        },
        updateExport() {
            this.model.set('numParticipants', filterModel.get("totalPatients"));
            this.model.set('numVariables', filterModel.get("totalVariables"));
            this.model.set('numVariables', filterModel.get("estDataPoints"));
        },
        getImages: function(){
            let query = queryBuilder.createQueryNew(filterModel.get("activeFilters").toJSON(), {}, "ca0ad4a9-130a-3a8a-ae00-e35b07f1108b");
            query.resourceCredentials = {"Authorization" : "Bearer " + JSON.parse(sessionStorage.getItem("session")).token};
            queryBuilder.updateConsentFilters(query, settings);
            //$('#images-spinner-holder').html(spinner.getSpinner());
            //let data = JSON.parse(imageJson);
            this.model.set('spinning', true);
            let deferredResults = $.ajax({
				url: window.location.origin + '/picsure/query/sync',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(query),
				success: function(response){
                    this.model.set('visualizations', response);
                    this.model.set('spinning', false);
                    this.render();
                }.bind(this),
				error: function(response){
                    this.model.set('spinning', false);
                    console.error("Viusalzation failed with query: " + JSON.stringify(query));
					console.error(response);
				}.bind(this)
			});
        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });
    return {
        View: visualizationModalView, 
        Model: defaultModel,
    };
});
