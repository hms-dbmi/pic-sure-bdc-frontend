define(["common/keyboard-nav","common/pic-dropdown", "common/menu-nav-controls"], function(keyboardNav, dropdown, menuNavControls) {
	
	let headerTabs = undefined;

	/*
		Sets the navigable view and adds the selection class to the active tab.
	*/
	let tabsFocus = (e) => {
		console.debug("tabsFocus", e.target);
		keyboardNav.setCurrentView("headerTabs");
		dropdown.isOpen() ? e.target.querySelector('.header-btn.nav-dropdown').classList.add('selected') : headerTabs.querySelector('.header-btn.active').classList.add('selected');
	}

	/*
		If the tabs loose focus and the loss of focus is from something out side the #header-tabs div then
		we unset the navigable view. If a drodown is open it closes it. It also removes the selected class
		from any selected items.

		@param {e} The event that triggered the blur.
	*/
	let tabsBlur = (e) => {
		console.log("tabsBlur", e);
		keyboardNav.setCurrentView(undefined);
		const selectedTab = headerTabs.querySelector('.header-btn.selected');
		selectedTab && selectedTab.classList.remove('selected');
		if (!e.relatedTarget) {
			dropdown.closeDropdown(e);
		}
	}

	return {
		/*
		 * The path to a logo image incase you don't want the default PrecisionLink one.
		 * 
		 * This should be a String value.
		 */
		logoPath : undefined,
		renderExt: function(view){
			dropdown.init(view, [
				{'click #help-dropdown-toggle': dropdown.toggleDropdown}, 
				{'blur .nav-dropdown-menu': dropdown.dropdownBlur}
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
			if (!keyboardNav.navigableViews || !keyboardNav.navigableViews['headerTabs']){
				keyboardNav.addNavigableView("headerTabs", view);
			}
		},
	};
});