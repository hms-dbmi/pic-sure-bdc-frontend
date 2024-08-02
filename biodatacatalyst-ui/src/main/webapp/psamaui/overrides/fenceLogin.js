define(['picSure/settings', 'jquery', 'handlebars', 'text!login/fence_login.hbs',
        'common/session', 'common/transportErrors', 'util/notification', 'common/searchParser'],
    function (settings, $, HBS, loginTemplate,
              session, transportErrors, notification, searchParser) {
        function generateRandomState() {
            const randomPart = Math.random().toString(36).substring(2, 15);
            const timePart = new Date().getTime().toString(36);
            return randomPart + timePart;
        }

        return {
            showLoginPage: function () {
                var queryObject = searchParser();
                if (queryObject.redirection_url)
                    sessionStorage.redirection_url = queryObject.redirection_url.trim();
                var code = queryObject.code;
                if (code) {
                    let state = queryObject.state;
                    if (state) {
                        let idp = state.split("-")[0];
                        sessionStorage.setItem('idp', idp);

                        let stateVal = state.split("-")[1];
                        let storedState = sessionStorage.getItem('oauthState');
                        // compare the state from the query string to the stored state
                        if (stateVal === storedState) {
                            // Code and state are valid, proceed with authentication
                            $('#main-content').html("BioDataCatalyst authentication is successful. Processing UserProfile information...");

                            $.ajax({
                                url: '/psama/authentication/' + idp,
                                type: 'post',
                                data: JSON.stringify({
                                    code: code
                                }),
                                contentType: 'application/json',
                                success: session.sessionInit,
                                error: function (data) {
                                    notification.showFailureMessage("Failed to authenticate with provider. Try again or contact administrator if error persists.")
                                    history.pushState({}, "", sessionStorage.not_authorized_url ? sessionStorage.not_authorized_url : "/psamaui/not_authorized?redirection_url=/picsureui");
                                }
                            });
                        }
                    }
                } else {
                    console.log("FENCE-showLoginPage() no code in query string, redirecting to FENCE");
                    let state = generateRandomState();
                    sessionStorage.setItem('oauthState', state);
                    // Show the fence_login template, with the generated fenceLoginURL
                    $('#main-content').html(HBS.compile(loginTemplate)({
                        fenceURL: settings.idp_provider_uri + "/user/oauth2/authorize" +
                            "?response_type=code" +
                            "&scope=user+openid" +
                            "&state=" + encodeURIComponent("fence-" + state) +
                            "&client_id=" + settings.fence_client_id +
                            "&redirect_uri=" + window.location.protocol
                            + "//" + window.location.hostname
                            + (window.location.port ? ":" + window.location.port : "")
                            + "/psamaui/login",
                        rasURL: settings.ras_idp_provider_uri +
                            "?response_type=code" +
                            "&scope=openid" +
                            "&client_id=" + encodeURIComponent(settings.ras_client_id) +
                            "&state=" + encodeURIComponent("ras-" + state) +
                            "&idp=" + encodeURIComponent(settings.ras_idp_id) +
                            "&redirect_uri=" + window.location.protocol
                            + "//" + window.location.hostname
                            + (window.location.port ? ":" + window.location.port : "")
                            + "/psamaui/login"
                    }));
                }
            }
        }
    }
);
