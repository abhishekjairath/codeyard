'use strict';

angular.module('mean.repos').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider
    .state('repos', {
      url: '/repos',
      templateUrl: 'repos/views/index.html'
    })
    .state('repos.create', {
      url: '/create',
      templateUrl: 'repos/views/add.html'
    })
    .state('repos.commits', {
      url: '/commits',
      templateUrl: 'repos/views/commits.html'
    })
    .state('repos.commits.view', {
      url: '/:id',
      templateUrl: 'repos/views/viewCommit.html'
    })
    .state('repos.articles', {
      url: '/articles',
      templateUrl: 'articles/views/list.html'
    })
    .state('reponame', {
      url: '/repos/:name',
      templateUrl: 'repos/views/repository.html'
    })
    .state('reponame.commits', {
      url: '',
      templateUrl: 'repos/views/repoCommits.html'
    })
    .state('reponame.commits.view', {
      url: '',
      templateUrl: 'repos/views/viewCommit.html'
    })
    .state('reponame.readme', {
      url: '',
      templateUrl: 'repos/views/readme.html'
    })
    .state('reponame.wiki', {
      url: '',
      templateUrl: 'repos/views/wiki.html'
    });
  }
]);
