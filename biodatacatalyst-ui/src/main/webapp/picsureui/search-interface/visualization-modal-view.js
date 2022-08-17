define(["jquery", "backbone", "handlebars", "text!search-interface/visualization-modal-view.hbs", "search-interface/filter-model", "picSure/queryBuilder", "text!search-interface/visualization-image-partial.hbs", "picSure/settings", "common/spinner", "plotly"],
function($, BB, HBS, template, filterModel, queryBuilder, imageTemplate, settings, spinner, plotly) {
    let defaultModel = BB.Model.extend({
		defaults: {
			spinnerClasses: "spinner-medium spinner-medium-center ",
			spinning: false,
            viusalizations: [],
		}
	});
    const MAX_TITLE_LENGTH = 60;
    const bdcColors = ['#c31f3f', '#616265', '#f4f4f6', '#1a568C', '#12385a', '#41abf5', '#393939'];
    let defaultPlotlyConfig = {
        editable: true,
        toImageButtonOptions: {
            format: 'png' //png, svg, jpeg, webp
        },
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'sendDataToCloud']
    };
    let visualizationModalView = BB.View.extend({
        initialize: function(){
            this.data = {};
            this.data.traces = [];
            this.data.layouts = [];
            this.data.errors = [];
            this.config = defaultPlotlyConfig;
            this.template = HBS.compile(template);
            HBS.registerPartial("visualization-image-partial", imageTemplate);
            this.getImages();
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
            let query = queryBuilder.createQueryNew(filterModel.get("activeFilters").toJSON(), {}, "ca0ad4a9-130a-3a8a-ae00-e35b07f1108b");
            query.resourceCredentials = {"Authorization" : "Bearer " + JSON.parse(sessionStorage.getItem("session")).token};
            queryBuilder.updateConsentFilters(query, settings);
            this.model.set('spinning', true);
            let deferredResults = $.ajax({
				url: window.location.origin + '/picsure/query/sync',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(query),
				success: function(response){
                    this.model.set('categoricalData', response.categoricalData);
                    this.model.set('continuousData', response.continuousData);
                    this.model.set('spinning', false);
                    response.categoricalData && this.createCategoryPlot();
                    response.continuousData && this.createContinuousPlot();
                    this.render();
                }.bind(this),
				error: function(response){
                    this.model.set('spinning', false);
                    this.model.set('errors', response);
                    console.error("Viusalzation failed with query: " + JSON.stringify(query), response);
					console.error(response);
                    this.render();
				}.bind(this)
			});
        },
        getColors: function(num){
            let colors = [];
            for(let i = 0; i < num; i++){
                colors.push(
                    bdcColors[i % bdcColors.length]
                );
            }
            return colors;
        },
        createCategoryPlot: function(){
            this.model.get('categoricalData').forEach((dataMap) => {
                let title = dataMap.title;
                if (dataMap.title && dataMap.title.length > MAX_TITLE_LENGTH) {
                    title = dataMap.title.substring(0, MAX_TITLE_LENGTH - 3) + "...";
                }
                const values = Object.values(dataMap.categoricalMap);
                const colors = this.getColors(values.length);
                const trace = {
                    x: Object.keys(dataMap.categoricalMap),
                    y: values,
                    text: values,
                    name: title,
                    unformatedTitle: dataMap.title,
                    type: 'bar',
                    showlegend: false,
                    isCategorical: true,
                    marker: {
                        color: colors,
                        line: {
                            color: 'rgba(0,0,0,0.5)',
                            width: 2
                          }
                    }
                };
                const layout = {
                    title: title,
                    width: dataMap.chartWidth || 500,
                    height: dataMap.chartHeight || 600,
                    hovermode: false,
                    font: {
                        family: 'Nunito Sans, sans-serif'
                    },
                    xaxis: {
                        title: dataMap.xaxisName,
                        automargin: true,
                    },
                    yaxis: {
                        title: dataMap.yaxisName,
                        automargin: true,
                    }
                }
                this.data.traces.push(trace);
                this.data.layouts.push(layout);
            });
        },
        createContinuousPlot: function(){
            this.model.get('continuousData').forEach((dataMap) => {
                let title = dataMap.title;
                if (dataMap.title && dataMap.title.length > MAX_TITLE_LENGTH) {
                    title = dataMap.title.substring(0, MAX_TITLE_LENGTH - 3) + "...";
                }
                let trace = {
                    x: Object.keys(dataMap.continuousMap),
                    y: Object.values(dataMap.continuousMap),
                    name: title,
                    unformatedTitle: dataMap.title,
                    type: 'bar',
                    showlegend: false,
                    isCategorical: false,
                    marker: {
                        color: '#c31f3f',
                        line: {
                            color: '#616265',
                            width: 1
                        }
                    }
                };
                let layout = {
                    title: title,
                    width: dataMap.chartWidth || 500,
                    height: dataMap.chartHeight || 600,
                    autosize: false,
                    hovermode: false,
                    bargap: 0.01,
                    font: {
                        family: 'Nunito Sans, sans-serif'
                    },
                    xaxis: {
                        title: dataMap.xaxisName,
                        automargin: true,
                    },
                    yaxis: {
                        title: dataMap.yaxisName,
                        automargin: true,
                    }
                }
                this.data.traces.push(trace);
                this.data.layouts.push(layout);
            });
        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            for(let i = 0; i < this.data.traces.length; i++){
                let plot = document.createElement('div');
                let screenReaderText = 'Histogram showing the visualization of ';
                if (this.data.traces[i].isCategorical) {
                    screenReaderText = 'Column chart showing the visualization of ';
                }
                plot.setAttribute('id', 'plot' + i);
                plot.setAttribute('aria-label', screenReaderText + this.data.traces[i].unformatedTitle);
                plot.setAttribute('title', 'Visualization of ' + this.data.traces[i].unformatedTitle);
                plot.classList.add('image-container');
                document.getElementById('visualizations-container').appendChild(plot);
                this.config.toImageButtonOptions.filename = this.data.traces[i].unformatedTitle;
                plotly.newPlot(plot, [this.data.traces[i]], this.data.layouts[i], this.config);
            }
            return this;
        }
    });
    return {
        View: visualizationModalView, 
        Model: defaultModel,
    };
});
