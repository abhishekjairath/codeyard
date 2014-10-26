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


/**************************************/
  app.post('/repos', repos.createRepo);
  app.delete('/repos/:reposlug', repos.deleteRepo);
  app.get('/repos/:reposlug', repos.getRepo);
  app.get('/:username/repos/view', repos.viewAll);
  app.put('/repos/:reposlug', repos.update);

  /************************************/
  app.post('/repos/file', repos.uploadFile);
  app.get('/repos/file/:filepath', repos.getFile);
  app.delete('/repos/file', repos.deleteFile);


  /************************************/
  app.post('/repos/folder', repos.createFolder);

  app.post('/repos/repo',repos.uploadRepo);
  app.post('/repos/:repoid/collaborators', repos.addCollab);
};
