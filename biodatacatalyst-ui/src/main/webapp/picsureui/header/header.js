define(["jquery", "backbone", "handlebars", "studyAccess/studyAccessFunctions", "text!header/header.hbs", "overrides/header",
        "text!../settings/settings.json", "text!options/modal.hbs","text!header/userProfile.hbs", "psamaui/overrides/userProfile",
        "util/notification", "picSure/userFunctions"],
    function($, BB, HBS, studyAccess, template, overrides,
             settings, modalTemplate, userProfileTemplate, profileOverride,
             notification, userFunctions){
        var headerView = BB.View.extend({
            initialize : function(){
                HBS.registerHelper('not_contains', function (array, object, opts) {
                    var found = _.find(array, function (element) {
                        return (element === object);
                    });
                    if (found)
                        return opts.inverse(this);
                    else
                        return opts.fn(this);
                });
                HBS.registerHelper('not_empty', function (array, opts) {
                    if (array && array.length>0)
                        return opts.fn(this);
                    else
                        return opts.inverse(this);

                });
                HBS.registerHelper('tokenExpiration', function (token) {
                    var expirationTime = JSON.parse(atob(token.split('.')[1])).exp * 1000;
                    var badgeClass = "primary";
                    var badgeMessage = "unknown";
                    var daysLeftOnToken = Math.floor((expirationTime - Date.now()) / (1000 * 60 * 60 * 24));
                    if ( expirationTime < Date.now() ){
                        badgeClass = "danger";
                        badgeMessage = "EXPIRED"
                    } else if ( daysLeftOnToken < 7 ) {
                        badgeClass = "warning";
                        badgeMessage = "EXPIRING SOON";
                    } else {
                        badgeClass = "success";
                        badgeMessage = "Valid for " + daysLeftOnToken + " more days";
                    }
                    return new Date(expirationTime).toString().substring(0,24) + " <span class='badge badge-" + badgeClass + "'>" + badgeMessage + "</span>";
                });

                this.template = HBS.compile(template);
                this.applications = [];
                this.modalTemplate = HBS.compile(modalTemplate);
                this.userProfileTemplate = HBS.compile(userProfileTemplate);
            },
            events : {
                "click #logout-btn" : "logout",
                "click #user-profile-btn": "userProfile"
            },
            logout : function(event){
                sessionStorage.clear();
                window.location = '/psamaui/?redirection_url=/picsureui';
            },
            userProfile: function (event) {
                if(profileOverride.userProfile) {
                    profileOverride.userProfile(event, this);
                } else {
                    userFunctions.meWithToken(this, function(user){
                        $("#modal-window").html(this.modalTemplate({title: "User Profile"}));
                        $("#modalDialog").show();
                        $(".modal-body").html(this.userProfileTemplate({user:user}));
                        $("#user-token-copy-button").click(this.copyToken);
                        $("#user-token-refresh-button").click(this.refreshToken);
                        $('#user-token-reveal-button').click(this.revealToken);
                        $('.close').click(this.closeDialog);
                    }.bind(this));
                }
            },
            copyToken: function(){
                var originValue = document.getElementById("user_token_textarea").textContent;

                var sel = getSelection();
                var range = document.createRange();

                // this if for supporting chrome, since chrome will look for value instead of textContent
                // document.getElementById("user_token_textarea").value = document.getElementById("user_token_textarea").textContent;
                document.getElementById("user_token_textarea").value
                    = document.getElementById("user_token_textarea").textContent
                    = document.getElementById("user_token_textarea").attributes.token.value;
                range.selectNode(document.getElementById("user_token_textarea"));
                sel.removeAllRanges();
                sel.addRange(range);
                document.execCommand("copy");

                $("#user-token-copy-button").html("COPIED");

                document.getElementById("user_token_textarea").textContent
                    = document.getElementById("user_token_textarea").value
                    = originValue;
            },
            refreshToken: function(){
                notification.showConfirmationDialog(function () {
                    userFunctions.refreshUserLongTermToken(this, function(result){
                        if ($('#user-token-reveal-button').html() == "HIDE"){
                            $("#user_token_textarea").html(result.userLongTermToken);
                        }

                        document.getElementById("user_token_textarea").attributes.token.value = result.userLongTermToken;

                        $("#user-token-copy-button").html("COPY");
                        $('#user-profile-btn').click()
                    }.bind(this));
                }.bind(this), 'center', 'Refresh will inactivate the old token!! Do you want to continue?');
            },
            revealToken: function(event){
                var type = $('#user-token-reveal-button').html();
                if (type == "REVEAL"){
                    var token = $('#user_token_textarea')[0].attributes.token.value;
                    $("#user_token_textarea").html(token);
                    $("#user-token-reveal-button").html("HIDE");
                } else {
                    $("#user_token_textarea").html("**************************************************************************************************************************************************************************************************************************************************************************************");
                    $("#user-token-reveal-button").html("REVEAL");
                }
            },
            closeDialog: function () {
                $("#modalDialog").hide();
            },
            render : function(){
                jsonSettings = JSON.parse(settings);

                this.$el.html(this.template({
                    logoPath: (overrides.logoPath
                        ? overrides.logoPath : "/images/logo.png"),
                    helpLink: jsonSettings.helpLink,
                    pdfLink: jsonSettings.pdfLink
                }));
                if (sessionStorage.getItem("session")) {
                    $('.authenticated-visible', this.$el).show();
                    $.ajax({
                        url: window.location.origin + "/psama/user/me",
                        type: 'GET',
                        headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                        contentType: 'application/json',
                        success: function (response) {
                            if(response.privileges.includes("ADMIN")){
                                $('.admin-visible', this.$el).show();
                            }
                            if(response.privileges.includes("SUPER_ADMIN")){
                                $('.super-admin-visible', this.$el).show();
                            }
                        }.bind(this),
                        error: function (response) {
                            console.log("error retrieving user info");
                            console.log(response);
                        }.bind(this)
                    });

                    // inject data access button (delayed execution)
                    setTimeout(studyAccess.addHeaderTab, 50);
                }
            }
        });

        return {
            View : new headerView({})
        };
    });

