define(["jquery", "common/keyboard-nav"],function($, keyboardNav){
    let view = undefined;

    const OPEN = 'open';
    const SELECTED = 'selected';
    const SECLECTED_CLASS = '.' + SELECTED;
    const NAV_DROPDOWN_MENU_CLASS = '.nav-dropdown-menu';
    const OPEN_NAV_DROPDOWN_CLASS = NAV_DROPDOWN_MENU_CLASS + '.' + OPEN;

    /*
        Initialize the dropdown menu with the provided view. Adds any events needed for the dropddown to the view.

        @param {view} The view that the dropdown menu is being added to.
        @param {events} An array of events that the dropdown menu should listen for.
    */
    let init = (view, events) => {
        if (view.el) {
            setView(view);
            events && events.forEach(event => getView().delegateEvents(_.extend(getView().events, event)));
        } else {
            console.error('view is undefined');
        }
    }

    /*
        
    */
    let dropdownFocus = (e) => {
        console.debug("subMenuFocus");
        const selectedTab = e.target.closest('.header-btn');
        const currentView = keyboardNav.getCurrentView();
        if (selectedTab && !currentView) {
            let viewName = selectedTab.parentElement.id;
            const dashLoc = viewName.indexOf('-');
            viewName = viewName.substring(0,dashLoc) + viewName.charAt(dashLoc+1).toUpperCase() + viewName.substring(dashLoc+2);
            keyboardNav.setCurrentView(viewName);
        }
        selectedTab.classList.add('selected');
    }

    let dropdownBlur = (e) => {
        console.debug("subMenuBlur");
        const selectedItems = getView().el.querySelectorAll(SECLECTED_CLASS);
        selectedItems && selectedItems.forEach(item => item.classList.remove(SELECTED));
        closeDropdown(e);
    }

    let openDropdown = (e) => {
        console.debug("openDropdown", e.target);
        if (e.target.nodeName === 'A') {
            window.open(e.target.href, '_blank');
            return;
        }
        let tab = e.target.nodeName === 'SPAN' ? e.target.parentElement : e.target;
        let dropdown = tab.querySelector(NAV_DROPDOWN_MENU_CLASS);
        if (dropdown.classList.contains(OPEN)) {
            dropdown.classList.remove(OPEN);
        } else {
            dropdown.classList.add(OPEN);
            $(dropdown).offset({
                top: $(tab).parent().offset().top + $(tab).parent().outerHeight(), 
                left: $(tab).offset().left
            });
        }
    }

    let closeDropdown = (e) => {
        console.debug("closeDropdown");
        const dropdown = getView().el.querySelector(OPEN_NAV_DROPDOWN_CLASS);
        if (dropdown) {
            const selectedOption = dropdown.querySelector(SECLECTED_CLASS);
            selectedOption && selectedOption.classList.remove(SELECTED);			
            dropdown.classList.remove(OPEN);
        }
    }

    let getView = () => {
        return view;
    }

    let setView = (newView) => {
        view = newView;
    }

    return {
        init: init,
        getView: getView,
        setView: setView,
        dropdownFocus: dropdownFocus,
        dropdownBlur: dropdownBlur,
        openDropdown: openDropdown,
        closeDropdown: closeDropdown
    };
});