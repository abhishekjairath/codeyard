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


exports.createRepo = function(req,res){
	var repo = new Repo();
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
						res.jsonp(result);
					}
					else
					{
						User.findOneAndUpdate({_id:req.user._id},{$addToSet:{repos:{repo:response._id,isowner:true}}},function(err1,response1){
							if(err1){
								console.log(err1);
								result = {
								'error':1,
								'error_msg':'There was an error while saving repo'
								};
							}
							else{
								result = {
									'error':0,
									'error_msg': 'Repo made successfully'
								};
							}
							res.jsonp(result);
						});
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

exports.viewAll = function(req,res){
	var username = req.params.username,
		result = {};
	User.find({username:username},{hashed_password:false,salt:false}).populate('repos.repo','slug _id desc ispublic updated').exec(function(err,response){
		if(err){
			console.log(err);
			result = {
				'error':1,
				'error_msg':'Error while looking for repos'
			};
		}
		else{
			result = {
				'error':0,
				'error_msg':'Repos found.',
				response:response
			};
		}
		res.jsonp(result);
	});
};


exports.deleteRepo = function(req,res){
	var owner = req.user._id,
		result = {},
		repoSlug = req.params.reposlug,
		repoid='';
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
				repoid = response._id;
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
								res.jsonp(result);
							}
							else{
								User.update({_id:owner},{$pull:{repos:{repo:repoid}}},function(err1,res1){
									if(err1){
										console.log(err1);
										result = {
											'error' : 1,
											'error_msg' : 'Error while removing repo from user'
										};
									}
									else{
										result = {
											'error':0,
											'error_msg':'Repo deleted successfully'
										};
									}
									res.jsonp(result);
								});
							}
						});
					}
				});
			}
			else{
				console.log(response);
				result = {
					'error': 1,
					'error_msg': 'You are not the owner of the repo.'
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
						Repo.findOneAndUpdate({slug:repoSlug},{updated:Date.now(),$push:{files:{path:pathInRepo+folderSlug,name:folderName,tag:'folder',slug:folderSlug}}},function(error,response1){
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
									'error_msg':'Folder created successfully',
									'response':folderSlug
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
                    Repo.findOneAndUpdate({slug:repoSlug},{updated:Date.now,$push:{files:{path:pathInRepo+fileName, tag:extension, name:fileName}}},function(error,response){
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
		filePath= req.body.filePath,
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
				Repo.findOneAndUpdate({'files.path':filePath},{updated:Date.now(),$pull:{files:{path:filePath}}},function(error,response){
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

exports.uploadRepo = function(req,res){
	console.log(req.body);
	console.log('*********************************');
	console.log(req.files.folder);
	//var r = fs.createReadStream('');
	//var w = fs.createWriteStream('file.txt.gz');
	//r.pipe(w);
};

exports.addCollab = function(req,res){
	var repoid = req.params.repoid,
		uid = req.body.uid,
		result = {};

	User.findOneAndUpdate({_id:uid},{$addToSet:{repos:{repo:repoid,isowner:false}}},function(err1,response1){
		if(err1){
			console.log(err1)
			result = {
				'error':1,
				'error_msg':'There was an error while adding collaborator'
			};
			res.jsonp(result);
		}
		else{
			Repo.findOneAndUpdate({_id:repoid},{$addToSet:{contributors:uid}},function(err2,response2){
				if(err2){
					console.log(err2)
					result = {
						'error':1,
						'error_msg':'There was an error while adding collaborator'
					};
				}
				else{
					result = {
						'error':0,
						'error_msg':'collaborator successfully added'
					};
				}
				res.jsonp(result);
			});
		}
	});
};