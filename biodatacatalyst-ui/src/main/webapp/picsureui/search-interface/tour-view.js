define([
    'jquery',
    'backbone',
    "chardin",
    'common/keyboard-nav',
    "text!../search-interface/guide-me.json",
], function($, BB, chardin, keyboardNav, tourJson) {
    const CHARDIN_SELECTOR = '#chardin-mask';
    const delay = function(t, v) {
        return new Promise(function(resolve) { 
            setTimeout(resolve.bind(null, v), t);
        });
    };
    const showFullScreenLoadingView = function($) {
        let loadingScreen = document.createElement('div');
        let spinnerHolder = document.createElement('div');
        loadingScreen.id = '#full-screen-loading';
        spinnerHolder.id = '#full-screen-spinner-holder';
        loadingScreen.classList += ' loading';
        spinnerHolder.classList += ' spinner spinner-large spinner-center spinner-vert-center';
        loadingScreen.append(spinnerHolder);
        $('body').append(loadingScreen);
        return loadingScreen;
    }
    var TourView = BB.View.extend({
        initialize: function(opts){
            this.opts = opts;
            keyboardNav.addNavigableView('chardinJs', this);
            this.on({
              'keynav-arrowup document': this.prevStep.bind(this),
              'keynav-arrowdown document': this.nextStep.bind(this),
              'keynav-arrowright document': this.nextStep.bind(this),
              'keynav-arrowleft document': this.prevStep.bind(this),
              'keynav-enter': this.nextStep.bind(this),
              'keynav-space': this.nextStep.bind(this),
              'keynav-escape': this.stopTour.bind(this),
            });
            Backbone.pubSub.on('searchResultsRenderCompleted', _.once(this.initChardinJs.bind(this)));
        },
        initChardinJs: function() {
            let callback = () => {
                this.checkIfPreRenderCompleted(this.opts.idsToWaitFor).then(() => {
                    this.checkIfOverlayIsReady().then(() => {
                        this.startTour();
                        this.stopListening(Backbone.pubSub, 'searchResultsRenderCompleted');
                    }).catch((err) => {
                        console.error(err);
                        this.loadingScreen.remove();
                    });
                }).catch((err) => {
                    console.error(err);
                    this.loadingScreen.remove();
                });
            };
            $(document).ready(callback);
		},
        checkIfPreRenderCompleted: function(idsToWaitFor = []) {
            return new Promise(function(resolve, reject) {
                const timeoutCount = 15;
                let count = 0;
                const elementsToWaitFor = idsToWaitFor.map(elementId => document.getElementById(elementId));
                if (elementsToWaitFor.length>0) {
                    let interval = setInterval(function() {
                        if (elementsToWaitFor.every(element => element.isConnected === true || document.body.contains(element))) {
                            clearInterval(interval);
                            resolve();
                        }
                        if (count === timeoutCount) {
                            clearInterval(interval);
                            reject("Tour failed to load. (PreRender)");
                        }
                        count++;
                    }, 500);
                } else {
                    resolve();
                }
            });
        },
        checkIfOverlayIsReady: function() {
            return new Promise(function(resolve, reject) {
                const timeoutCount = 10;
                let count = 0;
                let interval = setInterval(function() {
                    let overlay = $('body').chardinJs({ url: './search-interface/guide-me.json'});
                    if (overlay && overlay.data_helptext) {
                        clearInterval(interval);
                        resolve();
                    }
                    if (count === timeoutCount) {
                        clearInterval(interval);
                        reject("Tour failed to load. (overlay)");
                    }
                    count++;
                }, 500);
            });
        },
        addKeyboardNav: function(){
            keyboardNav.setCurrentView('chardinJs');
        },
        removeKeyboardNav: function(){
            keyboardNav.setCurrentView(undefined);
        },
        nextStep: function() {
            $(CHARDIN_SELECTOR).click();
        },
        prevStep: function() {
            const shiftClick = $.Event('click');
            shiftClick.shiftKey = true;
            $(CHARDIN_SELECTOR).trigger(shiftClick);
        },
        startTour: async function() {
            $('body').chardinJs('start');
            //delay to allow loading screen to close exactly when chardin animates.
            delay(250).then($(this.loadingScreen).remove());
            this.addKeyboardNav();
		},
        stopTour: function() {
            $('body').chardinJs('stop');
        },
        render: function(){
          this.loadingScreen = showFullScreenLoadingView($);
        }
    });
    return TourView;
});
