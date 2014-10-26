angular.module('mean.repos').directive('userSuggestions',function(){
	return {
		restrict: 'E',
		transclude: true,
		scope: {},
		controller:function($scope,$http){
			$scope.addCollab = function(uid){
				console.log(uid);
				$http.post('repos/54496b86eac0942537f81bcb/collaborators',{uid:uid}).success(function(data){
				console.log(data);
				});
			};
		},
      	template:'<div id="prefetch"><input class="typeahead" type="text" ng-model="uid" placeholder="Countries"><button class="btn btn-primary" ng-click="addCollab(uid)">Add</button></div>',
      	link: function (scope, element) {
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
      		source: countries.ttAdapter()
      	});
      }
  };
});