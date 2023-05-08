define(["jquery","backbone", "handlebars", "text!openPicsure/studiesPanel.hbs", "openPicsure/outputModel",
        "common/keyboard-nav","search-interface/open-picsure-tag-help-view", "search-interface/modal",
        "common/pic-sure-dialog-view"],
		function($, BB, HBS, studiesPanelTemplate, outputModel, keyboardNav, helpView, modal, dialog) {
    const LIST_ITEM = 'study-container';
    const SELECTED = 'selected';

	let studiesPanelView = BB.View.extend({
        initialize: function(opts){
            this.data = opts || {};
            this.helpView = new helpView();
            this.template = HBS.compile(studiesPanelTemplate);
            keyboardNav.addNavigableView('studies-list',this);
            this.on({
                'keynav-arrowup document': this.navigateUp.bind(this),
                'keynav-arrowdown document': this.navigateDown.bind(this),
                'keynav-arrowright document': this.navigateDown.bind(this),
                'keynav-arrowleft document': this.navigateUp.bind(this),
                'keynav-enter': this.clickItem.bind(this),
            });
        },
        events:{
          "click .study-glyph": "toggleConsentGroup",
          "click .consent-grouping": "toggleConsentGroup",
          "mouseover .request-access": "highlightConsent",
          "mouseout .request-access": "unhighlightConsent",
          "focus .panel-body": "focusBody",
          "blur .panel-body": "blurBody",
          'click #studies-help' : 'openHelpModal',
          "keypress #studies-help": "openHelpModal",
          'click .request-access': 'requestAccess',
        },
		toggleConsentGroup: function(event) {
			var studyRoot = event.currentTarget.parentElement.parentElement;
			$(studyRoot).toggleClass("study-shown");
			var glyph = $('.study-glyph', studyRoot); 
			glyph.toggleClass("glyphicon-chevron-up");
			glyph.toggleClass("glyphicon-chevron-down");
		},
		highlightConsent: function(event) {
			event.currentTarget.parentElement.style.background = "#ddd";
		},
		unhighlightConsent: function(event) {
			event.currentTarget.parentElement.style.background = "";
		},
        requestAccess: function(event) {
            let target = event.currentTarget;
            if (event.type === 'keydown') {
                target = $('#studies-list').find('.' + SELECTED).find('.request-access')[0];
            }

            redirectModal(target.getAttribute("data-href"), dialog, modal);
        },
        exploreAccess: function(event) {
            window.history.pushState({}, "", "picsureui/queryBuilder");
        },
        clickItem: function(event) {
            let target = event.target;
			if (event.type === 'keydown') {
                target = $('#studies-list').find('.' + SELECTED).find('.request-access')[0];
            }
            if (target.classList.contains('request-access')) {
                this.requestAccess(event);
            } else {
                this.exploreAccess(event);
            }
        },
        focusBody: function(event) {
            keyboardNav.setCurrentView('studies-list');
            this.$el.find('.study-container:first').addClass(SELECTED);
        },
        blurBody: function(event) {
            this.$el.find('.'+SELECTED).removeClass(SELECTED);
            keyboardNav.setCurrentView(null);
        },
        navigateUp: function(e) {
            console.log("navigate up", e);
            let selectionItems = e.target.querySelectorAll('.' + LIST_ITEM);
                let selectedItem = $(selectionItems).filter('.' + SELECTED);
                if ($(selectedItem).length <= 0) {
                    $(selectionItems).eq(0).addClass(SELECTED);
                    return;
                }
                let index = $(selectionItems).index(selectedItem);
                let nextItem = $(selectionItems).eq(index - 1);
                if (nextItem.length > 0) {
                    selectedItem.removeClass(SELECTED);
                    selectedItem.attr('aria-selected', false);
                    nextItem.addClass(SELECTED);
                    nextItem.attr('aria-selected', true);
                    nextItem.attr('aria-live', "polite");
                    $(nextItem)[0].scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
                }
        },
        navigateDown: function(e) {
            console.log("navigate up", e);
            let selectionItems = e.target.querySelectorAll('.' + LIST_ITEM);
            let selectedItem = $(selectionItems).filter('.' + SELECTED);
            if ($(selectedItem).length <= 0) {
                $(selectionItems).eq(0).addClass(SELECTED);
                return;
            }
            let index = $(selectionItems).index(selectedItem);
            nextItem = (index === selectionItems.length - 1) ? $(selectionItems).eq(0) : $(selectionItems).eq(index + 1);
            if (nextItem.length > 0) {
                selectedItem.removeClass(SELECTED);
                selectedItem.attr('aria-selected', false);
                nextItem.addClass(SELECTED);
                nextItem.attr('aria-selected', true);
                nextItem.attr('aria-live', "polite");
                $(nextItem)[0].scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
            }
        },
        openHelpModal: function(event) {
            if (event.type === "keypress" && !(event.key === ' ' || event.key === 'Enter')) {
				return;
			}
			modal.displayModal(
                this.helpView,
                'Filtered Results by Study',
                () => {
                    $('#patient-count-box').focus();
                }, {isHandleTabs: true}
            );
		},
        render: function() {
            console.log("rendering studies panel   ", outputModel.toJSON());
            this.$el.html(this.template(outputModel.toJSON()));
            return this;
        }
    });
    return studiesPanelView;
});
