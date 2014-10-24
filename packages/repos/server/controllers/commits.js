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
  crypto = require('crypto'),
  nodemailer = require('nodemailer'),
  fs = require('fs'),
  fse = require('fs.extra'),
  makeslug = require('slug'),
  repoPath = config.repoPath;


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
				callback(newslug);
			}
			else{
				callback(newslug);
			}
		});
	}
	else if(type == 'folder')
		callback(newslug); 
	else
		callback(null);
};


exports.createCommit = function(req,res){
	var repo = new Commit();
	var result = {};
	repo.name = req.body.reponame;
	repo.owner = req.user._id;
	repo.contributors.push(req.user._id);
	repo.ispublic = req.body.ispublic;
	repo.desc = req.body.desc;
	createSlug('repo',req.body.reponame, function(newslug){
		if(newslug){
		repo.slug = newslug;
		fs.mkdir(repoPath+repo.slug,function(err){
			if(err){
				console.log(err);
				res.send("There was an error while creating directory");
			}
			else{
				repo.save(function(error,response,numberAffected){
					if(error){
						console.log(error);
						result = {
							'error':1,
							'error_msg':'There was an error while saving repo'
						};
					}
					else
					{
						result = {
							'error':0,
							'error_msg': 'Repo made succcessfully'
						};
					}
					res.jsonp(result);
				});
			}
		});
	    }
	    else{
	    	res.send("There was an error while making the repo");
	    }
	});
};

exports.getRepo = function(req,res){
	var repoSlug = req.params.reposlug,
		result = {};
	Repo.findOne({slug:repoSlug},function(err,response){
		if(err){
			console.log(err);
			result = {
				'error':1,
				'error_msg':'There was an error while fetching repo info.'
			};
		}
		else{
			result = {
				'error':0,
				'error_msg':null,
				'repo':response
			};
		}
		res.jsonp(result);
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
					'error_msg':'The repo could not be found in DB'
				};
				res.jsonp(result);
			}
			else if( response && response.owner.equals(owner)){
				fse.rmrf(repoPath+repoSlug,function(error){
					if(error){
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
		result = {},
		pathInRepo = req.body.path,  
		repoSlug = req.body.repoSlug;
		createSlug('folder',folderName,function(folderSlug){
			if(folderSlug){
				fs.mkdir(repoPath+pathInRepo+folderSlug,function(err,response){
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
						Repo.findOneAndUpdate({slug:repoSlug},{$push:{files:{path:pathInRepo+folderSlug,name:folderName,tag:'folder'}}},function(error,response1){
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
									'error_msg':'Folder created successfully'
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
			filePath = config.repoPath+pathInRepo+fileName;
			
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
                    Repo.findOneAndUpdate({slug:repoSlug},{$push:{files:{path:pathInRepo+fileName, tag:extension, name:fileName}}},function(error,response){
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

exports.deleteFile = function(req,res){
	var fileId = req.body.fileId,
		result = {};
		fs.unlink(repoPath+filePath, function(err){
			if(err){
				console.log(err);
				result = {
					'error':1,
					'error_msg':'Unable to delete the file'
				};
				res.jsonp(result);
			}
			else{
				Repo.findOneAndUpdate({'files.path':filePath},{$pull:{files:{path:filePath}}},function(error,response){
					if(error){
						console.log(error);
						result = {
							'error':1,
							'error_msg':'Unable to delete the file from the DB'
						};
					}
					else{
						result = {
							'error':0,
							'error_msg':'FIle deleted successfully'
						};
					}
					res.jsonp(result);
				});
			}
		});
};

exports.getFile = function(req,res){
	var filePath = req.params.filepath,
		result = {};

	fs.readFile(repoPath+filePath,"utf8",function(err,data){
		if(err){
			console.log(err);
			result = {
				'error':1,
				'error_msg':'Cannot find the required file'
			};
		}
		else{
			result = {
				'error':0,
				'error_msg':null,
				'data':data
			};
		}
		res.jsonp(result);
	});
};