define([], function(){
    return {
        routes : {
            /**
             * Additional routes for the backbone router can be defined here. The field name should be the path,
             * and the value should be a function.
             *
             * Ex:
             * "picsureui/queryBuilder2" : function() { renderQueryBuilder2(); }
             */
            "picsureui/dataAccess" : function() { console.log("Data acess page"); }
        }
    };
});