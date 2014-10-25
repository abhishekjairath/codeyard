'use strict';

angular.module('mean.system').controller('IndexController', ['$scope', 'Global',
  function($scope, Global) {
    $scope.global = Global;
    
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
