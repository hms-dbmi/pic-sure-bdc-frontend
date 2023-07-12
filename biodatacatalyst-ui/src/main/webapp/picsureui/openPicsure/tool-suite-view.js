define(["jquery", "backbone", "handlebars", "text!openPicsure/tool-suite-view.hbs",
        "search-interface/modal", "openPicsure/tool-suite-help-view", "openPicsure/outputModel",
        "openPicsure/studiesModal","search-interface/visualization-modal-view", "search-interface/filter-model"],
    function ($, BB, HBS, template, modal, helpView, outputModel, studiesModal, VisualizationModalView,
              filterModel) {
        return BB.View.extend({
            initialize: function (opts) {
                this.template = HBS.compile(template);
                this.helpView = new helpView();
                this.studiesModal = new studiesModal();
                BB.pubSub.on('destroySearchView', this.destroy.bind(this));
            },
            events: {
                'click #participant-study-data': 'openParticipantStudyData',
                'click #tool-suite-help': 'openHelp',
                'keypress #tool-suite-help': 'openHelp',
                'click #distributions' : 'openDistributions',
            },
            handleFilterChange: function () {
                let participantCount = parseInt(outputModel.get("totalPatients")) === 0;
                const filters = filterModel.get('activeFilters');
                const anyRecordOf = filters.filter(filter => filter.get('filterType') === 'anyRecordOf');
                const genomic = filters.filter(filter => filter.get('filterType') === 'genomic');
                let hasPhenotypicFilter = filters.length > 0 && (anyRecordOf.length + genomic.length < filters.length || anyRecordOf.length > 0);

                // Participant Count by Study
                this.$el.find('#participant-study-data').prop('disabled', participantCount).prop('title', participantCount ? 'The "Total Participants" must be greater than zero' : 'Participant Count by Study');

                // Visualize distributions
                this.$el.find('#distributions').prop('disabled', participantCount).prop('title', participantCount ? 'The "Total Participants" must be greater than zero' : 'Visualize distributions');
                this.$el.find('#distributions').prop('disabled', !hasPhenotypicFilter).prop('title', !hasPhenotypicFilter ? 'You must add at least one filter' : 'Visualize distributions');
            },
            openHelp: function (event) {
                if (event.type === "keypress" && !(event.key === ' ' || event.key === 'Enter')) {
                    return;
                }
                modal.displayModal(
                    this.helpView,
                    'Tool Suite Help',
                    () => {
                        $('#tool-suite').focus();
                    }, {isHandleTabs: true}
                );
            },
            openParticipantStudyData: function () {
                modal.displayModal(
                    this.studiesModal,
                    'Participant Count by Study',
                    () => {
                        $('#tool-suite').focus();
                    },
                    {isHandleTabs: true}
                );

            },
            openDistributions: function(){
                const vizModal = new VisualizationModalView.View({model: new VisualizationModalView.Model()});
                modal.displayModal(
                    vizModal,
                    'Variable distributions of query filters',
                    () => {this.$el.focus();},
                    {isHandleTabs: true}
                );
            },
            destroy: function () {
                //https://stackoverflow.com/questions/6569704/destroy-or-remove-a-view-in-backbone-js/11534056#11534056
                this.undelegateEvents();
                $(this.el).removeData().unbind();
                this.remove();
                BB.View.prototype.remove.call(this);
            },
            render: function () {
                this.$el.html(this.template());
                this.handleFilterChange();
                return this;
            }
        });
    });
