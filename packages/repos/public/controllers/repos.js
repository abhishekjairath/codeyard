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
        $scope.commit_tab = (tab=='mycommits')?'active':'';
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
            return item.repo.ispublic;
        else if($scope.visible=='2')
            return !item.repo.ispublic;
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
    
    
}]).directive('dropZone', function() {
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
                            scope.getRepo();
                        });
                    }
                });
                
            }
    }  
})
.directive('userSuggestions',function($http,$compile){
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
