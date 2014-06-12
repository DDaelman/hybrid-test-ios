'use strict';

function LeadService(ModelCollectionFactory, ModelFactory){
	this.Lead = ModelFactory.createModel(
							'Lead',
							['Id', 'FirstName', 'LastName', 'Phone', 'Company', 'Status'],
							['Id', 'FirstName', 'LastName', 'Phone', 'Company', 'Status'],
							[
								{path: 'Id', type: 'string'},
								{path: 'FirstName', type: 'string'},
								{path: 'LastName', type: 'string'},
								{path: 'Phone', type: 'string'},
								{path: 'Company', type: 'string'},
								{path: 'Status', type: 'string'}
							]
		);

	this.LeadCollection = ModelCollectionFactory.createCollection(
							'Lead',
							['Id', 'FirstName', 'LastName', 'Phone', 'Company', 'Status'],
							['Id', 'FirstName', 'LastName', 'Phone', 'Company', 'Status'],
							[
								{path: 'Id', type: 'string'},
								{path: 'FirstName', type: 'string'},
								{path: 'LastName', type: 'string'},
								{path: 'Phone', type: 'string'},
								{path: 'Company', type: 'string'},
								{path: 'Status', type: 'string'}
							]
		);

	this.getLeads = function(criteria, successCB, failCB){
		var collection = new this.LeadCollection();
		collection.setCriteria(criteria, null, null);
		collection.fetch({
			success: successCB,
			error: failCB
		});
	};

	this.getLead = function(id){
		var model = new this.Lead({Id:id});
		model.fetch();
		return model;
	};

	this.leadExists= function(fName, lName, phones){
		this.exists = false;
		var that = this;
		var query = 'SELECT Id FROM Lead WHERE FirstName = \'' +fName+ '\' AND LastName = \'' +lName + '\' AND Phone IN (\''+phones.join('\',\'') + '\')';
		LOG('LEAD EXISTS', query);
		Force.forcetkClient.query(soql, function(data){that.exists = (data.size() > 0);});
	}
}

ServiceModule.service('LeadService', ['ModelCollectionFactory', 'ModelFactory', LeadService]);