'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Repo = mongoose.model('Repo'),
  async = require('async'),
  config = require('meanio').loadConfig(),
  crypto = require('crypto'),
  nodemailer = require('nodemailer'),
  fs = require('fs'),
  makeslug = require('slug');


var createSlug = function(type,repoName,callback){
	var max = 9999;
	var min = 1000;
	var newslug = makeslug(repoName).toLowerCase();
	if(type == 'repo'){
		Repo.find({slug:newslug},function(err,repo){
			if(err){
				console.log("Error");
				callback(null);
			}
			if(!repo){
				var num = Math.floor(Math.random() * (max - min + 1)) + min;
				newslug = newslug+'-'+num;
				console.log(newslug);
				callback(newslug);
			}
			else{
				console.log(newslug);
				callback(newslug);
			}
		});
	}
	else if(type == 'folder')
		callback(newslug); 
	else
		callback(null);
};


exports.createRepo = function(req,res){
	var repo = new Repo();
	var result = {};
	repo.name = req.body.name;
	repo.owner = req.user._id;
	repo.ispublic = req.body.ispublic;
	repo.desc = req.body.desc;
	createSlug('repo',req.body.name, function(newslug){
		if(newslug){
		repo.slug = newslug;
		fs.mkdir(config.repoPath+repo.slug,function(err){
			if(err){
				console.log(err);
				res.send("There was an error while creating directory");
			}
			else{
				repo.save(function(error,response,numberAffected){
					if(error)
						console.log("There was an error while saving repo info in DB");
					else
					{
						console.log("Repo info save successfully");
						result = {
							'success':1,
							'msg': 'Repo made succcessfully'
						};
						res.jsonp(result);
					}
				});
			}
		});
	    }
	    else{
	    	res.send("There was an error while making the repo");
	    }
	});
};


exports.deleteRepo = function(req,res){
	var owner = req.user._id,
		result = {},
		repoSlug = req.body.repoSlug;
		Repo.findOne({slug:repoSlug},function(err,response){
			if(err){
				console.log(err)
				result= {
					'error':1,
					'error_msg':err
				};
				res.jsonp(result);
			}
			else if( response && response.owner.equals(owner)){
				fs.rmdir(config.repoPath+repoSlug,function(error){
					if(err){
						console.log(error);
						result = {
							'error' : 1,
							'error_msg': 'There was error while deleting the repo folder.'
						};
						res.jsonp(result);
					}
					else{
						Repo.remove({slug:repoSlug},function(Error){
							if(Error){
								console.log(Error);
								result = {
									'error' : 1,
									'error_msg': 'There was an error while deleting repo from DB.'
								};
							}
							else{
								result = {
									'error': 0,
									'error_msg':'Rpeo was successfully deleted.'
								};
							}
							res.jsonp(result);
						});
					}
				});
			}
			else{
				result = {
					'error': 1,
					'error_msg': 'User is not the owner of the repo.'
				};
				res.jsonp(result);
			}
		});
};


exports.createFolder = function(req,res){
	var folderName = req.body.folderName,
		path = config.repoPath,
		result = {},
		parentPath = req.body.parentPath,
		repoSlug = req.body.repoSlug;
		createSlug('folder',folderName,function(folderSlug){
			if(folderSlug){
				fs.mkdir(parentPath+folderSlug,function(err,response){
					if(err){
						if(err.errno == 47){
							result = {
								'error':1,
								'error_msg':'Folder with this name already exists'
							};
						}
						else{
							console.log(err);
							result = {
								'error':1,
								'error_msg':'There was an error while creating the folder in the repo'+ folderName
							};
						}
						res.jsonp(result);
					}
					else{
						Repo.findOneAndUpdate({slug:repoSlug},{$push:{files:{path:parentPath+folderSlug,name:folderName,tag:'folder'}}},function(error,response1){
							if(error){
								console.log(error);
								result = {
									'error':1,
									'error_msg':'Error while saving the sub folder to database.'
								};
							}
							else{
								result = {
									'error':0,
									'error_msg':null
								};
							}
							res.jsonp(result);
						});
					}
				});
			}
		});	
};

exports.uploadFile = function(req,res){
	var pathInRepo = req.body.path,
		repoSlug = req.body.repoSlug,
		result = {};
	fs.readFile(req.files.file.path,function(err,data){
		var extension = req.files.file.extension,
			fileName = req.files.file.originalname.replace('.'+extension,''),
			filePath = config.repoPath+pathInRepo+fileName,
			
    	if(err){
    		result = {
    			'error': 1,
    			'error_msg': 'Cannot read the file.'
    		};
    		res.jsonp(result);
    	}
    	else{
    	    fs.writeFile(filePath,data,function(err,result){
                if(err){
                	console.log(err);
                	result = {
                		'error':1,
                		'error_msg':'Error while uploading the file.'
                	};
                	res.jsonp(result);
                }
                else {
                    Repo.findOneAndUpdate({slug:repoSlug},{$push:{files:{path:filePath, tag:extension}}},function(error,response){
                    	if(error){
                    		console.log(error);
                    		result = {
                    			'error':1,
                    			'error_msg':'There was error while saving the file in DB.'
                    		};
                    	}
                    	else{
                    		result = {
                    			'error':0,
                    			'error_msg':'File uploaded successfully'
                    		};
                    	}
                    	res.jsonp(result);
                    });
                }
    	    });
        }
	});
};