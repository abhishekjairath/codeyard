'use strict';

var mean = require('meanio'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Repo = mongoose.model('Repo'),
    redis = require("redis"),
    client = redis.createClient(),
    io = mean.resolve(function(io){return io;}),
    cymain = io.of('/cymain');




exports.render = function(req, res) {

  var modules = [];
  // Preparing angular modules list with dependencies
  for (var name in mean.modules) {
    modules.push({
      name: name,
      module: 'mean.' + name,
      angularDependencies: mean.modules[name].angularDependencies
    });
  }

  function isAdmin() {
    return req.user && req.user.roles.indexOf('admin') !== -1;
  }

  // Send some basic starting info to the view
  res.render('index', {
    user: req.user ? {
      name: req.user.name,
      _id: req.user._id,
      username: req.user.username,
      roles: req.user.roles
    } : {},
    modules: modules,
    isAdmin: isAdmin,
    adminEnabled: isAdmin() && mean.moduleEnabled('mean-admin')
  });
};

exports.getStats = function(req,res){
  var stats = {};
  User.count({},function(err,userCount){
    Repo.count({},function(error,repoCount){
      res.jsonp(stats = {users:userCount,repos:repoCount});
    });
  });
};

exports.socketHandler = function(req){
  console.log("In the handler");
  cymain.on('connection', function(socket){
      console.log(socket.id);
      console.log(req.user._id);
      //console.log(io.sockets.connected[socket.id]);
      client.set(req.user._id,socket.id,function(err){
        if(err)
          console.log(err);
      });

      socket.on('disconnect',function(){
        console.log("Disconnected " + socket.id);
      });
    });
};
