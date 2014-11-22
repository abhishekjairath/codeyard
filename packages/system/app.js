'use strict';

/*
 * Defining the Package
 */
var mean = require('meanio'),
    Module = mean.Module,
    favicon = require('serve-favicon'),
    express = require('express');

var System = new Module('system');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
System.register(function(app, auth, database) {

  mean.resolve(function(http){
    var io = require('socket.io')(http);
    mean.register('io',io);
  });

  System.menus.add({
    title: 'Dashboard',
    link: 'home',
    roles: ['authenticated'],
    menu: 'main'
  });
  //We enable routing. By default the Package Object is passed to the routes
  System.routes(app, auth, database);

  System.aggregateAsset('css', 'common.css');

  // The middleware in config/express will run before this code

  // Set views path, template engine and default layout
  app.set('views', __dirname + '/server/views');

  // Setting the favicon and static folder
  app.use(favicon(__dirname + '/public/assets/img/favicon.ico'));

  // Adding robots and humans txt
  app.use(express.static(__dirname + '/public/assets/static'));

  return System;
});
