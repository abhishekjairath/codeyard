'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Repos = new Module('repos');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Repos.register(function(app, auth, database) {

  //We enable routing. By default the Package Object is passed to the routes
  Repos.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  Repos.menus.add({
    title: 'Repositories',
    link: 'repos',
    roles: ['authenticated'],
    menu: 'main'
  });
  Repos.menus.add({
    title: 'Articles',
    link: 'repos.articles',
    roles: ['authenticated'],
    menu: 'main'
  });

  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Repos.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Repos.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Repos.settings(function(err, settings) {
        //you now have the settings object
    });
    */
  Repos.aggregateAsset('css','repos.css');
  return Repos;
});
