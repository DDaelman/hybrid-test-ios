'use strict';

var ModelModule = angular.module("Models", []);
var Tracker = Backbone.Model.extend({  
    onlineActions: [],
    offlineActions:[],
    serverReachable: function() {
      // IE vs. standard XHR creation
      var x = new ( window.ActiveXObject || XMLHttpRequest )( "Microsoft.XMLHTTP" ),s;
      x.open(
        // requesting the headers is faster, and just enough
        "HEAD",
        // append a random string to the current hostname,
        // to make sure we're not hitting the cache
        "https://login.salesforce.com",
        // make a synchronous request
        false
      );
      try {
        x.send();
        s = x.status;
        // Make sure the server is reachable
        return ( s >= 200 && s < 300 || s === 304 );
      // catch network & other problems
      } catch (e) {
        return false;
      }
    },
    initialize : function(){  
        var that = this;  
        this.set("isOnline", that.serverReachable());  
        document.addEventListener("offline", function(){  
            that.set("isOnline", false);  
            that.offlineActions.forEach(function(item){
                LOG('OFFLINE ACTION', item);
                item();
            });
        }, false);  
        document.addEventListener("online", function(){  
            that.set('isOnline', true); 
            that.onlineActions.forEach(function(item){
                LOG('ONLINE ACTION', item);
                item();
            });
        }, false);  
    },

    addToOnlineEvent: function(fn){
        //Functions to be run on online event
        LOG('ADD TO ONLINE EVENT', fn);
        this.onlineActions.push(fn);
    },

    addToOfflineEvent: function(fn){
        //Functions to be run on offline event
        this.offlineActions.push(fn);
    },

    isOnline: function(){
        if(this.get('isOnline')){
            return this.serverReachable();
        }else{
            return false;
        }
    }
});  
var OfflineTracker = new Tracker();
var CacheCollection = [];

var initCaches = function(type,  index, key){
    if(CacheCollection[type + '_cache'] == null){
        CacheCollection[type + '_cache'] = new Force.StoreCache(type + '_soup', index, key);
        CacheCollection[type + '_cache_originals'] = new Force.StoreCache(type + '_soup_originals', null, key);
        return $.when(CacheCollection[type + '_cache'].init(), CacheCollection[type + '_cache_originals'].init());
    }    
};

//Generic operator constants for combined soql and cache query use
var OPERATOR_EQUALS = {soql: '=', cache: 'exact'};
var OPERATOR_LIKE = {soql: 'LIKE', cache: 'like'};
var OPERATOR_GT = {soql: '>', cache: 'range'};
var OPERATOR_LT = {soql: '<', cache: 'range'};

