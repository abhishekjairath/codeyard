'use strict';

/*
 * Defining the Package
 */
var mean = require('meanio'),
    Module = mean.Module,
    favicon = require('serve-favicon'),
    express = require('express'),
    redis = require("redis"),
    client = redis.createClient(),
    io;


var System = new Module('system');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
System.register(function(app, auth, database) {
  mean.resolve(function(http){
    io = require('socket.io')(http);
    mean.register('io',io);
    io.on('connection',function (socket){
      console.log("IO initiated");
      console.log(socket.id);
      socket.on('setClient',function(data){
        client.set(data,socket.id, function(err){
          if(err)
            console.log('Error setting user and socket');
          else
            console.log('CLient set successfully');
        });
      });
      socket.on('disconnect',function(){
        console.log("Disconnected " + socket.id);
      });
    }); 
  });
  
  System.menus.add({
    title: 'Dashboard',
    link: 'home',
    roles: ['authenticated'],
    menu: 'main'
  });
  //We enable routing. By default the Package Object is passed to the routes
  System.routes(app, auth, database,io);

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
