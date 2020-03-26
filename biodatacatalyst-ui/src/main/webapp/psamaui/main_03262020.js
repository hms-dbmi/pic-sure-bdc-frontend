/* 
 *  This overrides the main.js from psama so that we can inject more of our own styling changes.
 *  It should end up being copied over the existing file
 */

require.config({
  baseUrl: "/psamaui/",
  urlArgs: "release_date=03262020",
  paths: {
    jquery: 'webjars/jquery/3.3.1/jquery.min',
    underscore: 'webjars/underscorejs/1.8.3/underscore-min',
    handlebars: 'webjars/handlebars/4.0.5/handlebars.min',
    bootstrap: 'webjars/bootstrap/3.3.7-1/js/bootstrap.min',
    bootstrapStyles: 'webjars/bootstrap/3.3.7-1/css/bootstrap.min.css',
    backbone: 'webjars/backbonejs/1.3.3/backbone-min',
    text: 'webjars/requirejs-text/2.0.15/text',
    Noty: 'webjars/noty/3.1.4/lib/noty',
    userManagement: "userManagement/",
    common: "common/",
    tos: "tos/",
	"header/header" : "overrides/floatheader/floatheader"
  },
  shim: {
    "bootstrap": {
      deps: ["jquery"]
    }
  }
});

require(["backbone", "common/session", "common/router", "common/styles", "underscore", "jquery", "bootstrap"],
  function(Backbone, session, router, styles, _) {
    Backbone.history.start({
      pushState: true
    });
    document.onmousemove = session.activity;
    document.onkeyup = session.activity;
  });
