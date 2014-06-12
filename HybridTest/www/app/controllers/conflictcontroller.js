'use strict';

function ConflictController($scope, $state, DataOperationService, LeadService){

	$scope.counter = 0;
	$scope.conflict = DataOperationService.currentConflict();
	$scope.currentRecord = {fName: '', lName: '', merge: function(){}};
	$scope.hasConflicts = DataOperationService.getConflicts().getLength() > 0;
	$scope.subTitle = 'Conflicts';	

	if($scope.hasConflicts){
		$scope.subTitle = 'Local';		
		$scope.local = $scope.conflict.yours;
		$scope.remote = $scope.conflict.theirs;
		$scope.currentRecord.fName = $scope.local.FirstName;
		$scope.currentRecord.lName = $scope.local.LastName;
		$scope.currentRecord.merge = function(){
			var localObj = {};
			var remoteObj = {};
			if($scope.local.attributes.type.toLowerCase() == 'lead'){
				localObj = new LeadService.Lead($scope.local); //Create Model from json object to access crud methods
				remoteObj = new LeadService.Lead($scope.remote); //Create Model from json object to access crud methods
			} 
			if($scope.subTitle == 'Local'){
				LOG('MERGE LOCAL', localObj);
				DataOperationService.setMergeMode('merge-accept-yours');
				DataOperationService.save(localObj, false, function(){
					LOG('UPDATED LOCAL', localObj);
					DataOperationService.nextConflict();
					$scope.nextConflict();
					$scope.$apply();
				});
				DataOperationService.setMergeMode('merge-fail-if-conflict');
			}else{
				LOG('MERGE REMOTE', remoteObj);
				DataOperationService.setMergeMode('merge-fail-if-conflict');
				DataOperationService.save(remoteObj, false, function(){
					LOG('UPDATED REMOTE', remoteObj); 
					DataOperationService.nextConflict();
					$scope.nextConflict();
					$scope.$apply();
				});			
			}			
		};
	}

	$scope.nextConflict = function(){
		if(DataOperationService.getConflicts().isEmpty()){
			LOG('CONFLICTS RESOLVED ///' + $scope.counter + ' ' + DataOperationService.getConflicts().length, {});
			DataOperationService.clearConflicts();
			$state.transitionTo('home');
		}else{
			//$scope.counter += 1;
			$scope.conflict = DataOperationService.currentConflict();
			LOG('NEW CONFLICT', $scope.conflict);
			$scope.local = $scope.conflict.yours;
			$scope.remote = $scope.conflict.theirs;
			$scope.currentRecord.fName = $scope.local.FirstName;
			$scope.currentRecord.lName = $scope.local.LastName;
		}
	};

	$scope.switchRecord = function(rec){
		$scope.currentRecord.fName = rec.FirstName;
		$scope.currentRecord.lName = rec.LastName;
		if(rec == $scope.remote){
			$scope.subTitle = 'Server';
		}else{
			$scope.subTitle = 'Local';
		}
	};
}

ControllerModule.controller('ConflictController', ['$scope', '$state', 'DataOperationService', 'LeadService', ConflictController]);