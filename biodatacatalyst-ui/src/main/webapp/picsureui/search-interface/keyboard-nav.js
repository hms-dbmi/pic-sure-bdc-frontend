define(['jquery'],function($){
	let navigableViews = {};

	let currentView = undefined;

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
	let addNavigableView = function(name, view){
		navigableViews[name] = view;
	}
	let setCurrentView = function(name){
		currentView = name;
	}
	let getCurrentView = function(){
		return currentView;
	}

	document.onkeydown = handleKeypress;

	return {
		addNavigableView : addNavigableView,
		setCurrentView : setCurrentView,
		getCurrentView : getCurrentView
	}
});