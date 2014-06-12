'use strict';

function LeadController($scope, $state, $stateParams, $ionicModal, $ionicLoading, LeadService, DeviceContactService, DataOperationService, CustomObjectService){
	//+++++++++++++++++++++VARIABLES
	$ionicModal.fromTemplateUrl('confirm.html', {
	    scope: $scope,
	    animation: 'slide-in-up'
	  }).then(function(modal) {
	    $scope.confirmationDialog = modal;
	  });
	$scope.inDevice = $scope.$eval($stateParams.inDevice);
	$scope.inSalesforce = $scope.$eval($stateParams.inSalesforce);
	$scope.isNew = !$scope.inDevice && !$scope.inSalesforce;
	$scope.statusOptions = [];
	$scope.lead = {
			id: null,
			ctid: null,
			fName: 'New',
			lName: 'Lead',
			phone: '',
			company: '',
			status: 'Open - Not Contacted'
	};
	$scope.leadObj = new LeadService.Lead();

	//+++++++++++++++++++++FUNCTIONS

	$scope.callphone = function(){
		if($scope.lead.phone !== null){
			document.location.href = 'tel:' + $scope.lead.phone.replace(/\D/g, '');
		}
	};

	$scope.addToDevice = function(){
		cordova.exec(
					function(winParam) {}, 
					function(error) {alert('failed to add contact');}, 
					"OpenAppPlugin",
                 	"createcontact", 
                 	[{
                 		firstname: $scope.lead.fName,
                 		lastname: $scope.lead.lName,
                 		phone: $scope.lead.phone,
                 		company: $scope.lead.company
                 	}]);
	};

	$scope.addToSalesforce = function(){
		$scope.edit();
	};

	$scope.showOnDevice = function(){
		cordova.exec(
					function(winParam) {console.log('SHOW ON DEVICE -- SUCCESS -- ' + JSON.stringify(winParam));}, 
					function(error) {console.log('SHOW ON DEVICE -- ERROR -- ' + JSON.stringify(error));}, 
					"OpenAppPlugin",
                 	"displaycontact", 
                 	[{
                 		id: $scope.lead.ctid
                 	}]);
	};

	$scope.edit = function(){
		var current = $state.current;
        var params = $stateParams;	

        $ionicLoading.show({
			template: '<i class="fa fa-cog fa-spin"></i>',
			animation: 'fade-in',
			showBackdrop: true,
			maxWidth: 200,
			showDelay: 100
		});

		$scope.leadObj.set('FirstName', $scope.lead.fName);
		$scope.leadObj.set('LastName', $scope.lead.lName);
		$scope.leadObj.set('Phone', $scope.lead.phone);
		$scope.leadObj.set('Company', $scope.lead.company);
		$scope.leadObj.set('Status', $scope.lead.status);

		if(!$scope.isNew && !($scope.inDevice && !$scope.inSalesforce)){
			//Regular edit
			LOG('EDIT LEAD', $scope.leadObj);
			$scope.leadObj.set('Id', $scope.lead.id);		
			DataOperationService.save($scope.leadObj,
										true, 
										function(){
											$ionicLoading.hide();
											$state.transitionTo(current, params, { reload: true, inherit: true, notify: true });
										},
										function(){
											$ionicLoading.hide();
										});
		}else{
			//Create or Create from device contact
			DataOperationService.create($scope.leadObj, function(record){
				$ionicLoading.hide();
				$stateParams.leadId = record.get('Id');
				$stateParams.inSalesforce = true;
				$state.transitionTo(current, params, { reload: true, inherit: true, notify: true });
			},
			function(err){
				LOG('LEAD EDIT', err);
			});			
		}			       
	};

	$scope.delete = function(){
		$scope.confirmationDialog.show();
		//$scope.confirmDelete(true); //allow for confirmation dialog		
	};

	 $scope.$on('modal.hide', function() {
		$scope.confirmationDialog.remove();
	  });

	$scope.confirmDelete = function(isSure){
		$scope.confirmationDialog.hide();
		if(isSure){			
			DataOperationService.destroy($scope.leadObj, function(record){
				$state.transitionTo('home');
			});	
		}
	};

	//+++++++++++++++++++++ON CONTROLLER LOAD

	var init = function(){
		if($scope.inSalesforce){
			
			$scope.leadObj = LeadService.getLead($stateParams.leadId);

			LOG('GETTING SF CONTACT', $scope.leadObj);

			$scope.lead = {
				id: $scope.leadObj.get('Id'),
				ctid: $stateParams.ctid,
				fName: $scope.leadObj.get('FirstName'),
				lName: $scope.leadObj.get('LastName'),
				phone: $scope.leadObj.get('Phone'),
				company: $scope.leadObj.get('Company'),
				status: $scope.leadObj.get('Status')
			};
            
            LeadService.getLeads({
                                 path: 'Id',
                                 operator : OPERATOR_EQUALS,
                                 match: "'"+ $stateParams.leadId +"'",
                                 pageSize:1
                                 },
                                 function(results){
                                    LOG('MANUAL OBJECT QUERY', results);
                                    if(results.length == 1){
                                 results.forEach(function(item){
                                                 $scope.leadObj = item;
                                                 LOG('MANUAL OBJECT QUERY', item);
                                                 $scope.lead = {
                                                 id: $scope.leadObj.get('Id'),
                                                 ctid: $stateParams.ctid,
                                                 fName: $scope.leadObj.get('FirstName'),
                                                 lName: $scope.leadObj.get('LastName'),
                                                 phone: $scope.leadObj.get('Phone'),
                                                 company: $scope.leadObj.get('Company'),
                                                 status: $scope.leadObj.get('Status')
                                                 };
                                                 });
                                 $scope.$apply();
                                    }
                                 },
                                 function(err1, err){LOG('ERROR', err);});
                                 
		}else{
			if($scope.inDevice){
				DeviceContactService.getDeviceContacts(function(contacts){
					contacts.forEach(function(contact){
						if(contact.id == $stateParams.ctid){
							$scope.contactObj = contact;
							var phone = null;
							var org = null;
							if($scope.contactObj.phoneNumbers[0] !== null){
								phone = $scope.contactObj.phoneNumbers[0].value;
							}
							if($scope.contactObj.organizations[0] !== null){
								org = $scope.contactObj.organizations[0].name;
							} 
							$scope.lead = {
								id: null,
								ctid: $scope.contactObj.id,
								fName: $scope.contactObj.name.givenName,
								lName: $scope.contactObj.name.familyName,
								phone: phone,
								company: org,
								status: 'Open - Not Contacted'
							};
					}
					});
				},
				function(err){
					console.log('ERR -- ' + JSON.stringify(err));
				});	
			}	
		}
	};

	var describeStatusOptions = function(data){
		LOG('DISPLAY STATUSOPTIONS', data);
		data.currentPageOrderedEntries.forEach(function(item){			
			$scope.statusOptions.push({label: item.label, value: item.value});					
		});
	};

	var checkContactExists = function(devicecontacts){
		if(devicecontacts.length === 0){
			LOG('NO CONTACTS FOUND', devicecontacts);
			$scope.inDevice = false;
			$scope.lead.ctid = null;
		}else{
			devicecontacts.forEach(function(contact){
				LOG('CHECK CONTACT EXISTS', contact);
				if(contact.displayName == $scope.lead.fName + ' ' +  $scope.lead.lName){
					LOG('CONTACT EXISTS IN DEVICE', contact);
					//Lead in device as contact
					$scope.inDevice = true;
					$scope.lead.ctid = contact.id;
				}else{
					LOG('CONTACT DOES NOT EXIST IN DEVICE', contact);
					$scope.inDevice = false;
					$scope.lead.ctid = null;
				}
			});		
		}
	};

	var appResumed = function(){
		var current = $state.current;
        var params = $stateParams;
        $state.transitionTo(current, params, { reload: true, inherit: true, notify: true });
	};

	init();
	LOG('STATEPARAMS BEFORE DEVICECHECK', $stateParams);
	if($stateParams.leadId !== null){
		LOG('STATEPARAMS BEFORE DEVICECHECK 2', $stateParams);
		DeviceContactService.getDeviceContacts(checkContactExists, function(err){}, $scope.lead.lName);
	}
	//Force.forcetkClient.describe('Lead', describeStatusOptions, null);
	CustomObjectService.getStatusOptions(describeStatusOptions);
	document.addEventListener("resume", appResumed, false);
}

ControllerModule.controller('LeadController', ['$scope', '$state', '$stateParams', '$ionicModal', '$ionicLoading', 'LeadService', 'DeviceContactService', 'DataOperationService', 'CustomObjectService', LeadController]);