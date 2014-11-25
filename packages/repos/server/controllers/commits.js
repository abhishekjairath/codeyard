'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  	User = mongoose.model('User'),
  	Repo = mongoose.model('Repo'),
  	Commit = mongoose.model('Commit'),
  	async = require('async'),
  	config = require('meanio').loadConfig(),
  	repoPath = config.repoPath;

exports.userCommits = function (req,res,io,cb){
	var username = req.params.username,
		result = {};

	User.findOne({username:username},'name username commits').populate('commits','desc repo created').exec(function(err,response){
		if(err){
			console.log(err);
			result = {
				'error':1,
				'error_msg':'There was an error while fetching commits of the use'
			};
		}
		else{
			result = {
				'error':0,
				'error_msg':null,
				'response':response
			};
		}
		cb(null,result);
	});
};

exports.repoCommits = function(req,res){
	var reposlug = req.params.reposlug,
		result = {};
	Repo.find({slug:reposlug},'slug commits').populate('commits').exec(function(err,response){
		if(err){
			console.log(err);
			result = {
				'error':1,
				'error_msg':'There was an error while fetching commits for the repo.'
			};
		}
		else{
			result = {
				'error':0,
				'error_msg':null,
				'response':response
			};
		}
		res.jsonp(result);
	});
};

exports.getCommit = function(req,res){
	var id = req.params.id,
		result = {};

	Commit.findOne({_id:id},function(err,response){
		if(err){
			console.log(err);
			result = {
				'error':1,
				'error_msg':'There was an error while fetching the commit info.'
			};
		}
		else{
			result = {
				'error':0,
				'error_msg':null,
				'response':response
			};
		}
		res.jsonp(result);
	});
};

exports.createCommit = function(req,res){
	var commit = new Commit(),
		result = '';


	commit.desc = req.body.desc;
	commit.contributor.userid = req.user._id;
	commit.contributor.username = req.user.username;
	commit.repo.reposlug = req.body.reposlug;
	commit.repo.repoid = req.body.repoid;

	async.series([
		function(callback){
        	commit.save(function(err,response){
				if(err){
					console.log(err)
					callback(err, 'fail');
				}
				else{
					callback(null,'success');
				}
			});
    	},
    	function(callback){
    		User.findOneAndUpdate({_id:req.user._id},{$addToSet:{commits:commit._id}},function(err,response){
    			if(err){
    				console.log(err);
    				callback(err,'fail');
    			}
    			else{
    				callback(null,'success');
    			}
    		});
    	},
    	function(callback){
    		Repo.findOneAndUpdate({slug:'lana-ki-repo'},{updated:Date.now(),$addToSet:{commits:commit._id}},function(err,response){
    			if(err){
    				console.log(err);
    				callback(err,'fail');
    			}
    			else{
    				callback(null,'success');
    			}
    		});
    	}
    ],
	function(err, results){
    	res.send(200,'Commit saved.');
	});
};

exports.commitsCount = function(req,res){
	var username = req.params.username,
		result = {};

	Commit.find({'contributor.username':username}).sort('-created').exec(function(err,response){
		if(err){
			console.log(err);
			result = {
				'error':1,
				'error_msg':'There was an error while fetching commit calender.'
			};
		}
		else{
			result = {
				'error':0,
				'error_msg':null,
				'result':response
			};
		}
	});
};

exports.threeLatestCommits = function (req,res){
	var result = {};
	Commit.find({'user.username':req.params.username},'created desc').sort({created: -1}).limit(3).exec(function(err,response){
		if(err){
			console.log(err);
			result = {
				'error':1,
				'error_msg':'There was an error while fetching commits of the use'
			};
		}
		else{
			result = {
				'error':0,
				'error_msg':null,
				'response':response
			};
		}
		res.jsonp(result);
	});
};

exports.maxRepoCommits = function (req,res){
	var result = {};
	Commit.aggregate([{$match:{"user.username":req.params.username}},{$group:{ _id: "$repo.slug", count: { $sum: 1 }}}])
	.exec(function(err,response){
		if(err){
			console.log(err);
			result = {
				'error':1,
				'error_msg':'There was an error while fetching commits of the use'
			};
		}
		else{
			result = {
				'error':0,
				'error_msg':null,
				'response':response
			};
		}
		res.jsonp(result);
	});
};

exports.calendarCommits = function(req,res){
    var result = {};
    var from = new Date(req.query.from);
    var to = new Date(req.query.to);
    Commit.aggregate([{$match:{"user.username":req.params.username,created:{$gte:from,$lt:to}}}
    	,{	$group:{
    		    _id:{day:{$dayOfYear:"$created"},year:{$year:"$created"}},
    		    count:{$sum:1},
    		    commits: {$push:{desc:"$desc",repo:"$repo.slug",id:"$_id"}}
    	    }
    }]).exec(function(err,response){
		if(err){
			console.log(err);
			result = {
				'error':1,
				'error_msg':'There was an error while fetching commits of the use'
			};
		}
		else{
			result = {
				'error':0,
				'error_msg':null,
				'response':response
			};
		}
		res.jsonp(result);
	});
};