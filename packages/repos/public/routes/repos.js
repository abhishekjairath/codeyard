'use strict';

angular.module('mean.repos').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state('repos example page', {
      url: '/repos/example',
      templateUrl: 'repos/views/index.html'
    });
  }
]);
