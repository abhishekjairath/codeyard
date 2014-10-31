'use strict';

// Requires meanio
var mean = require('meanio');

// Creates and serves mean application
mean.serve({ /*options placeholder*/ }, function(app, config) {
	var port = config.https && config.https.port ? config.https.port : config.http.port;
	console.log('Mean app started on port ' + port + ' (' + process.env.NODE_ENV + ')');
	mean.resolve(function(http){
    	var io = require('socket.io')(http);

    	io.on('connection', function(){
      		console.log('Now connected to socket in the system.js');
    	});

    	mean.register('io',io);
  	});

});
