'use strict';

angular.module('mean.system').controller('IndexController', ['$scope','$http', '$window', 'Global',
  function($scope, $http, $window, Global) {
    $scope.global = Global;
    
    $scope.getUserData = function(){
        $http.get('/users/me').success(function(data){
            $scope.global.user.me = {};
            $scope.global.user.me.repos = data.repos.length;
            $scope.global.user.me.commits = data.commits.length;
            $scope.global.user.me.created = data.created;
            $scope.global.user.me.email = data.email; 
            console.log($scope.global.user); 
        }).error(function(data){
            $window.location.href = '/notfound';
        });
    }

    $scope.getStats = function(){
        $http.get('/stats').success(function(data){
            $scope.repoCount = data.repos;
            $scope.userCount = data.users;
        }).error(function(data){
            $scope.repoCount = 'X';
            $scope.userCount = 'X';
        });
    }

    $scope.contributionCalendar = function(){
        var now = new Date(Date.now());
        var then = new Date((now.getFullYear())-1,now.getMonth(),now.getDate());
        $scope.date_range = then.toDateString() +' - '+ now.toDateString();
        var daysOfYear = [];
        for (var d = then; d <= now; d.setDate(d.getDate() + 1)) {
            daysOfYear.push(new Date(d));
        	angular.element('#calendar')
        	.append('<span class="glyphicon glyphicon-stop" title="'+d.toDateString()+'"></span>');
        }
    };
  
}]);
