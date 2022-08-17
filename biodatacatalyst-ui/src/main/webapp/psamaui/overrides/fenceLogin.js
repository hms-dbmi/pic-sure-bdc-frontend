define(['picSure/psamaSettings', 'jquery', 'handlebars', 'text!login/fence_login.hbs',
        'common/session', 'picSure/settings', 'common/transportErrors', 'util/notification', 'common/searchParser'],
    function(psamaSettings, $, HBS, loginTemplate,
             session, picSureSettings, transportErrors, notification, searchParser){
        var loginTemplate = HBS.compile(loginTemplate);

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
                        success: session.sessionInit,
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
