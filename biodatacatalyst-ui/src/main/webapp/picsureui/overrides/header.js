define([
	"common/keyboard-nav",
	"common/pic-dropdown",
	"common/menu-nav-controls",
	"search-interface/modal",
	"header/userProfile",
	"picSure/userFunctions",
],function (
	keyboardNav,
	dropdown,
	menuNavControls,
	modal,
	userProfile,
	userFunctions,
) {

	let headerTabs = undefined;

	/*
		Sets the navigable view and adds the selection class to the active tab.
	*/
	let tabsFocus = () => {
		keyboardNav.setCurrentView("headerTabs");
		headerTabs.querySelector('.header-btn.active').classList.add('selected');
	}

	/*
		If the tabs loose focus and the loss of focus is from something out side the #header-tabs div then
		we unset the navigable view. If a drodown is open it closes it. It also removes the selected class
		from any selected items.

		@param {e} The event that triggered the blur.
	*/
	let tabsBlur = (e) => {
		if (headerTabs && !headerTabs.contains(e.target)) {
			keyboardNav.setCurrentView(undefined);
		}
		dropdown.closeDropdown(e);
		const selectedTab = headerTabs.querySelector('.header-btn.selected');
		selectedTab && selectedTab.classList.remove('selected');
	}

	let openUserProfileModal = (e) => {
		keyboardNav.setCurrentView(undefined);
		userFunctions.meWithToken(this, (user) => {
			modal.displayModal(new userProfile(user), 'User Profile');
		});
	}

	return {
		/*
			* The path to a logo image incase you don't want the default PrecisionLink one.
			* 
			* This should be a String value.
			*/
		logoPath: undefined,
		renderExt: function (view) {
			//Override the core UI click #user-profile-btn event
			view.delegateEvents(_.extend(view.events, { "click #user-profile-btn": openUserProfileModal }));
			dropdown.init(view, [
				{ 'click #help-dropdown': dropdown.openDropdown },
				{ 'focus #help-dropdown': dropdown.dropdownFocus },
				{ 'focus #help-dropdown-toggle': dropdown.dropdownFocus },
				{ 'blur #help-dropdown': dropdown.dropdownBlur }
			]);
			menuNavControls.init(view);
			headerTabs = view.el.querySelector('#header-tabs');
			headerTabs.addEventListener('focus', tabsFocus);
			headerTabs.addEventListener('blur', tabsBlur);
			view.on({
				'keynav-arrowup document': menuNavControls.upKeyPressed,
				'keynav-arrowdown document': menuNavControls.downKeyPressed,
				'keynav-arrowright document': menuNavControls.rightKeyPressed,
				'keynav-arrowleft document': menuNavControls.leftKeyPressed,
				'keynav-enter': menuNavControls.selectItem,
				'keynav-space': menuNavControls.selectItem,
				'keynav-escape': menuNavControls.escapeKeyPressed,
				'keynav-home': menuNavControls.homeKeyPressed,
				'keynav-end': menuNavControls.endKeyPressed,
				'keynav-letters': menuNavControls.letterKeyPressed,
			});
			if (!keyboardNav.navigableViews || !keyboardNav.navigableViews['headerTabs']) {
				keyboardNav.addNavigableView("headerTabs", view);
			}
		},
	};
});