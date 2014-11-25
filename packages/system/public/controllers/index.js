'use strict';

angular.module('mean.system').controller('IndexController', ['$scope','$http', '$window', 'Global', '$compile',
  function($scope, $http, $window, Global,$compile) {
    $scope.global = Global;
   
    $scope.getUserData = function(){
        $http.get('/users/me').success(function(data){
            $scope.global.user.me = {};
            $scope.global.user.me.repos = data.repos.length;
            $scope.global.user.me.commits = data.commits.length;
            $scope.global.user.me.created = data.created;
            $scope.global.user.me.email = data.email;
            $scope.global.user.me.pic = data.pic;
            getLatestCommits();
            getMaxRepoCommits();
        }).error(function(data){
            $window.location.href = '/notfound';
        });
    };

    document.getElementById('dp').addEventListener('change',function(){
        var payload = new FormData();
        payload.append('file',document.getElementById('dp').files[0]);
        payload.append('username',$scope.global.user.username);
        $http.post('/users/dp',payload,{
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        }).success(function(data){
            $scope.global.user.me.pic = data.msg;
        }).error(function(){
            $scope.global.user.me.pic = null;
        });
    });
    
    $scope.getStats = function(){
        $http.get('/stats').success(function(data){
            $scope.repoCount = data.repos;
            $scope.userCount = data.users;
        }).error(function(data){
            $scope.repoCount = 'X';
            $scope.userCount = 'X';
        });
    };

    var getLatestCommits = function(){
        $http.get('/commits/latest/'+$scope.global.user.username).success(function(data){
            $scope.latestCommits = data.response;
        }).error(function(data){
            $scope.latestCommits = false;
        });
    };

    var getMaxRepoCommits = function(){
        $http.get('/commits/max/'+$scope.global.user.username).success(function(data){
            $scope.maxCommits = data.response;
        }).error(function(data){
            $scope.maxCommits = false;
        });
    };

    function getColor(count){
        if(count==1)
            return "#d6e685";
        else if(count==2||count==3)
            return "#8cc665";
        else if(count==4||count==5)
            return "#44a340";
        else if(count>5)
            return "#1e6823";
    }

    $scope.showContribution = function (key){
        console.log('show contributions');
        if($scope.calendarCommits[key])
            $scope.contributions = $scope.calendarCommits[key].commits;
        else
            $scope.contributions = null;
    };
    
    $scope.contributionCalendar = function(){
        var now = new Date(Date.now());
        var then = new Date((now.getFullYear())-1,now.getMonth(),now.getDate());
        $scope.calendarCommits = {};
        $http.get('/commits/calendar/'+$scope.global.user.username+'?from='+then.toISOString()+'&to='+now.toISOString())
        .success(function(data){
            $scope.date_range = then.toDateString() +' - '+ now.toDateString();
            var calendar = data.response;
            for(var i=0;i<calendar.length;i++){
                var date = new Date(calendar[i]._id.year, 0);
                date.setDate(calendar[i]._id.day);
                $scope.calendarCommits[date] = calendar[i]; 
            }
            for (var d = then; d <= now; d.setDate(d.getDate() + 1)) {
                var key =  new Date(d);
                if($scope.calendarCommits[key]){
                    var contributionCount = $scope.calendarCommits[key].count;
                    var contriTab = $compile(angular.element('<span data-key="'+key+'" style="color:'+getColor(contributionCount)+';" class="glyphicon glyphicon-stop link" title="'
                        +contributionCount+' commit(s) on '+d.toDateString()+'" ng-click="showContribution(\''+key+'\');"></span>'))($scope); 
                    angular.element('#calendar').append(contriTab);
                }else{
                    var contriTab = $compile(angular.element('<span class="glyphicon glyphicon-stop link" title="'+d.toDateString()+'" ng-click="showContribution(\''+key+'\');"></span>'))($scope);
                    angular.element('#calendar').append(contriTab);
                }
            }
        }).error(function(data){
            $scope.calendar = false;
        });
    };  
}]);
