define(["output/outputPanel", "jquery", "picSure/settings", "underscore"], function(outputPanel, $, settings, _){
	jasmine.pp = function(obj){return JSON.stringify(obj, undefined, 2);};
	describe("outputPanel", function(){

		var outputPanelInstance;

		beforeEach(function(){
			outputPanelInstance = new outputPanel.View({model:new outputPanel.Model()});
			outputPanelInstance.render();
		})


		describe("as a module", function(){

			it("is an object with an instantiated Backbone view in it accessible by the name View and with a client id", function(){
				expect(outputPanelInstance.cid).toBeDefined();
			});

		});

		describe("renders", function(){
			it("provides a main spinner", function(){
				expect($('#spinner-total', outputPanelInstance.$el).html()).toBeDefined();
			});

		});
	});
});