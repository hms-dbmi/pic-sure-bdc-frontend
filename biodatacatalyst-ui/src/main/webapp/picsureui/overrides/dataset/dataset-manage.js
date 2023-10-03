define([],  function(){
	return {
		actions: function(parentActions, self){
            const actions = { ...parentActions };
            actions.active.copy.style = "btn-primary";
            actions.active.view.style = "btn-primary";
            return actions;
        },
        renderExt: function(self){
            $("#toggle-archived-btn").removeClass("alternate");
            $("#toggle-archived-btn").addClass("btn-primary");
        }
    };
});