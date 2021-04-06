define([], function(){
    return {
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
