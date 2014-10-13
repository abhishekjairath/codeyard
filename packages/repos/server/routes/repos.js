'use strict';

var repos = require('../controllers/repos'); 

// The Package is past automatically as first parameter
module.exports = function(Repos, app, auth, database) {

  app.get('/repos/example/anyone', function(req, res, next) {
    res.send('Anyone can access this');
  });

  app.get('/repos/example/auth', auth.requiresLogin, function(req, res, next) {
    res.send('Only authenticated users can access this');
  });

  app.get('/repos/example/admin', auth.requiresAdmin, function(req, res, next) {
    res.send('Only users with Admin role can access this');
  });

  app.get('/repos/example/render', function(req, res, next) {
    Repos.render('index', {
      package: 'repos'
    }, function(err, html) {
      //Rendering a view from the Package server/views
      res.send(html);
    });
  });

  app.post('/repos/create', repos.createRepo);
  app.post('/repos/delete', repos.deleteRepo);
  app.post('/repos/upload', repos.uploadFile);
  app.post('/repos/create/folder', repos.createFolder);
};
