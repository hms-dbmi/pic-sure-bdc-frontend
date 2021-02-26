define(['psamaSettings/settings', 'jquery', 'handlebars', 'text!login/fence_login.hbs'],
    function(psamaSettings, $, HBS, loginTemplate){
        var loginTemplate = HBS.compile(loginTemplate);

        return {
            showLoginPage : function(sessionInitCallback, handleAuthenticationErrorCallback){
                return function () {
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
                            success: sessionInitCallback,
                            error: handleAuthenticationErrorCallback
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
    });
