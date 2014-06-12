'use strict';

function LeadContactModel(lead, deviceContact, onDevice, inSF){
	this.leadObject = lead;
	this.deviceContactObject = deviceContact;
	this.isOnDevice = onDevice;
	this.isInSalesforce = inSF;
}