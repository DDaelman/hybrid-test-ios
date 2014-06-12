'use strict';

function LeadListController($scope, $ionicLoading, $state, $ionicSideMenuDelegate, LeadService, DeviceContactService){
	//+++++++++++++++++++++VARIABLES
	$scope.loadingIndicator = $ionicLoading.show({
		template: '<i class="fa fa-cog fa-spin"></i>',
		animation: 'fade-in',
		showBackdrop: false,
		maxWidth: 200,
		showDelay: 500
	});

	$scope.leads = {};
	$scope.filter = { input: ''};
	$scope.devicecontacts = [];

	//+++++++++++++++++++++FUNCTIONS

	$scope.refresh = function(){
		$ionicSideMenuDelegate.toggleLeft();
		$state.transitionTo($state.current, null, {
		    reload: true,
		    inherit: false,
		    notify: true
		});
	};

	$scope.namefilter = function (item){
	    if (item.fName.toLowerCase().indexOf($scope.filter.input.toLowerCase())!=-1 ||
	    	item.lName.toLowerCase().indexOf($scope.filter.input.toLowerCase())!=-1) {
	    	if((item.inDevice && $scope.settings.includeContacts) || item.inSalesforce){
	        	return true;
	        }
	    }
	    return false;
	};

	$scope.detail = function(sfId, ctId){
		$state.transitionTo('lead', {'leadId': sfId, 'inSalesforce': sfId != null, 'inDevice': ctId != null, 'ctid': ctId});
	};

	$scope.createNewLead = function(){
		$state.transitionTo('lead', {'leadId': null, 'inSalesforce': false, 'inDevice': false, 'ctid':null});
	};

	$scope.openMenu = function() {
	    $ionicSideMenuDelegate.toggleLeft();
	};

	//+++++++++++++++++++++ON CONTROLLER LOAD
	var collectLeads = function (leads){
		var firstLetter = '';
		leads.forEach(function(lead){
			if(!lead.get('__locally_deleted__')){
				if(lead.get('FirstName') != null){
					firstLetter  = lead.get('FirstName').substring(0,1).toUpperCase();
				}else{
					firstLetter  = lead.get('LastName').substring(0,1).toUpperCase();
				}
				if(!$scope.leads[firstLetter]){
					//First letter encounter, create new array to receive objects
					$scope.leads[firstLetter] = [];
				}			
				$scope.leads[firstLetter].push(
						{
							sfid: lead.get('Id'),
							ctid: null,
							fName: lead.get('FirstName'),
							lName: lead.get('LastName'),
							fullname: lead.get('FirstName') + ' ' + lead.get('LastName'),
							inSalesforce: true,
							inDevice:false
						}
					);
			}
		});

		$scope.devicecontacts.forEach(function(contact){
			if(contact.name.givenName !== null){
				firstLetter  = contact.name.givenName.substring(0,1).toUpperCase();
			}else{
				firstLetter  = contact.name.familyName.substring(0,1).toUpperCase();
			}
			if(!$scope.leads[firstLetter]){
				//First letter encounter, create new array to receive objects
				//If letter doesnt exist, this means there are no SF Leads with this name => must be device-only contact by default
				//LOG('ADDING DEVICE CONTACT FIRST LETTER ENCOUNTER', contact.displayName);
				$scope.leads[firstLetter] = [];
				$scope.leads[firstLetter].push(
					{
						sfid: null,
						ctid: contact.id,
						fName: contact.name.givenName,
						lName: contact.name.familyName,
						fullname: contact.displayName,
						inSalesforce: false,
						inDevice:true
					}
				);
			}else{
				var contactInList = false;
				$scope.leads[firstLetter].forEach(function(lead){
					if(contact.displayName == lead.fName + ' ' + lead.lName){
						//LOG('EDITING DEVICE CONTACT IN LIST' + contact.displayName , lead);
						lead.inDevice = true;
						lead.ctid = contact.id;
						contactInList = true;
					}
				});

				if(!contactInList){
					//LOG('ADDING DEVICE CONTACT', contact);
					$scope.leads[firstLetter].push(
						{
							sfid: null,
							ctid: contact.id,
							fName: contact.name.givenName,
							lName: contact.name.familyName,
							fullname: contact.displayName,
							inSalesforce: false,
							inDevice:true
						}
					);
				}	
			}			
		});
		if(!leads.currentPageIndex || leads.currentPageIndex == leads.totalPages -1){
			$ionicLoading.hide();
		}else{
			navigator.smartstore.moveCursorToNextPage(leads, collectLeads);
		}
	};

	var collectDeviceContacts = function(contacts){
		$scope.devicecontacts = contacts;	

		LeadService.getLeads(
					{
						path: 'LastName',
						operator: OPERATOR_LIKE,
						match: "'%'", 
						pageSize: 50
					},
					collectLeads,
					null
		);	
	};

	DeviceContactService.getDeviceContacts(collectDeviceContacts, null);	
}

ControllerModule.controller('LeadListController', ['$scope', '$ionicLoading', '$state', '$ionicSideMenuDelegate', 'LeadService', 'DeviceContactService', LeadListController]);