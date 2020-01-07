define(["picSure/settings", "text!overrides/not_authorized.hbs", "handlebars"], function(settings, notAuthorizedTemplate, HBS){
	return {
		/*
		 * This allows you to build any authorization logic you wish.
		 *
		 * This should be a function that takes the output of common/searchParser/parseQueryString
		 * and returns either true or false based on the values of the query string.
		 *
		 */
		authorization : undefined,

		client_id : settings.client_id,
		/*
		 * This allows you to modify the DOM rendered on the login screen.
		 *
		 * For GRIN this implements a hack that hides the Google button because of
		 * a bug in the Auth0 lock that prevents you from showing only enterprise
		 * buttons.
		 *
		 * Since users still need to pass authorization, there is no harm in
		 * keeping the button hidden, since even if someone decided to show it
		 * they couldn't use it to access the system anyway.
		 */
		postRender: function(){
			// $('#frmAuth0Login').on("DOMNodeInserted", function(event){
			// 	$('.a0-googleplus').hide();
			// });

			// $('.a0-iconlist').children().get(0).innerHTML = 'Please click the button below to log in.';

		},

        /*
         * This override allows to configure custom not_authorized page for stack.
         *
         * Example configuration: provide custom not_authorized.hbs template in overrides folder and render it similar manner
         * as login.displayNotAuthorized() function.
         */
        displayNotAuthorized: function () {
            $('#main-content').html(HBS.compile(notAuthorizedTemplate)({helpLink:settings.helpLink}));
        }
	};
});
