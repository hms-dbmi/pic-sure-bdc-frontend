define([
    'backbone',
    'handlebars',
    'search-interface/modal',
    'header/userProfile',
    'picSure/userFunctions',
], function(BB, HBS, modal, userProfile, userFunctions) {
    var externalExportView = BB.View.extend({
        initialize: async function(opts){
            this.previousView = opts.previousView;
            if (opts.template) {
                this.viewTemplate = HBS.compile(opts.template);
            } else {
                console.error("No template provided for externalExportView");
            }
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
        destroy: function(){
			//https://stackoverflow.com/questions/6569704/destroy-or-remove-a-view-in-backbone-js/11534056#11534056
			this.undelegateEvents();	
			$(this.el).removeData().unbind(); 
			this.remove();  
			Backbone.View.prototype.remove.call(this);
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
    return externalExportView;
});