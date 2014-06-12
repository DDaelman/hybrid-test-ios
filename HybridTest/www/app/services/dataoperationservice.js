'use strict';

function DataOperationService($state){
	this.ConflictHandler = 	{
								mergeMode:'merge-fail-if-conflict',
								comparePath:'#/compare/',
								conflicts: new Queue() 
								//Queue because objects need to be removed immediately after resolution,
								//bad performance to remove first index of array every time
							};

	this.OfflineHandler = {
		toSave: [],
		toCreate: [],
		toDelete: []
	};

	this.isOnline = function(){
		return OfflineTracker.isOnline();
	};

    this.setMergeMode = function(mode){
    	this.ConflictHandler.mergeMode = mode;
    };

	this.setComparePath = function(path){
		this.ConflictHandler.comparePath = path;
	};

	this.addConflict = function(conflict){
		this.ConflictHandler.conflicts.enqueue(conflict);
	};

	this.currentConflict = function(){
		if(!this.ConflictHandler.conflicts.isEmpty()){
			return this.ConflictHandler.conflicts.peek();
		}else{
			return null;
		}
	};

	this.nextConflict = function(){
		if(!this.ConflictHandler.conflicts.isEmpty()){
			return this.ConflictHandler.conflicts.dequeue();
		}else{
			return null;
		}
	};

	this.clearConflicts = function(){
		this.ConflictHandler.conflicts = new Queue();
	};

	this.getConflicts = function(){
		return this.ConflictHandler.conflicts;
	};

	this.save = function(record, autoConflictHandling, onSuccess, onFail){
		var successCB = onSuccess || function(){};
		var errorCB = onFail || function(){};
		var that = this;			
		record.save(null,
			 		{
			 			mergeMode: that.ConflictHandler.mergeMode,
						success: successCB,
		 				error: function(rec, conflict){
		 					errorCB();
		 					//Conflict on single record
		 					LOG('CONFLICT', conflict);
		 					that.addConflict(conflict);
		 					if(autoConflictHandling){
			 					$state.transitionTo('conflict');
			 				}			 				
			 			}
					}
		);
		if(!that.isOnline()){	
			LOG('AFTER CACHE STORE', record.get('Id'));		
			that.OfflineHandler.toSave.push(record.toJSON());
		}
	};

	this.create = function(record, onSuccess, onFail){		
		//New record insert, no conflicts to be detected, callbacks for notifications, error handling
		var successCB = onSuccess || function(){};
		var errorCB = onFail || function(){};
		record.save(null,
					{
						success: successCB,
						error: errorCB
					}
		);		
		if(!this.isOnline()){
			//Record only saved in cache
			this.OfflineHandler.toCreate.push(record);
		}
	};

	this.destroy = function(record, onSuccess, onFail){
		var successCB = onSuccess || function(){};
		var errorCB = onFail || function(){};
		record.destroy(
						{
							success: successCB,
							error: errorCB
						}
			);
		if(!this.isOnline()){
			this.OfflineHandler.toDelete.push(record);
		}
	};
	
	var that = this;
	this.saveAll = function(){
		LOG('SAVING ALL', that.OfflineHandler.toSave);
		LOG('SAVING ALL CACHE', CacheCollection['Lead_cache']);
		CacheCollection['Lead_cache'].saveAll(that.OfflineHandler.toSave, false);

	};
	
	this.syncAll = function(){
		LOG('SYNC ALL', {});
		that.OfflineHandler.toCreate.forEach(function(record){
			that.create(record);
		});
		that.OfflineHandler.toCreate = [];
		that.OfflineHandler.toSave.forEach(function(record){
			that.save(record, true);
		});
		that.OfflineHandler.toSave = [];
		that.OfflineHandler.toDelete.forEach(function(record){
			that.destroy(record);
		});
		that.OfflineHandler.toDelete = [];
	};	
}

ServiceModule.service('DataOperationService', ['$state', DataOperationService]);

setTimeout(function(){
	var elem = angular.element(document.querySelector('[ng-controller]'));
	var injector = elem.injector();
	var myService = injector.get('DataOperationService');
	OfflineTracker.addToOnlineEvent(myService.syncAll);
}, 2000);
