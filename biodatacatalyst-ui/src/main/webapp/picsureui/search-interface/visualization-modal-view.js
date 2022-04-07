define(["jquery", "backbone", "handlebars", "text!search-interface/visualization-modal-view.hbs", "search-interface/filter-model", "picSure/queryBuilder", "text!search-interface/visualization-image-partial.hbs", "picSure/settings", "common/spinner"],
function($, BB, HBS, template, filterModel, queryBuilder, imageTemplate, settings, spinner) {
    var visualizationModalView = BB.View.extend({
        initialize: function(opts){
            this.template = HBS.compile(template);
            HBS.registerPartial("visualization-image-partial", imageTemplate);
            this.getImages();
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
        getImages: function(){
            let query = queryBuilder.createQueryNew(filterModel.get("activeFilters").toJSON(), "ca0ad4a9-130a-3a8a-ae00-e35b07f1108b");
            query.resourceCredentials = {"Authorization" : "Bearer " + JSON.parse(sessionStorage.getItem("session")).token};
            queryBuilder.updateConsentFilters(query, settings);
            //$('#images-spinner-holder').html(spinner.getSpinner());
            //let data = JSON.parse(imageJson);
            let deferredResults = $.ajax({
				url: window.location.origin + '/picsure/query/sync',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(query),
				success: function(response){
                    this.images = response;
                    this.render();
                }.bind(this),
				error: function(response){
                    console.error("Viusalzation failed with query: " + JSON.stringify(query));
					console.error(response);
				}.bind(this)
			});
            spinner.medium(deferredResults, "#images-spinner-holder", "spinner1");
        },
        render: function() {
            this.$el.html(this.template(this.images));
            return this;
        }
    });
    return visualizationModalView;
});
