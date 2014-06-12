'use strict';

function DeviceContactService(){
	this.getDeviceContacts = function(successCB, failCB, filter){
	   var options = new ContactFindOptions();
	   options.filter= filter || "";
	   options.multiple=true;
	   var fields = ["*"];  //"*" will return all contact fields
	   navigator.contacts.find(fields, successCB, failCB, options);
	};
}

ServiceModule.service('DeviceContactService',  DeviceContactService);