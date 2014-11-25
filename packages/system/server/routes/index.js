'use strict';

module.exports = function(System, app, auth, database,io) {

  // Home route
  var index = require('../controllers/index'),
  	redis = require("redis"),
    client = redis.createClient();
  app.route('/')
    .get(index.render);

  app.get('/stats',index.getStats);


//Redis cy-pullcommits channel listener and socket emitter

/*client.subscribe('cy-pullcommits');
client.on("subscribe", function (channel, count) {
	console.log('Now subscribeed to channel '+ channel);
	mean.resolve(function(io){
		io = io;
	});
});
client.on("message", function (channel, message) {
    console.log(message);
    //io.to(socket.id).emit('commit_done',message);
});*//*
var queueListener = function(){
  client.lpop('hotqueue:cpull',function(err,res){
    res = JSON.parse(res);
    if(res){
      client.get(res.userid,function(err,socket){
      io.to(socket).emit('commit_done',res.commitid);
      });
    } 
  });
  setInterval(queueListener,15000);
};*/
};
