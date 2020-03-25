define(["backbone","handlebars", "text!header/header.hbs", "overrides/header", "text!../settings/settings.json"],
		function(BB, HBS, template, overrides, settings){
	var headerView = BB.View.extend({
		initialize : function(){
			this.template = HBS.compile(template);
		},
		events : {
			"click #logout-btn" : "logout"
		},
		logout : function(event){
			sessionStorage.clear();
			window.location = '/psamaui?redirection_url=/picsureui';
		},
		render : function(){
			this.$el.html(this.template({
				logoPath: (overrides.logoPath
					? overrides.logoPath : "/images/logo.png"),
				helpLink: JSON.parse(settings).helpLink
			}));
			$.ajax({
				url: window.location.origin + "/psama/user/me",
				type: 'GET',
				headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
				contentType: 'application/json',
				success: function(response){
					if(response.privileges.includes("ADMIN") || response.privileges.includes("SUPER_ADMIN")){
						$('#admin-btn', this.$el).show();
					} else {
						$('#user-profile-btn', this.$el).show();
					}
				}.bind(this),
				error: function(response){
					console.log("error retrieving user info");
					console.log(response);
				}.bind(this)
			});
		}
	});

	return {
		View : new headerView({})
	};
});


/*  Set the FavIcon for this site */
(function() {
    var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = 'static/favicon.ico';
    document.getElementsByTagName('head')[0].appendChild(link);
})();


/*  Add font */

(function() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css?family=Nunito+Sans&display=swap';
    document.getElementsByTagName('head')[0].appendChild(link);
})();

