define(["jquery",  "text!search-interface/query-results-view.hbs", "picSure/ontology", "backbone", "handlebars",
"overrides/outputPanel", "common/transportErrors", "common/config",
"text!options/modal.hbs", "picSure/settings", "search-interface/filter-model", "picSure/queryBuilder"],
function($, queryResultsTemplate, ontology, BB, HBS,
    overrides, transportErrors, config,
    modalTemplate, settings, filterModel, queryBuilder){

        var queryResultsModel = BB.Model.extend({
            defaults: {
                totalPatients : 0,
                totalVariables : 4,
                estDataPoints : 0,
                spinnerClasses: "spinner-medium spinner-medium-center ",
                spinning: false,
                resources : {},
                query: ""
            }
        });
        var queryResultsView = BB.View.extend({
            ontology: ontology,
            initialize: function(){
                this.template = HBS.compile(queryResultsTemplate);
                overrides.renderOverride ? this.render = overrides.renderOverride.bind(this) : undefined;
                overrides.update ? this.update = overrides.update.bind(this) : undefined;
                this.listenTo(filterModel.get('activeFilters'), 'change reset add remove', this.render);
                this.listenTo(filterModel.get('exportFields'), 'change reset add remove', this.render);
            },
            events:{

            },
            queryRunning: function(query){
                this.model.set('spinning', true);
                this.model.set('queryRan', false);
                this.render();
            },
            queryFinished: function(){
                this.model.set('spinning', false);
                this.model.set('queryRan', true);
                this.render();
            },
            totalCount: 0,
            tagName: "div",
            dataCallback: function(result){
                //default function to update a single patient count element in the output panel

                var patientCount = parseInt(result);
                var totalVariables = filterModel.getExportFieldCount(this.model.get('query'));
                var estDataPoints = patientCount*totalVariables;

                this.model.set("totalPatients", patientCount);
                this.model.set("totalVariables", totalVariables);
                this.model.set("estDataPoints", estDataPoints);
                filterModel.set("totalPatients", patientCount);
                filterModel.set("totalVariables", totalVariables);
                filterModel.set("estDataPoints", estDataPoints);
                this.queryFinished();

            },
            errorCallback: function(message){
                //clear some status flags and make sure we inform the user of errors
                this.queryFinished("-");
                $("#patient-count").html(message);
                console.log("Error is" + message);
            },
            runQuery: function(incomingQuery){
                    this.queryRunning(incomingQuery);
                    var query = JSON.parse(JSON.stringify(incomingQuery));
                    overrides.updateConsentFilters(query, settings);
                    this.model.set('query', query);
                    $.ajax({
                        url: window.location.origin + "/picsure/query/sync",
                        type: 'POST',
                        headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                        contentType: 'application/json',
                        data: JSON.stringify(query),
                        success: function(response, textStatus, request){
                            this.dataCallback(response, request.getResponseHeader("resultId"));
                        }.bind(this),
                        error: function(response){
                            if (!transportErrors.handleAll(response, "Error while processing query")) {
                                response.responseText = "<h4>"
                                + overrides.outputErrorMessage ? overrides.outputErrorMessage : "There is something wrong when processing your query, please try it later, if this repeats, please contact admin."
                                + "</h4>";
                                this.errorCallback(response.responseText);
                            }
                        }.bind(this)
                    });
            },
            render: function(){
                this.$el.html(this.template(this.model.toJSON()));
            }
        });

        return {
            View : (overrides.viewOverride ? overrides.viewOverride : queryResultsView),
    		Model: (overrides.modelOverride ? overrides.modelOverride : queryResultsModel)
        }
    });
