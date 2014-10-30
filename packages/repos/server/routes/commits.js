'use strict';

var commits = require('../controllers/commits'); 

// The Package is past automatically as first parameter
module.exports = function(Repos, app, auth, database) {

    app.get('/:username/commits', commits.userCommits);
    app.get('/repos/:reposlug/commits', commits.repoCommits);
    app.get('/commits/:id', commits.getCommit);

    app.post('/commits', commits.createCommit);
};
