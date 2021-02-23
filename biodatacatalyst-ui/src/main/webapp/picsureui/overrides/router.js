define(["studyAccess/studyAccess","common/startup"], function(studyAccess, startup){
    return {
        routes : {
            /**
             * Additional routes for the backbone router can be defined here. The field name should be the path,
             * and the value should be a function.
             *
             * Ex:
             * "picsureui/queryBuilder2" : function() { renderQueryBuilder2(); }
             */
            "picsureui/dataAccess" : function() {
                $('#main-content').empty();
                var studyAccessView = new studyAccess.View;
                studyAccessView.render();
                $('#main-content').append(studyAccessView.$el);
            },
            "picsureui/openAccess" : function() {
                $('#main-content').empty();
                startup();
            }
        }
    };
});