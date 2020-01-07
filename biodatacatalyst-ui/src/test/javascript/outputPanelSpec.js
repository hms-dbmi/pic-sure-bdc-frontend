define(["output/outputPanel", "jquery", "text!../settings/settings.json", "underscore"], function(outputPanel, $, settingsJson, _){
	jasmine.pp = function(obj){return JSON.stringify(obj, undefined, 2);};
	var settings = JSON.parse(settingsJson);
	describe("outputPanel", function(){
		
		describe("as a module", function(){
			
			it("is an object with an instantiated Backbone view in it accessible by the name View and with a client id", function(){
				expect(outputPanel.View.cid).toBeDefined();
			});			
			
		});
		
		describe("renders", function(){
			beforeEach(function(){
				outputPanel.View.render();
			})
			
			it("provides a main spinner", function(){
				expect($('#spinner-total', outputPanel.View.$el).html()).toBeDefined();
			});
			
		});
	});
});