define(["jquery",  "text!search-interface/query-results-view.hbs", "picSure/ontology", "backbone", "handlebars",
"overrides/outputPanel", "common/transportErrors", "common/config",
"text!options/modal.hbs", "picSure/settings", "search-interface/filter-model", "picSure/queryBuilder", 
"search-interface/query-results-help-view", "common/modal", "openPicsure/openPicsureHelpView",
"search-interface/tool-suite-view"],
function($, queryResultsTemplate, ontology, BB, HBS,
    overrides, transportErrors, config,
    modalTemplate, settings, filterModel, queryBuilder, helpView, modal, openHelpView,){

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
            initialize: function(opts){
                this.template = HBS.compile(queryResultsTemplate);
                this.toolSuiteView = opts.toolSuiteView;
                this.helpView = new helpView();
                this.openHelpView = new openHelpView();
                overrides.renderOverride ? this.render = overrides.renderOverride.bind(this) : undefined;
                overrides.update ? this.update = overrides.update.bind(this) : undefined;
                this.listenTo(filterModel.get('activeFilters'), 'change reset add remove', this.render);
                this.listenTo(filterModel, 'change:totalVariables', this.updateVariableCount);
                filterModel.initializeConsents();
                Backbone.pubSub.on('destroySearchView', this.destroy.bind(this));
            },
            events:{
                'click #data-summary-help' : 'openHelp',
                'keypress #data-summary-help' : 'openHelp',
            },
            queryRunning: function(query){
                this.model.set('spinning', true);
                this.model.set('queryRan', false);
                this.render();
            },
            queryFinished: function(){
                this.model.set('spinning', false);
                this.model.set('queryRan', true);
                this.toolSuiteView && this.toolSuiteView.handleFilterChange();
                this.render();
            },
            totalCount: 0,
            tagName: "div",
            dataCallback: function(result){
                //default function to update a single patient count element in the output panel
                filterModel.updateConsents();
                var patientCount = parseInt(result);
                var totalVariables = filterModel.get('totalVariables');
                var estDataPoints = patientCount*totalVariables;

                this.model.set("totalPatients", patientCount);
                this.model.set("totalVariables", totalVariables);
                this.model.set("estDataPoints", estDataPoints);
                filterModel.set("totalPatients", patientCount);
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
                    queryBuilder.updateConsentFilters(query, settings);
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
                            if (!transportErrors.handle401(response, "Error while processing query")) {
                                response.responseText = '<div class="error-text-box">'
                                + overrides.outputErrorMessage ? overrides.outputErrorMessage : "There is something wrong when processing your query, please try it later, if this repeats, please contact admin."
                                + "</div>";
                                this.errorCallback(response.responseText);
                            }
                        }.bind(this)
                    });
            },
            updateVariableCount: function(){
                $('#export-count').html(filterModel.get('totalVariables')+' Variables');
            },
            openHelp: function(event){
                if (event.type === "keypress" && !(event.key === ' ' || event.key === 'Enter')) {
                    return;
                }
                modal.displayModal(
                    JSON.parse(sessionStorage.getItem('isOpenAccess')) ?  this.openHelpView : this.helpView,
                    'Data Summary Help',
                    () => {
                        $('#patient-count-box').focus();
                    }, {isHandleTabs: true}
                );
            },
            destroy: function(){
                //https://stackoverflow.com/questions/6569704/destroy-or-remove-a-view-in-backbone-js/11534056#11534056
                this.undelegateEvents();	
                $(this.el).removeData().unbind(); 
                this.remove();  
                Backbone.View.prototype.remove.call(this);
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
