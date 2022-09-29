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
        initialize: function(){
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
        },
        initChardinJs: function() {
            this.loadingScreen = showFullScreenLoadingView($);
            //Artificial delay to allow the set up render finish rendering. chardin seems to be slow to find new elements.
			delay(2750).then(()=> { //TODO: find a better way to do this
                this.overlay =  $('body').chardinJs({ url: './search-interface/guide-me.json'})
                delay(500).then(() => this.startTour()); //Delay again because chardin is slow to get elements
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
            this.initChardinJs();
        }
    });
    return TourView;
});
