'use strict';

angular.module('mean.system').controller('HeaderController', ['$scope', '$rootScope', 'Global', 'Menus', 'mySocket',
  function($scope, $rootScope, Global, Menus, mySocket) {
    $scope.global = Global;
    $scope.menus = {};

    // Default hard coded menu items for main menu
    var defaultMainMenu = [];

    // Query menus added by modules. Only returns menus that user is allowed to see.
    function queryMenu(name, defaultMenu) {

      Menus.query({
        name: name,
        defaultMenu: defaultMenu
      }, function(menu) {
        $scope.menus[name] = menu;
      });
    }

    // Query server for menus and check permissions
    queryMenu('main', defaultMainMenu);

    $scope.isCollapsed = false;

    $rootScope.$on('loggedin', function() {

      queryMenu('main', defaultMainMenu);

      $scope.global = {
        authenticated: !! $rootScope.user,
        user: $rootScope.user
      };
      if($scope.global.authenticated)
      mySocket.emit('setClient',$scope.global.user._id);
    });

    if($scope.global.authenticated)
      mySocket.emit('setClient',$scope.global.user._id);

    mySocket.on('commit_done',function(data){
      console.log(data);
    });
  }
])
.controller('notificationController',['$scope', '$rootScope', 'Global','mySocket',
  function($scope, $rootScope, Global, mySocket) {
    $scope.global = Global;
    $scope.notifContent = 0;
    $scope.closeNotif = function(){
      $scope.notifContent = 0;
    }
    mySocket.on('commit_done',function(data){
      $scope.commitId = data;
      $scope.notifContent = 'Commit has been processed.';
    });
  }
]);
