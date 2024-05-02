define(["jquery", "backbone", "handlebars", "text!search-interface/tool-suite-view.hbs", "search-interface/filter-model",
        "common/modal", "search-interface/tool-suite-help-view", "search-interface/visualization-modal-view", "search-interface/package-view"
    , "text!search-interface/visualization-modal-view.hbs", "openPicsure/studiesModal"],
function($, Backbone, HBS, template, filterModel, modal, helpView, VisualizationModalView, packageView
    , VisualizationTemplate, studiesModal) {
    return Backbone.View.extend({
        initialize: function (opts) {
            this.template = HBS.compile(template);
            this.isOpenAccess = opts.isOpenAccess;
            Backbone.pubSub.on('destroySearchView', this.destroy.bind(this));
        },
        events: {
            'click #package-data': 'openPackageData',
            'click #participant-study-data': 'openParticipantStudyData',
            'click #variant-explorer': 'openVariantExplorer',
            'click #distributions': 'openDistributions',
            'click #tool-suite-help': 'openHelp',
            'keypress #tool-suite-help': 'openHelp',
        },
        handleFilterChange: function () {
            const hasParticipants = parseInt(filterModel.get('totalPatients')) !== 0;
            const filters = filterModel.get('activeFilters');
            const anyRecordOf = filters.filter(filter => filter.get('filterType') === 'anyRecordOf');
            const genomic = filters.filter(filter => filter.get('filterType') === 'genomic');
            let shouldDisablePackageData = true;
            if (filters.length && hasParticipants) {
                if (anyRecordOf.length + genomic.length < filters.length || anyRecordOf.length) {
                    shouldDisablePackageData = false;
                }
            }

            let shouldDisableDistributions = true;
            if (this.isOpenAccess) {
                if (filters.length && filterModel.get('totalPatients') !== '< 10' && parseInt(filterModel.get('totalPatients')) !== 0) {
                    if (anyRecordOf.length + genomic.length < filters.length) {
                        shouldDisableDistributions = false;
                    }
                }
            }
            else if (filters.length && hasParticipants) {
                if (anyRecordOf.length + genomic.length < filters.length) {
                    shouldDisableDistributions = false;
                }
            }
            this.$el.find('#participant-study-data').prop('disabled', !hasParticipants).prop('title', !hasParticipants ? 'The "Total Participants" must be greater than zero' : 'Participant Count by Study');
            this.$el.find('#package-data').prop('disabled', shouldDisablePackageData).prop('title', shouldDisablePackageData ? 'Please add a phenotypic filter to your query to package data' : 'Select and Package data');
            this.$el.find('#distributions').prop('disabled', shouldDisableDistributions).prop('title', shouldDisableDistributions ? 'Please add a phenotypic filter to your query to view variable distributions' : 'Visualize distributions');
        },
        openDistributions: function () {
            const vizModal = new VisualizationModalView.View({
                model: new VisualizationModalView.Model(),
                template: VisualizationTemplate
            });
            modal.displayModal(
                vizModal,
                'Variable distributions of query filters',
                () => {
                    this.$el.focus();
                },
                {isHandleTabs: true}
            );
        },
        openHelp: function (event) {
            if (event.type === "keypress" && !(event.key === ' ' || event.key === 'Enter')) {
                return;
            }
            modal.displayModal(
                new helpView({isOpenAccess: this.isOpenAccess}),
                'Tool Suite Help',
                () => {
                    $('#tool-suite').focus();
                }, {isHandleTabs: true}
            );
        },
        openPackageData: function () {
            let exportStatus = 'Ready';
            if (filterModel.get('estDataPoints') > 1000000) {
                exportStatus = 'Overload';
            }
            let exportModel = Backbone.Model.extend({
                defaults: {},
            });
            this.packageView = new packageView({
                model: new exportModel({
                    exportStatus: exportStatus,
                    deletedExports: new Backbone.Collection(),
                    queryId: ""
                })
            });
            modal.displayModal(
                this.packageView,
                'Review and Package Data',
                () => {
                    $('#package-modal').focus();
                }, {isHandleTabs: false}
            );
        },
        openParticipantStudyData: function () {
            modal.displayModal(
                new studiesModal(),
                'Participant Count by Study',
                () => {
                    $('#tool-suite').focus();
                },
                {isHandleTabs: true}
            );

        },
        openVariantExplorer: function () {
            console.log('openVariantExplorer');
        },
        destroy: function () {
            this.undelegateEvents();
            $(this.el).removeData().unbind();
            this.remove();
            Backbone.View.prototype.remove.call(this);
        },
        render: function () {
            this.$el.html(this.template(this));
            this.handleFilterChange();
            return this;
        }
    });
});
