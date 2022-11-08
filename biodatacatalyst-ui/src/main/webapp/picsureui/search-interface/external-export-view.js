define([
    'backbone',
    'handlebars',
    'text!search-interface/seven-bridges-export-view.hbs',
    'text!search-interface/terra-export-view.hbs',
    'search-interface/modal',
    'header/userProfile',
    'picSure/userFunctions',
], function(BB, HBS, sevenBridgesTemplate, terraTemplate, modal, userProfile, userFunctions) {
    var sevenBridgesExportView = BB.View.extend({
        initialize: async function(opts){
            this.isTerra = opts.terra;
            if (this.isTerra) {
                this.viewTemplate = HBS.compile(terraTemplate);
            } else {
                this.viewTemplate = HBS.compile(sevenBridgesTemplate);
            }
            this.previousView = opts.previousView;
        },
        onClose: function() {
            this.previousView && modal.displayModal(this.previousView.view, this.previousView.title);
        },
        events: {
            'click #copy-query-id-button': 'copyQueryId',
            'click #cancel-button': 'onClose',
        },
        copyQueryId: function() {
            navigator.clipboard.writeText(document.getElementById("query-id").textContent);
            document.getElementById("copy-query-id-button").innerText = "Copied!";
        },
        render: function(){
            this.$el.html(this.viewTemplate());
            this.previousView && $('.close')?.off('click');
            this.previousView && $('.close')?.on('click', this.onClose.bind(this));
            this.$el.find('#query-id').text(this.previousView.model.get('queryId'));
            if (this.userProfile) {
                this.userProfile.delegateEvents();
                this.$el.find('#user-profile-container').html(this.userProfile.$el);
            } else {
                userFunctions.meWithToken(this, (user) => {
                    this.userProfile = new userProfile(user);
                    this.userProfile.delegateEvents(); 
                    this.userProfile.render();
                    this.$el.find('#user-profile-container').html(this.userProfile.$el);
                });
            }
        }
    });
    return sevenBridgesExportView;
});