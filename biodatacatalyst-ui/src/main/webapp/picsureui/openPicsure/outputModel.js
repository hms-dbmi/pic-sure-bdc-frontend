define(["backbone"], function(BB) {
    let studiesInfo = new BB.Collection;
    let outputModelDefaults = {
        totalPatients : 0,
        spinnerClasses: "spinner-medium spinner-medium-center ",
        spinning: false,
        studies: studiesInfo,
        renderCount : 0, 
        resources : {}
    };
    
    let OutputModel = BB.Model.extend({

    defaults: outputModelDefaults,
    spinAll: function(){
        this.set('spinning', true);
        this.set('queryRan', false);
    }
    });
    return new OutputModel();
});