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
        halfOpacity: function(colorCode) {
        // Remove the '#' symbol if present
        if (colorCode.charAt(0) === '#') {
            colorCode = colorCode.substr(1);
        }

        // Parse the color code into RGB components
        const red = parseInt(colorCode.substr(0, 2), 16);
        const green = parseInt(colorCode.substr(2, 2), 16);
        const blue = parseInt(colorCode.substr(4, 2), 16);

        // Calculate the new RGB components with halved opacity and increased brightness
        const newRed = Math.min(Math.floor(red * 1.5), 255);
        const newGreen = Math.min(Math.floor(green * 1.5), 255);
        const newBlue = Math.min(Math.floor(blue * 1.5), 255);

        // Convert the new RGB components back to a color code
        const newColorCode = '#' + [newRed, newGreen, newBlue]
            .map(component => component.toString(16).padStart(2, '0'))
            .join('');

        return newColorCode;
    },
    getImages: function(){
            let query = queryBuilder.createQueryNew(filterModel.get("activeFilters").toJSON(), {}, settings.visualizationResourceId);
            query.resourceCredentials = {"Authorization" : "Bearer " + JSON.parse(sessionStorage.getItem("session")).token};
            queryBuilder.updateConsentFilters(query, settings);
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
        createCategoryPlot: function(){
            this.model.get('categoricalData').forEach((dataMap) => {
                let obfuscationRange = 6;

                // shaded area at top of bar chart
                const topBar = Array(obfuscationRange).fill(1);

                let title = dataMap.title;
                if (dataMap.title && dataMap.title.length > MAX_TITLE_LENGTH) {
                    title = dataMap.title.substring(0, MAX_TITLE_LENGTH - (obfuscationRange/2)) + "...";
                }

                const shadedSections =  dataMap?.categoricalObfuscatedMap ? Object.values(dataMap.categoricalObfuscatedMap) : [];
                const values = Object.values(dataMap.categoricalMap);

                // TODO: this is just for development purposes
                if(shadedSections.length === 0) {
                    // add true to shadedSections for the number of elements in values
                    shadedSections.splice(0, 0, ...Array(values.length).fill(true));
                }

                // If the value is obfuscated, then the text value is empty
                const traceTopBarText = shadedSections.map((value, i) => i < (obfuscationRange/2) && value ? '' : values[i]);

                // If the value is obfuscated, then we add it to the shadedTraceText array
                const traceBottomBarText = shadedSections.map((value, i) => i < (obfuscationRange/2) && value ? values[i] : '');

                // if the value is obfuscated and the value is 10 or less, then we replace it in the traceTopBarText array with a '< 10' string and set the value in the topBar to 10
                topBar.forEach((value, i) => {
                    if (value === 1 && values[i] <= 10) {
                        topBar[i] = 9;
                    }
                });

                const colors = this.getColors(values.length);
                const trace = {
                    x: Object.keys(dataMap.categoricalMap),
                    // Remove 3 elements from the top of the bar chart to make room for the shaded area
                    y: values.map((value, i) => i < (obfuscationRange/2) && shadedSections[i] ? value - topBar[i] : value),
                    name: title,
                    unformatedTitle: dataMap.title,
                    type: 'bar',
                    showlegend: false,
                    isCategorical: true,
                    marker: {
                        color: colors,
                    }
                };

                let shadedTrace;
                if(shadedSections.length > 0) {
                    // for each color half the opacity
                    const shadedColors = colors.map(color => this.halfOpacity(color));

                    // Add shaded area to top of bar chart
                    shadedTrace = {
                        x: Object.keys(dataMap.categoricalMap),
                        y: topBar,
                        name: 'Shaded Area',
                        type: 'bar',
                        showlegend: false,
                        marker: {
                            color: shadedColors,
                        }
                    };
                }

                // Open access does not display the obfuscated values on the chart
                let isOpenAccess = JSON.parse(sessionStorage.getItem('isOpenAccess'));
                if(!isOpenAccess) {
                    trace.text = traceTopBarText;
                    shadedTrace.text = traceBottomBarText;
                }

                if (shadedTrace) {
                    this.data.traces.push([trace, shadedTrace]);
                } else {
                    this.data.traces.push([trace]);
                }

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
