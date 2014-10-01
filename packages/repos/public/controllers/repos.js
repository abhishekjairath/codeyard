'use strict';

angular.module('mean.repos').controller('ReposController', ['$scope', 'Global', 'Repos',
  function($scope, Global, Repos) {
    $scope.global = Global;
    $scope.package = {
      name: 'repos'
    };
  }
]);
