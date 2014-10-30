'use strict';

angular.module('mean.repos').controller('ReposController', ['$scope', 'Global', 'Repos',
  function($scope, Global, Repos) {
    $scope.global = Global;
    
    if(!$scope.global.user.me){
        Repos.getUser().success(function(data){
            $scope.global.user.me = {};
            $scope.global.user.me.repos = data.repos.length;
            $scope.global.user.me.commits = data.commits.length;
            $scope.global.user.me.created = data.created;
            $scope.global.user.me.email = data.email; 
        }).error(function(data){
            $window.location.href = '/';
        });
    }

    $scope.menu = function(tab){
        $scope.create_tab = (tab=='create')?'active':'';
        $scope.my_tab = (tab=='myrepos')?'active':'';
        $scope.commits_tab = (tab=='mycommits')?'active':'';
        $scope.articles_tab = (tab=='articles')?'active':'';
    };
    
    $scope.createRepo = function(repo){
        $scope.repo=angular.copy(repo);
        Repos.createRepo($scope.repo).success(function(data){
            $scope.repo = {};
            $scope.public = '';
            $scope.private = '';
            $scope.resultClass = 'alert alert-success';
            $scope.result = "Repository Created";
        }).error(function(data){
            $scope.result = data.error_msg;
            $scope.resultClass = 'alert alert-danger';
        });
    };

    $scope.viewRepos = function(username){
        Repos.viewRepos(username).success(function(data){
            $scope.repos = data.response[0].repos;
        }).error(function(data){
            $scope.error = true;
        });
    };
    


    $scope.filter = function(filter){
        if(filter=='public'){
            $scope.visible='1';$scope.fill1='active';$scope.fill2='';$scope.fill3='';
        }
        else if(filter=='private'){
            $scope.visible='2';$scope.fill1='';$scope.fill2='active';$scope.fill3='';
        }
        else if(filter=='all'){
            $scope.visible='3';$scope.fill1='';$scope.fill2='';$scope.fill3='active';
        }
    };

    $scope.visibility = function(item){
        if($scope.visible=='1')
            return item.ispublic;
        else if($scope.visible=='2')
            return !item.ispublic;
        else if($scope.visible=='3')
            return item;
    };
    
}]).controller('RepoViewController', ['$scope', '$window','$stateParams', 'Global', 'Repos',
  function($scope, $window, $stateParams, Global, Repos) {
    $scope.global = Global;
    $scope.reposlug = $stateParams.name;
    $scope.currentPath = [];
    $scope.currentPath.push($scope.reposlug);
    $scope.repo;
    $scope.list = true;
    $scope.plusSignFolder = true;
    $scope.getRepo = function(){
        Repos.getRepo($scope.reposlug).success(function(data){
            $scope.repo = data.repo;
            viewPath();
        }).error(function(data){
            $scope.error.getRepo = data.error_msg;
        });
    };
    
    $scope.downloadRepo = function(){
        Repos.downloadRepo($scope.reposlug).success(function(data){

        }).error(function(data){
            alert('Download Failed');
        });
    };

    $scope.deleteRepo = function(reposlug){
        Repos.deleteRepo(reposlug).success(function(data){
            $window.location.href='#!/repos';
        }).error(function(data){
            $scope.error.deleteRepo = data.error_msg;
        });
    };

    $scope.updateRepo = function(desc){
        Repos.updateRepo(desc,$scope.reposlug).success(function(data){
            $scope.editDesc = false;
        }).error(function(data){
            $scope.error.update = data.error_msg;
        });
    }; 
    
    $scope.createFolder = function(foldername){
        if(!foldername){
            $scope.error.createFolder = 'Please name the folder.';
        }else{
            var path = $scope.currentPath.join('/')+'/';
            var folder = {
                folderName: foldername,
                path: path,
                repoSlug: $scope.reposlug
            };
            Repos.createFolder(folder).success(function(data){
                $scope.currentPath.push(data.response);
                $scope.newname = '';
                $scope.getRepo();
            }).error(function(data){
                $scope.error.createFolder = data.error_msg;
            });
        }
    };

    $scope.pathFromCrumb = function(folder){
        for (var i = $scope.currentPath.length - 1; i >= 0; i--) {
            if($scope.currentPath[i]!==folder)
                $scope.currentPath.pop();
            else
                break;
        };
        $scope.list = true;
        $scope.plusSignFolder = true;
        viewPath();
    };

    $scope.pathFromView = function(folder){
        $scope.currentPath.push(folder);
        viewPath();
    };

    var viewPath = function(){
        var fileObj = $scope.repo.files;
        $scope.files = [];
        var currentPath = $scope.currentPath.join('/');
        for(var i=0;i<fileObj.length;i++){
            if(fileObj[i].path.substr(0,fileObj[i].path.lastIndexOf('/'))==currentPath){
                $scope.files.push(fileObj[i]);
            }
        }
    };

    $scope.viewFile = function(file){
        $scope.list = false;
        $scope.plusSignFolder = false;
        var path = (file.path).replace(/\//g,'_');
        Repos.getFile(path).success(function(res){
            if(res.data){
                $scope.openedFile = file.name+'.'+file.tag;
                $scope.fileSize = file.size/1000+' KB';
                document.getElementById('content').innerText = '';
                document.getElementById('lines').innerText = '';
                document.getElementById('content').innerText += res.data;
                var divHeight = document.getElementById('content').offsetHeight;
                var lineHeight = parseInt(document.getElementById('content').style.lineHeight);
                var lines = divHeight/lineHeight;
                for (var i = 1; i <= lines; i++) {
                    document.getElementById('lines').innerText += i+'\n';
                };
            }else{
                document.getElementById('content').innerHTML = "<strong>The file for this Repository does not exist.</strong>";
            }
        }).error(function(error){
            document.getElementById('content').innerHTML = "<strong>There was some problem with the server.</strong>";
        });
    };

    $scope.deleteFile = function(fileid,filepath){
        Repos.deleteFile({fileId:fileid,filePath:filepath}).success(function(data){
            $scope.getRepo();
        }).error(function(data){
            $scope.error = true;
            $scope.error_msg = "Unable to delete file.";
        });
    };
    
}]).controller('ReadMeController', ['$scope', 'Global', 'Repos',
  function($scope, Global, Repos) {
    
    $scope.viewReadMe = function(reposlug){
        var path = (reposlug+'_readme.txt');
        Repos.getFile(path).success(function(file){
            if(file.data){
                document.getElementById('content').innerText = file.data;
            }else{
                document.getElementById('content').innerHTML = "The Readme file for this Repository does not exist. Please add a <strong>readme.txt</strong> file to the home directory.";
            }
        }).error(function(error){
            document.getElementById('content').innerHTML = "<strong>There was some problem with the server.</strong>";
        });
    };

}]).controller('WikiController', ['$scope', 'Global', 'Repos',
  function($scope, Global, Repos) {
    
    $scope.hasAuthorization = function(article) {
      if (!article || !article.user) return false;
      return $scope.global.isAdmin || article.user._id === $scope.global.user._id;
    };

    $scope.viewWiki = function(repoId){
        Repos.getWiki(repoId).success(function(articles){
           $scope.articles = articles;
        }).error(function(error){
           $scope.error_msg = "There was some error with the server.";
        });
    };

}]).controller('CommitsController', ['$scope', 'Global', 'Repos',
  function($scope, Global, Repos) {

    $scope.userCommits = function(){
        userCommits($scope.global.user._id,function(commits){
            $scope.commits = commits;
        }).error(function(data){
            $scope.error = true;
            $scope.error_msg = "Unable to get user commits.";
        });
    };

    $scope.repoCommits = function(reposlug){
        repoCommits(reposlug,function(commits){
            $scope.commits = commits;
        }).error(function(data){
            $scope.error = true;
            $scope.error_msg = "Unable to get repo commits.";
        });
    };

}]).filter('fewLinesFilter', function () {
    return function (text) {
        if (text !== undefined) return text.substring(0,200);
    };
}).directive('dropZone', function() {
    return{ 
        transclude: false,    
        link: function(scope, element, attrs) {
                
                element.dropzone({ 
                    url: "/repos/file",
                    maxFilesize: 100,
                    paramName: 'file',
                    addRemoveLinks: true,
                    autoProcessQueue : false,
                    uploadMultiple: true,
                    parallelUploads: 100,
                    maxFiles:100,
                    init: function(){
                        var save = angular.element('#upload');
                        var path = {};
                        var myDropzone=this;
                        save.on("click", function(e) {
                              e.preventDefault();
                              e.stopPropagation();
                              myDropzone.processQueue();
                        });
                        this.on("addedfile",function(file){
                            path[file.name] = scope.currentPath.join('/');
                        });
                         this.on("removedfile",function(file){
                            delete path[file.name];
                        });
                        this.on("sending", function(file, xhr, formData) {
                            formData.append("path", path[file.name]);
                        });
                        this.on('queuecomplete',function(){
                            this.removeAllFiles();
                            scope.desc = '';
                            scope.getRepo();
                        });
                    }
                });
                
            }
    }  
}).directive('userSuggestions',function($http,$compile){
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            repoid: "=repoId",
        },
        template:'<div id="prefetch"><input class="typeahead form-control" type="text" ng-model="username" placeholder="Username"><span ng-click="addCollab(username)" class="glyphicon glyphicon-ok-circle link"></span></div>',
        link: function (scope, element) {
            scope.addCollab = function(username){
                $http.post('repos/'+scope.repoid+'/collaborators',{username:username}).success(function(data){
                scope.username = '';    
                console.log(scope.$parent.repo.contributors);
                console.log(data.collaborators);
                scope.$parent.repo.contributors = [];
                scope.$parent.repo.contributors = data.collaborators;
                });
            };
            var countries = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 10,
            prefetch: {
                url: 'users/suggestions',
                filter: function(list) {
                    return $.map(list.response, function(item) { return { name: item.username }; });
                }
            }
        });

        countries.initialize();

        angular.element('#prefetch .typeahead').typeahead(null, {
            name: 'collaborator',
            displayKey: 'name',
            source: countries.ttAdapter(),
            template:{
                suggestion: $compile('<p><strong>{{name}}</strong> – {{username}}</p>')
            }
        });
      }
  };
});

