'use strict';

function ContactService(ModelCollectionFactory, ModelFactory){
	this.Contact = ModelFactory.createModel(
						'Contact',
						['Id', 'Name', 'FirstName', 'LastName'], 
						['Id', 'FirstName', 'LastName'],
						[
							{path:'Name', type:'string'},
							{path:'FirstName', type:'string'},
							{path:'LastName', type:'string'}
						]);
	this.ContactCollection = ModelCollectionFactory.createCollection(
								'Contact', 
								['Id', 'Name', 'FirstName', 'LastName'], 
								['Id', 'FirstName', 'LastName'],
								[
									{path:'Name', type:'string'},
									{path:'FirstName', type:'string'},
									{path:'LastName', type:'string'}
								]);

	//Get list of contacts by criteria
	this.getContacts = function(criteria, successCB, failCB){
		var collection = new this.ContactCollection();
		collection.setCriteria(criteria, null, null);
		collection.fetch({
			success: successCB,
			error: failCB
		});
	};

	//Get single contact by Id
	this.getContact = function(id){		
		var con = new this.Contact({Id:id});
		con.fetch();
		return con;
	};
}

ServiceModule.service('ContactService', ['ModelCollectionFactory', 'ModelFactory', ContactService]);