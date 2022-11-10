define(["jquery", "backbone","handlebars", "text!header/userProfile.hbs", "picSure/userFunctions"], 
    function($, BB, HBS, userProfileTemplate, userFunctions){
    var profileView = BB.View.extend({
        initialize : function(user){
            this.template = HBS.compile(userProfileTemplate);
            this.user = user;
            HBS.registerHelper('tokenExpiration', function (token) {
                var expirationTime = JSON.parse(atob(token.split('.')[1])).exp * 1000;
                var badgeClass = "primary";
                var badgeMessage = "unknown";
                var daysLeftOnToken = Math.floor((expirationTime - Date.now()) / (1000 * 60 * 60 * 24));
                if ( expirationTime < Date.now() ){
                    badgeClass = "danger";
                    badgeMessage = "EXPIRED"
                } else if ( daysLeftOnToken < 7 ) {
                    badgeClass = "danger";
                    badgeMessage = "EXPIRING SOON";
                } else {
                    badgeClass = "primary";
                    badgeMessage = "Valid for " + daysLeftOnToken + " more days";
                }
                return new Date(expirationTime).toString().substring(0,24) + " <span class='badge badge-" + badgeClass + "'>" + badgeMessage + "</span>";
            });
        },
        events : {
            'click #user-token-copy-button' : 'copyToken',
            'click #user-token-refresh-button' : 'refreshToken',
            'click #user-token-reveal-button' : 'revealToken',
        },
        copyToken: function(){
            $('#user-token-refresh-success').hide();
            const tokenValue = document.getElementById("user_token_textarea").attributes.token.value;;
            navigator.clipboard.writeText(tokenValue);
            $("#user-token-copy-button").html("Copied");
        },
        refreshToken: function(event){
		    $('#user-token-refresh-button').hide();
            $('#user-token-refresh-success').hide();
		    $('#user-token-refresh-confirm-container').show();
            $('#user-token-yes-button').focus();

            $('#user-token-no-button').click(function(e) {
                $('#user-token-refresh-confirm-container').hide();
                $('#user-token-refresh-button').show();
                $('#user-token-refresh-button').focus();
                e.preventDefault();
            });
		    $('#user-token-yes-button').click(function() {
                userFunctions.refreshUserLongTermToken(this, function(result){
                    if ($('#user-token-reveal-button').html() == "Hide"){
                        $("#user_token_textarea").html(result.userLongTermToken);
                    }

                    document.getElementById("user_token_textarea").attributes.token.value = result.userLongTermToken;
                    let newExp = HBS.helpers.tokenExpiration.apply(this, [result.userLongTermToken]);
                    newExp = 'Token experation time: ' + newExp;
                    document.getElementById("user_token_expiration").innerHTML = newExp;
                    $("#user-token-copy-button").html("Copy");
                    $('#user-token-refresh-confirm-container').hide();
                    $('#user-token-refresh-success').show();
                    $('#user-token-refresh-button').show();

                });
            });
		    event.preventDefault();
        },
        createTabLoop: function(firstFocusableElement, lastFocusableElement) {
            document.addEventListener('keydown', function(e) {
                let isTabPressed = e.key === 'Tab' || e.keyCode === 9;

                if (!isTabPressed) {
                    return;
                }

                if (e.shiftKey) { // if shift key pressed for shift + tab combination
                    if ($(document.activeElement).is(firstFocusableElement)) {
                        lastFocusableElement.focus(); // add focus for the last focusable element
                        e.preventDefault();
                    }
                } else { // if tab key is pressed
                    if ($(document.activeElement).is(lastFocusableElement)) { // if focused has reached to last focusable element then focus first focusable element after pressing tab
                        firstFocusableElement.focus(); // add focus for the first focusable element
                        e.preventDefault();
                    }
                }
            });
            firstFocusableElement.focus();
        },
        revealToken: function(event){
            $('#user-token-refresh-success').hide();
            const tokenTextArea = document.getElementById("user_token_textarea");
            const type = $('#user-token-reveal-button').html();
            if (type == "Reveal"){
                const token = $('#user_token_textarea')[0].attributes.token.value;
                $(tokenTextArea).html(token);
                $("#user-token-reveal-button").html("Hide");
            } else {
                $(tokenTextArea).html("**************************************************************************************************************************************************************************************************************************************************************************************");
                $("#user-token-reveal-button").html("Reveal");
            }
            $(tokenTextArea).height($(tokenTextArea).prop('scrollHeight'));
        },
        closeDialog: function () {
            $("#modalDialog").hide();
        },
        render : function(){
            this.$el.html(this.template({user:this.user}));
        }
    });
    return profileView;
});