'use strict';

function ContactController($scope, $routeParams, ContactService, DataOperationService){
	$scope.contactObj = ContactService.getContact($routeParams.contactId);
	$scope.contact = {
		firstname: $scope.contactObj.get('FirstName'),
		lastname: $scope.contactObj.get('LastName')
	};
	$scope.updateContact = function(){		
		$scope.contactObj.set('FirstName', $scope.contact.firstname);
		$scope.contactObj.set('LastName', $scope.contact.lastname);
		DataOperationService.save($scope.contactObj, true);
	};

	$scope.createNew = function(){
		var newContact = new ContactService.Contact();
		newContact.set('FirstName','New');
		newContact.set('LastName', 'TestPerson');
		newContact.set({attributes: {type: "Contact"}});

		DataOperationService.create(newContact, function(data){alert('success'); displayObject(data);}, function(data, err){displayObject(err);});
	};

	$scope.deleteContact = function(){
		DataOperationService.destroy($scope.contactObj);
	};

$scope.valuelist = [];
	var valCB = function(data){

		data.fields.forEach(function(item){
			//displayObject(item);
			if(item.name == 'Salutation'){
				displayObject(item);
				item.picklistValues.forEach(function(i){
					displayObject(i);
					$scope.valuelist.push(i.label);
				});
				$scope.$apply();
				
			}
		});
	}
	Force.forcetkClient.describe('Contact', valCB, null);
}

ControllerModule.controller('ContactController', ['$scope', '$routeParams', 'ContactService', 'DataOperationService', ContactController]);