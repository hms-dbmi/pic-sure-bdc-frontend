define([], function(){
	return {
		/*
		 * Override save user action for BDC specific metadata
         * Instead of replacing the entire user object, just update the roles
		 */
		saveUserAction : function(e, model){
			e?.preventDefault();
            let user = {};
			if (model.get("selectedUser") != null && model.get("selectedUser").uuid.trim().length > 0) {
				user = this.model.get("selectedUser");
			}
            let newRoles = [];
            _.each(this.$('input:checked'), function (checkbox) {
				newRoles.push({uuid: checkbox.value});
			});
            if (newRoles === user?.roles) {
                console.log("No change to roles");
                this.render();
				this.closeDialog();
                return;
            }
            user?.roles = newRoles;
            userFunctions.createOrUpdateUser([user], user.uuid === null ? 'POST' : 'PUT', function(result) {
				console.log(result);
				this.render();
				this.closeDialog();
			}.bind(this));
        }	
	};
});
