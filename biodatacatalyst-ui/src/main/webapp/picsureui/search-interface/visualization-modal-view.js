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
				url: window.location.origin + '/picsure/info/' + settings.visualizationResourceId,
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
            let query = queryBuilder.createQueryNew(filterModel.get("activeFilters").toJSON(), {}, settings.visualizationResourceId);
            query.resourceCredentials = {"Authorization" : "Bearer " + JSON.parse(sessionStorage.getItem("session")).token};
            queryBuilder.updateConsentFilters(query, settings);

            // We need to remove the consent filter for open access as it will reduce the number of results
            // and we want to show all results for open access. We just obfuscate the data that is not consented to.
            const isOpenAccess = JSON.parse(sessionStorage.getItem('isOpenAccess'));
            if (isOpenAccess) {
                delete query.query.categoryFilters["\\_consents\\"];
            }

            this.model.set('spinning', true);
            $.ajax({
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
        createCategoryPlot: function() {
            this.model.get('categoricalData').forEach((dataMap) => {
                const obfuscationRange = 6;

                let title = dataMap.title;
                if (dataMap.title && dataMap.title.length > MAX_TITLE_LENGTH) {
                    title = dataMap.title.substring(0, MAX_TITLE_LENGTH - 3) + "...";
                }

                const obfuscationArr =  Object.values(dataMap.categoricalObfuscatedMap);
                const values = Object.values(dataMap.categoricalMap);

                // shaded area at top of bar chart
                const topBar = Array(values.length).fill(obfuscationRange);

                let traceBottomBarText = [];

                values.forEach((value, i) => {
                    // If the value is less than 10 and the section obfuscated, then we need to obfuscate the value
                    if (value < 10 && obfuscationArr[i]) {
                        topBar[i] = 9;

                        // Set the text to < 10 so that it shows up in the bar chart
                        traceBottomBarText[i] = '< 10';

                        // set the value in the topBar array to 0 so that it doesn't show up in the bar chart
                        values[i] = 0;
                    } else if (obfuscationArr[i]) {
                        // The value has been obfuscated by +- obfuscationRange
                        traceBottomBarText[i] = value + ' \u00B1 3';
                    } else {
                        topBar[i] = 0;
                        traceBottomBarText[i] = value;
                    }
                });

                const colors = this.getColors(values.length);
                const trace = {
                    x: Object.keys(dataMap.categoricalMap),
                    // Remove half of the obfuscation range value from the top of the bar
                    // chart to make room for the shaded area
                    y: values.map((value, i) => obfuscationArr[i] && value > 0 ? value - (obfuscationRange / 2) : value),
                    name: title,
                    unformatedTitle: dataMap.title,
                    type: 'bar',
                    showlegend: false,
                    isCategorical: true,
                    marker: {
                        color: colors,
                    },
                };

                let shadedTrace = {
                    x: Object.keys(dataMap.categoricalMap),
                    y: topBar,
                    name: 'Obfuscated Data',
                    showlegend: false,
                    isCategorical: true,
                    type: 'bar',
                    marker: {
                        color: colors,
                        pattern: {
                            shape: '/',
                            size: 20,
                            solidity: '.5'
                        }
                    },
                    text: traceBottomBarText,
                    textposition: 'outside',
                };

                this.data.traces.push([trace, shadedTrace]);

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
                    },
                    barmode: 'stack',
                };

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
                };

                this.data.traces.push([trace]);
                this.data.layouts.push(layout);
            });
        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            for(let i = 0; i < this.data.traces.length; i++) {
                let plot = document.createElement('div');
                let screenReaderText = 'Histogram showing the visualization of ';

                // We need to do this because the traces are a 2d array. As long as one of the traces is categorical,
                // we need to add the screen reader text
                let unformatedTitle;
                for(let j = 0; j < this.data.traces[i].length; j++) {
                    if (this.data.traces[i][j].isCategorical) {
                        screenReaderText = 'Column chart showing the visualization of ';
                    }

                    if (this.data.traces[i][j].unformatedTitle) {
                        unformatedTitle = this.data.traces[i][j].unformatedTitle;
                        break;
                    }
                }

                plot.setAttribute('id', 'plot' + i);
                plot.setAttribute('aria-label', screenReaderText + unformatedTitle);
                plot.setAttribute('title', 'Visualization of ' + unformatedTitle);
                plot.classList.add('image-container');
                document.getElementById('visualizations-container').appendChild(plot);
                this.config.toImageButtonOptions.filename = unformatedTitle;
                plotly.newPlot(plot, this.data.traces[i], this.data.layouts[i], this.config);
            }
            return this;
        }
    });
    return {
        View: visualizationModalView, 
        Model: defaultModel,
    };
});
