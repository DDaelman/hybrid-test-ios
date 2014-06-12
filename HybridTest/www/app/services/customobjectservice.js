'use strict';

function CustomObjectService(CustomCacheFactory){
	this.initStatusOptions = function(){
		LOG('INIT CUSTOMOBJECTSERVICE', {});
		CustomCacheFactory.createCache('LeadStatuses',
										[
											{path: 'label', type: 'string'}, 
											{path: 'value', type: 'string'}
										],
										'Id');
		var describeStatuses = function(data){
			data.fields.forEach(function(item){
				if(item.name == 'Status'){
					var count = 0;
					item.picklistValues.forEach(function(i){					
						CustomCacheFactory.upsertInCache('LeadStatuses', {Id: count, label: i.label, value: i.value});
						count += 1;
					});				
				}			
			});
		};
		Force.forcetkClient.describe('Lead', describeStatuses, null);
	};

	this.getStatusOptions = function(callback){
		CustomCacheFactory.queryCache('LeadStatuses', 'value', OPERATOR_LIKE, '%', 25, callback);
	};

	
}

ServiceModule.service('CustomObjectService', ['CustomCacheFactory', CustomObjectService]);