'use strict';

function ContactlistController($scope, $ionicLoading, ContactService, DeviceContactService){
	$scope.loadingIndicator = $ionicLoading.show({
		template: '<i class="icon ion-loading-c"></i>',
		animation: 'fade-in',
		showBackdrop: false,
		maxWidth: 200,
		showDelay: 500
	});
	$scope.contacts = [];

	var displayData = function(data){
		$scope.contacts = [];
		$scope.contactObjs = data;					
		data.forEach(function(item){
			$scope.contacts.push({firstname: item.get('FirstName'), lastname: item.get('LastName'), id: item.get('Id')});
		});	
		$ionicLoading.hide();
	};

	var displayError = function(tmp, err){
		//alert(JSON.stringify(err, null, 4));
	};

	var onSuccess = function(contacts) {
	   contacts.forEach(function(contact){
	   		$scope.contacts.push({firstname: contact.name.givenName, lastname: contact.name.familyName, id: 'In Phone'});
	   });
	};

	ContactService.getContacts(
								{
									path: 'LastName',
								 	operator: OPERATOR_LIKE,
								 	match: "'%son%'", 
								 	pageSize: 50
								},
								displayData,
								displayError);	

	DeviceContactService.getDeviceContacts(onSuccess, displayError);

	$scope.subTitle = 'Contacts';
	$scope.goToContact = function(contactId){
		var url = '/contact/' + contactId;
		$location.path(url);
	};	
}

ControllerModule.controller('ContactlistController',
							['$scope', '$ionicLoading', 'ContactService', 'DeviceContactService', ContactlistController]);
