define(["underscore", "picSure/userFunctions"], function(_, userFunctions){
	return {
		/*
		 * Override save user action for BDC specific metadata
         * Instead of replacing the entire user object, just update the roles
		 */
		saveUserAction : function(e, userDetails = {}){
			e?.preventDefault();
            let user = {};
			if (userDetails?.model.get("selectedUser") != null && userDetails?.model.get("selectedUser")?.uuid?.trim().length > 0) {
				user = userDetails.model.get("selectedUser");
			}
            let newRoles = [];
            _.each(userDetails?.$('input:checked'), function (checkbox) {
				newRoles.push({uuid: checkbox.value});
			});
            if (_.isEqual(newRoles, user?.roles)) {
                console.log("No change to roles");
                userDetails?.render();
				userDetails?.closeDialog();
                return;
            }
            user.roles = newRoles;
            user.generalMetadata = JSON.stringify(user.generalMetadata); //DB expects string
            userFunctions.createOrUpdateUser([user], user.uuid === null ? 'POST' : 'PUT', function(result) {
				console.log(result);
				userDetails?.render();
				userDetails?.closeDialog();
			}.bind(userDetails));
        }	
	};
});
