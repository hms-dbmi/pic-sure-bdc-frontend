define(['psamaSettings/settings', 'jquery', 'handlebars', 'text!login/fence_login.hbs',
        'common/session', 'picSure/settings', 'common/transportErrors', 'util/notification', 'common/searchParser'],
    function(psamaSettings, $, HBS, loginTemplate,
             session, picSureSettings, transportErrors, notification, searchParser){
        var loginTemplate = HBS.compile(loginTemplate);

        var sessionInit = function(data) {
            session.authenticated(data.userId, data.token, data.email, data.permissions, data.acceptedTOS);
            var queryTemplateRequest = function() {
                return $.ajax({
                    url: window.location.origin + "/psama/user/me/queryTemplate/" + picSureSettings.applicationIdForBaseQuery,
                    type: 'GET',
                    headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                    contentType: 'application/json'
                });
            };
            var meRequest = function () {
                return $.ajax({
                    url: window.location.origin + "/psama/user/me",
                    type: 'GET',
                    headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                    contentType: 'application/json'
                });
            };
            $.when(queryTemplateRequest(), meRequest()).then(
                function(queryTemplateResponse, meResponse) {
                    var currentSession = JSON.parse(sessionStorage.getItem("session"));
                    currentSession.queryTemplate = queryTemplateResponse[0].queryTemplate;
                    currentSession.queryScopes = meResponse[0].queryScopes;
                    currentSession.privileges = meResponse[0].privileges;
                    if (!currentSession.privileges || currentSession.privileges.length === 0) {
                        history.pushState({}, "", "/picsureui/not_authorized");
                        return;
                    }
                    if (currentSession.privileges && currentSession.privileges.length > 1) {
                        currentSession.privileges.push("FENCE_AUTHORIZED_ACCESS");
                    }
                    sessionStorage.setItem("session", JSON.stringify(currentSession));

                    if (data.acceptedTOS !== 'true'){
                        history.pushState({}, "", "/psamaui/tos");
                    } else {
                        if (sessionStorage.redirection_url && sessionStorage.redirection_url !== 'undefined') {
                            history.pushState({}, "", sessionStorage.redirection_url);
                        }
                        else {
                            history.pushState({}, "", "/picsureui/dataAccess");
                        }
                    }
                }.bind(this),
                function(queryTemplateResponse, meResponse) {
                    if (queryTemplateResponse[0].status !== 200)
                        transportErrors.handleAll(queryTemplateResponse[0], "Cannot retrieve query template with status: " + queryTemplateResponse[0].status);
                    else
                        transportErrors.handleAll(meResponse[0], "Cannot retrieve user with status: " + meResponse[0].status);
                }
            )
        };

        return {
            showLoginPage : function () {
                var queryObject = searchParser();
                if (queryObject.redirection_url)
                    sessionStorage.redirection_url = queryObject.redirection_url.trim();
                var code = queryObject.code;
                if (code) {
                    $('#main-content').html("BioDataCatalyst authentication is successful. Processing UserProfile information...");

                    $.ajax({
                        url: '/psama/authentication',
                        type: 'post',
                        data: JSON.stringify({
                            code: code
                        }),
                        contentType: 'application/json',
                        success: sessionInit,
                        error: function(data){
                            notification.showFailureMessage("Failed to authenticate with provider. Try again or contact administrator if error persists.")
                            history.pushState({}, "", sessionStorage.not_authorized_url? sessionStorage.not_authorized_url : "/psamaui/not_authorized?redirection_url=/picsureui");
                        }
                    });
                } else {
                    console.log("FENCE-showLoginPage() no code in query string, redirecting to FENCE");

                    // Show the fence_login template, with the generated fenceLoginURL
                    $('#main-content').html(loginTemplate({
                        fenceURL : psamaSettings.idp_provider_uri + "/user/oauth2/authorize"+
                            "?response_type=code"+
                            "&scope=user+openid"+
                            "&client_id=" + psamaSettings.fence_client_id +
                            "&redirect_uri=" + window.location.protocol
                            + "//"+ window.location.hostname
                            + (window.location.port ? ":"+window.location.port : "")
                            + "/psamaui/login/"
                    }));
                }
            }
        }
    }
);
