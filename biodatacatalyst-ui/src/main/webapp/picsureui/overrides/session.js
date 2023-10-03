define(['search-interface/search-util'], function(searchUtil){
    let isStudyPrivilege = function(privilege){
        const prefixToRemove = "PRIV_FENCE_";
        const study = privilege.startsWith(prefixToRemove)
        ? privilege.slice(prefixToRemove.length)
        : privilege;
        return privilege.includes('phs') || searchUtil.isStudy(study);
    };
    return {
        handleQueryTemplateAndMeResponseSuccess: function(queryTemplateResponse, meResponse){
            var currentSession = JSON.parse(sessionStorage.getItem("session"));
            currentSession.queryTemplate = queryTemplateResponse[0].queryTemplate;
            currentSession.privileges = meResponse[0].privileges;
            currentSession.queryScopes = meResponse[0].queryScopes;
            currentSession.acceptedTOS = meResponse[0].acceptedTOS;
            currentSession.username = meResponse[0].email;

            if (!currentSession.privileges || currentSession.privileges.length === 0) {
                history.pushState({}, "", "/picsureui/not_authorized");
                return;
            }
            if (currentSession.privileges && currentSession.privileges.length > 0 && currentSession.privileges.filter(s => isStudyPrivilege(s)).length > 0)  {
                currentSession.privileges.push("FENCE_AUTHORIZED_ACCESS");
            }
            
            sessionStorage.setItem("session", JSON.stringify(currentSession));

            if (sessionStorage.redirection_url && sessionStorage.redirection_url != 'undefined') {
                window.location = sessionStorage.redirection_url;
            }
            else {
                window.location = "/picsureui/"
            }
        },
        handleNotAuthorizedResponse: function() {
            try {
                if (new Date().getTime()/1000 > JSON.parse(atob(JSON.parse(sessionStorage.session).token.split('.')[1])).exp) {
                    history.pushState({}, "", "/psamaui/logout");
                } else {
                    history.pushState({}, "", "/psamaui/not_authorized");
                }
            } catch (e) {
                console.log("Error determining token expiry");
                history.pushState({}, "", "/psamaui/not_authorized");
            }
        }
    };
});
