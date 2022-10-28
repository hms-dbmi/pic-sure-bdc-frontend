define([
    'jquery',
    'backbone',
    "chardin",
    'common/keyboard-nav',
], function($, BB, chardin, keyboardNav) {
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
    };
    let TourView = BB.View.extend({
        initialize: function(opts){
            this.opts = opts;
            this.retry = true;
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
            Backbone.pubSub.on('destroySearchView', this.destroy.bind(this));
            Backbone.pubSub.on('searchResultsRenderCompleted', _.once(this.initChardinJs.bind(this)));
        },
        initChardinJs: function() {
            let callback = () => {
                this.checkIfPreRenderCompleted(this.opts.idsToWaitFor).then(() => {
                    this.checkIfOverlayIsReady().then((overlay) => {
                        this.startTour(overlay);
                        this.stopListening(Backbone.pubSub, 'searchResultsRenderCompleted');
                    }).catch((err) => {
                        if (err === false) {
                            this.retry = false;
                            this.initChardinJs();
                            return;
                        }
                        console.error(err);
                        alert('There was an error starting the tour. Please refresh the page and try again.');
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
                const timeoutCount = 10;
                let count = 0;
                let elementsToWaitFor = idsToWaitFor.map(elementId => document.getElementById(elementId)).filter(element => element); // filter out nulls
                if (elementsToWaitFor.length>0) {
                    let interval = setInterval(function() {
                        if (elementsToWaitFor.every((element) => element.isConnected === true)) {
                            clearInterval(interval);
                            resolve();
                        } else if (count === 3 || count === 6 || count === 9) { // If the node isnt connected after 1.5 seconds update the element reference.
                            elementsToWaitFor = idsToWaitFor.map(elementId => document.getElementById(elementId)).filter(element => element); // filter out nulls
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
            let retry = this.retry;
            return new Promise(function(resolve, reject) {
                const timeoutCount = 15;
                let count = 0;
                let interval = setInterval(function() {
                    let overlay = $('body').chardinJs({ url: './search-interface/guide-me.json'});
                    if (overlay && overlay.sequencedItems && overlay.data_helptext) {
                        if (overlay.sequencedItems.toArray().every((element) => element.isConnected === true)) {
                            clearInterval(interval);
                            resolve(overlay);
                        } else if (retry && count === timeoutCount) {
                            retry = false;
                            $('body').chardinJs('refresh');
                            clearInterval(interval);
                            reject(retry);
                        }
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
        startTour: async function(overlay) {
            overlay.start();
            //delay to allow loading screen to close exactly when chardin animates.
            delay(250).then($(this.loadingScreen).remove());
            this.addKeyboardNav();
		},
        stopTour: function() {
            $('body').chardinJs('stop');
        },
        destroy: function(){
			//https://stackoverflow.com/questions/6569704/destroy-or-remove-a-view-in-backbone-js/11534056#11534056
			this.undelegateEvents();
            Backbone.pubSub.off('searchResultsRenderCompleted');
			$(this.el).removeData().unbind(); 
			this.remove();  
			Backbone.View.prototype.remove.call(this);
		},
        render: function(){
          this.loadingScreen = showFullScreenLoadingView($);
        }
    });
    return TourView;
});
