define(['jquery'],function($){
	let navigableViews = {};

	let currentView = undefined;

	/*
		This function routes global keypresses to the currentView if that view has
		registered for the specific key which was pressed. 
	*/
	let handleKeypress = function(event){
		if(currentView===undefined){
			return;
		}

		let eventsInScope = 
		_.map(
			_.filter(
				_.map(navigableViews[currentView]._events, 
					(h,e)=>{
						return e.split(' ')[0];
					}
				),
				(e)=>{
					return e.indexOf('keynav-')===0;
				}
			),
			(e)=>{
				return e.split("-")[1];
			}
		);

		if (eventsInScope.includes(event.key.toLowerCase())){
			navigableViews[currentView].trigger("keynav-"+event.key.toLowerCase(), event);
			event.preventDefault();
		}
	}

	/*
	    This function registers a constructed Backbone.View instance to handle global key
	    events.

	    The keyevents which a view expects to be notified must be registered using this.on(..) and 
	    the event name must be be prepended with 'keynav-'. 
	*/
	let addNavigableView = function(name, view){
		navigableViews[name] = view;
	}

	/*
		This function sets the name of the registered view to which keyevents should be
		directed.
	*/
	let setCurrentView = function(name){
		currentView = name;
	}

	/*
		This function gets the name of the registered view to which keyevents are currently being
		directed.
	*/
	let getCurrentView = function(){
		return currentView;
	}

	/*
	    This hook must be on the document object to catch special keys like the arrow keys.
	 */
	document.onkeydown = handleKeypress;

	return {
		addNavigableView : addNavigableView,
		setCurrentView : setCurrentView,
		getCurrentView : getCurrentView
	}
});