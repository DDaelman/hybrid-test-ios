'use strict'

function TopLevelController($scope, $state, DataOperationService, CustomObjectService){
	$scope.settings = {
		includeContacts: true
	};

	$scope.toSettings = function(){
		$state.transitionTo('settings');
	};

	$scope.logout = function(){
		cordova.require("salesforce/plugin/oauth").logout();
	};

	$scope.goToConflicts = function(){
		$state.transitionTo('conflict');
	};

	$scope.goHome = function(){
		$state.transitionTo('home');
	};

	$scope.$watch( function () { return {conflictCount: DataOperationService.getConflicts().getLength()} }, function (data) {
	    	$scope.conflictCount = data.conflictCount;
	}, true);

	$scope.isOnline = OfflineTracker.isOnline();
	OfflineTracker.addToOnlineEvent(function(){$scope.isOnline = true; $scope.$apply();});
	OfflineTracker.addToOfflineEvent(function(){$scope.isOnline = false; $scope.$apply();});
	CustomObjectService.initStatusOptions();
}

ControllerModule.controller('TopLevelController', ['$scope', '$state', 'DataOperationService', 'CustomObjectService', TopLevelController]);