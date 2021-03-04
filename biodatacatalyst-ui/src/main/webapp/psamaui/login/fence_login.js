define(['common/session', 'psamaSettings/settings', 'common/searchParser', 'jquery', 'handlebars', 'text!login/fence_login.hbs',
        'text!login/not_authorized.hbs', 'psamaui/overrides/login', 'util/notification', 'footer/footer', "picSure/settings"],
    function(session, settings, parseQueryString, $, HBS, loginTemplate,
             notAuthorizedTemplate, overrides, notification, footer, picSureSettings){
        var loginTemplate = HBS.compile(loginTemplate);

        var login = {
            showLoginPage : function(){

                // Check if the `code` parameter is set in the URL, as it would be, when
                // FENCE redirects back after authentication.
                var queryString = window.location.search.substring(1);
                var params = {}, queries, temp, i, l;
                // Split into key/value pairs
                queries = queryString.split("&");
                // Convert the array of strings into an object
                for ( i = 0, l = queries.length; i < l; i++ ) {
                    temp = queries[i].split('=');
                    params[temp[0]] = temp[1];
                }
                var code = params['code'];
                if (code) {
                    $('#main-content').html('BioDataCatalyst authentication is successful. Processing UserProfile information...');

                    $.ajax({
                        url: '/psama/authentication',
                        type: 'post',
                        data: JSON.stringify({
                           code: code
                        }),
                        contentType: 'application/json',
                        success: function(data){
                            console.log('showLoginPage() psama fence-authentication is successful.');
                            console.log(data);

                            // If back-end response is success, we will get a PSAMA JWT token back, and some
                            // other information. We will set the session variables for the user with our own
                            // internal expiry, and other claims.
                            session.authenticated(
                                data.userId,
                                data.token,
                                data.email,
                                data.permissions,
                                data.acceptedTOS,
                                this.handleNotAuthorizedResponse
                            );
                            $.ajax({
                                url: window.location.origin + "/psama/user/me/queryTemplate/" + picSureSettings.applicationIdForBaseQuery,
                                type: 'GET',
                                headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                                contentType: 'application/json',
                                success: function (response) {
                                    var currentSession = JSON.parse(sessionStorage.getItem("session"));
                                    currentSession.queryTemplate = response.queryTemplate;
                                    sessionStorage.setItem("session", JSON.stringify(currentSession));

                                    if (data.acceptedTOS !== 'true'){
                                        history.pushState({}, "", "/psamaui/tos");
                                    } else {
                                        if (sessionStorage.redirection_url) {
                                            window.location = sessionStorage.redirection_url;
                                        }
                                        else {
                                            // todo: based on user
                                            history.pushState({}, "", "/picsureui");
                                        }
                                    }
                                }.bind(this),
                                error: function (response) {
                                    transportErrors.handleAll(response, "Cannot retrieve query template with status: " + response.status);
                                }.bind(this)
                            });

                        }.bind(this),
                        error: function(data){
                            notification.showFailureMessage("Failed to authenticate with provider. Try again or contact administrator if error persists.")
                            history.pushState({}, "", sessionStorage.not_authorized_url? sessionStorage.not_authorized_url : "/psamaui/not_authorized?redirection_url=/picsureui");
                        }
                    });
                    return null;
                } else {
                    console.log("FENCE-showLoginPage() no code in query string, redirecting to FENCE");

                    // Show the fence_login template, with the generated fenceLoginURL
                    $('#main-content').html(loginTemplate({
                        fenceURL : settings.idp_provider_uri + "/user/oauth2/authorize"+
                            "?response_type=code"+
                            "&scope=user+openid"+
                            "&client_id=" + settings.fence_client_id +
                            "&redirect_uri=" + window.location.protocol
                            + "//"+ window.location.hostname
                            + (window.location.port ? ":"+window.location.port : "")
                            + "/psamaui/login/"
                    }));
                    
                    //also need to show footer on login page
                    var footerView = footer.View;
                    footerView.render();
                    $('#footer-content').append(footerView.$el);
                    return null;
                }
            },
            handleNotAuthorizedResponse : function () {
                console.log("FENCE-handleNotAuthorizedResponse() starting....");

                if (JSON.parse(sessionStorage.session).token) {
                    if (sessionStorage.not_authorized_url)
                        window.location = sessionStorage.not_authorized_url;
                    else
                        window.location = "/psamaui/not_authorized" + window.location.search;
                } else {
                  // Do nothing if there is not token, and authorization failed.
                }
            },
            displayNotAuthorized : function () {
                console.log("FENCE-displayNotAuthorized() starting...");

                if (overrides.displayNotAuthorized)
                    overrides.displayNotAuthorized()
                else
                    $('#main-content').html(HBS.compile(notAuthorizedTemplate)({helpLink:settings.helpLink}));
                
                //also need to show footer EVERYWHERE
                var footerView = footer.View;
                footerView.render();
                $('#footer-content').append(footerView.$el);
            }
        };
        return login;
    });