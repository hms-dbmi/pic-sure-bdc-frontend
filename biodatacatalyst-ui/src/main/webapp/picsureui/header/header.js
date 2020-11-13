define(["jquery", "backbone", "handlebars", "studyAccess/studyAccessFunctions", "text!header/header.hbs", "overrides/header", "text!../settings/settings.json"],
    function($, BB, HBS, studyAccess, template, overrides, settings){
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
                jsonSettings = JSON.parse(settings);
                this.$el.html(this.template({
                    logoPath: (overrides.logoPath
                        ? overrides.logoPath : "/images/logo.png"),
                    helpLink: jsonSettings.helpLink,
                    pdfLink: jsonSettings.pdfLink
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

                // inject data access button (delayed execution)
                setTimeout(studyAccess.addHeaderTab, 50);
            }
        });

        return {
            View : new headerView({})
        };
    });

