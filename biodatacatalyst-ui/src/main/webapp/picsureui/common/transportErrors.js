define(["jquery", "studyAccess/studyAccessFunctions"],
    function($, studyAccess) {
        var transportErrorHandlers = {};
        transportErrorHandlers.redirectionUrl = "/psamaui/login?redirection_url=/picsureui/";

        transportErrorHandlers.handleAll = function (response) {
            var hasError = false;
            if (this.handle401(response)) {
                console.debug("Captured HTTP 401 response");
                hasError = true;
            }
            return hasError;
        }.bind(transportErrorHandlers);


        transportErrorHandlers.handle401 = function (response, redirectionUrl = false) {
            if (redirectionUrl === false) redirectionUrl = this.redirectionUrl;
            if (response.status === 401) {
                if (new Date().getTime()/1000 < JSON.parse(atob(JSON.parse(sessionStorage.session).token.split('.')[1])).exp) {
                    studyAccess.init();
                    studyAccess.showBlocker();
                } else {
                    window.location.href = "/psamaui/logout";
                }
            }
            return false;
        }.bind(transportErrorHandlers);

        return transportErrorHandlers;
    }
);