//Returns correct form of cache query based on operator
function createCacheQuery(path, operator, match, pageSize){
    if(operator == OPERATOR_EQUALS){
        return {type:"cache", cacheQuery:{
                        queryType: operator.cache, 
                        indexPath: path,
                        matchKey: match.replace(/'/gi, "").replace(/"/gi, ""), //Replace because strings don't need quotes in cache query                                          
                        likeKey: null, 
                        beginKey: null,
                        endKey: null,
                        smartSql: null,
                        order:"ascending",
                        pageSize: pageSize}};
                    }
    if(operator == OPERATOR_LIKE){
        return {type:"cache", cacheQuery:{
                        queryType: operator.cache, 
                        indexPath: path,
                        matchKey: null,                                                
                        likeKey: match.replace(/'/gi, "").replace(/"/gi, ""), 
                        beginKey: null,
                        endKey: null,
                        order:"ascending",
                        pageSize: pageSize}};
                    }
    if(operator == OPERATOR_GT){
        return {type:"cache", cacheQuery:{
                        queryType: operator.cache, 
                        indexPath: path,
                        matchKey: null,                                                
                        likeKey: null, 
                        beginKey: match,
                        endKey: null,
                        order:"ascending",
                        pageSize: pageSize}};
                    }
    if(operator == OPERATOR_LT){
        return {type:"cache", cacheQuery:{
                        queryType: operator.cache, 
                        indexPath: path,
                        matchKey: null,                                                
                        likeKey: null, 
                        beginKey: null,
                        endKey: match,
                        order:"ascending",
                        pageSize: pageSize}};
                    }    
}

ModelModule.factory("ModelFactory", function(){
    return{
        createModel: function(type, readFields, updateFields, index){
            //Construct caches            
            initCaches(type, index);
            var model = Force.SObject.extend({
              sobjectType: type,
              fieldlist: function(method){
                    return method == 'read' ? readFields : updateFields; 
                },
              cache: function() { return CacheCollection[type + '_cache'];},
              cacheForOriginals: function() { return CacheCollection[type + '_cache_originals'];},
              cacheMode: function(method) {
                if (!OfflineTracker.isOnline()) {
                    return Force.CACHE_MODE.CACHE_ONLY;
                }
                else {
                    return (method == "read" ? Force.CACHE_MODE.CACHE_FIRST : Force.CACHE_MODE.SERVER_FIRST);
                }
            }                
        });
            return model;            
        }
    };
});

ModelModule.factory("ModelCollectionFactory", function(ModelFactory){
    return {
        createCollection: function(type, readFields, updateFields, index){
            //ModelFactory also instantiates the caches, cache naming format is [type]_cache and [type]_cache_originals
            var model = ModelFactory.createModel(type, readFields, updateFields, index); 
            var collection = Force.SObjectCollection.extend({
                model: model,
                fieldlist: readFields,
                setCriteria: function(criteria, customSoql, customCacheQuery) {
                    if(criteria != null){
                        this.searchField = criteria.path; 
                        this.operator = criteria.operator;
                        this.key = criteria.match;
                        this.pageSize = criteria.pageSize;
                    }
                    this.customSoql = customSoql;
                    this.customCacheQuery = customCacheQuery;
                },
                cache: function() { return CacheCollection[type + '_cache'];},
                cacheForOriginals: function() { return CacheCollection[type + '_cache_originals'];},
                config: function() {
                                    // Offline: do a cache query
                                    if (!OfflineTracker.isOnline()) {
                                        if(this.customCacheQuery != null){
                                            return {type:'cache', cacheQuery:{
                                                    queryType:'smart',
                                                    smartSql:this.customCacheQuery,
                                                    pageSize:50}};
                                            }else{                                     
                                                return createCacheQuery(this.searchField, this.operator, this.key, this.pageSize);
                                            }
                                        }
                                    // Online
                                    else {
                                        if(this.customSoql != null){
                                            return {type:'soql', query:this.customSoql};
                                        }else{
                                            var soql = "SELECT " + this.fieldlist.join(",")
                                            + ' FROM ' + type
                                            + ' WHERE '+ this.searchField + " " + this.operator.soql + " " + this.key
                                            + ' ORDER BY ' + this.fieldlist[1];
                                            return {type:'soql', query:soql};
                                        }                                        
                                    }
                                }                
            });
        return collection;
    }
};
});

ModelModule.factory("CustomCacheFactory", function(){
    return {
            createCache: function(name, indexfields, keyfield){
                LOG('CREATE CUSTOM CACHE', indexfields);
                initCaches(name, indexfields, keyfield);
            },
            queryCache: function(name, path, operator, match, pageSize, successCB){
                LOG('QUERY CUSTOM CACHE', createCacheQuery(path, operator, match, pageSize));
               navigator.smartstore.querySoup(name + '_soup',  createCacheQuery(path, operator, match, pageSize ).cacheQuery, successCB, function(err){LOG('CUSTOM CACHE ERROR', err);});
            },
            upsertInCache: function(name, object, successCB){
                navigator.smartstore.upsertSoupEntries(name + '_soup', [object], (successCB || function(){}));
            },
            removeFromCache: function(name, objectId){
                navigator.smartStore.removeFromSoup(name + '_soup', [objectId]);
            }
    };
});

