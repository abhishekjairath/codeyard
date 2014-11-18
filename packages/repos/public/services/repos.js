'use strict';

angular.module('mean.repos').factory('Repos', ['$http',
  function($http) {
  	var factory = {};
    
    factory.getUser = function(){
      return $http.get('/users/me');
    }

    factory.downloadRepo = function(reposlug){
      return $http.get('/repos/download/'+reposlug);
    }
    
    factory.createRepo = function(repo){
        return $http.post('/repos',repo);
    }
    
    factory.viewRepos = function(username){
    	return $http.get('/'+username+'/repos/view');
    }

    factory.updateRepo = function(desc,reposlug){
      return $http.put('/repos/'+reposlug,{desc:desc});
    }
    
    factory.getRepo = function(reposlug){
      return $http.get('/repos/'+reposlug);
    }

    factory.createFolder = function(folder){
      return $http.post('/repos/folder',folder);
    }

    factory.deleteRepo = function(reposlug){
      return $http.delete('/repos/'+reposlug);
    }

    factory.getFile = function(filepath){
      return $http.get('/repos/file/'+filepath);
    }

    factory.getWiki = function(repoId){
      return $http.get('/wiki/'+repoId);
    }

    factory.deleteFile = function(file){
      return $http.post('/repos/file/delete',file);
    }

    factory.userCommits = function(username){
      return $http.get("/"+username+"/commits");
    }

    factory.repoCommits = function(reposlug){
      return $http.get("/repos/"+reposlug+"/commits");
    }

    factory.viewCommit =function(id){
      return $http.get("/commits/"+id);
    }
    return factory; 
  }
]);
