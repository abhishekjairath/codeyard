'use strict';

var commits = require('../controllers/commits'); 

// The Package is past automatically as first parameter
module.exports = function(Repos, app, auth, database, io) {

    app.get('/:username/commits', function(req,res,io){
    	commits.userCommits(req,res,io,function(err,result){
    		if(err)
    			res.send('Error occured');
    		else
    			res.jsonp(result);
    	});
    });

    app.get('/repos/:reposlug/commits', commits.repoCommits);
    app.get('/commits/:id', commits.getCommit);
    app.post('/commits', commits.createCommit);
    //app.get(':username/commitscount', commits.commitsCount);
    app.get('/commits/latest/:username',commits.threeLatestCommits);
    app.get('/commits/max/:username',commits.maxRepoCommits);
    app.get('/commits/calendar/:username',commits.calendarCommits);
};
