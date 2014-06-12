'use strict';
// The version of the REST API you wish to use in your app.
var apiVersion = "v28.0";

// If you want to prevent dragging, uncomment this section
/*
		function preventBehavior(e) 
		{ 
	      e.preventDefault(); 
	    };
		document.addEventListener("touchmove", preventBehavior, false);
		*/

/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
		see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
		for more details -jm */
/*
		function handleOpenURL(url)
		{
			// do something with the url passed in.
		}
		*/

var forcetkClient;
var debugMode = true;
var logToConsole = cordova.require("salesforce/util/logger").logToConsole;

//Detailed alerting for javascript objects
var displayObject = function(obj){
		alert('OBJ -- ' + JSON.stringify(obj, null, 4));
};

//Generic log messages
var LOG = function(preamble, object){
	var date = new Date();
    var formatted = '[' + date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' - ' +  date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ']';

	console.log('DEBUG -- ' + formatted + ' -- ' + preamble + ' -- ' + JSON.stringify(object));
}

jQuery(document).ready(function() {
	//Add event listeners and so forth here
	logToConsole("onLoad: jquery ready");
	document.addEventListener("deviceready", onDeviceReady, false);
});

// When this function is called, Cordova has been initialized and is ready to roll 
function onDeviceReady() {
    console.log("onDeviceReady: cordova ready");
	//Call getAuthCredentials to get the initial session credentials
    cordova.require("salesforce/plugin/oauth").getAuthCredentials(
        function(creds) {
            appStart( _.extend(creds, {userAgent: navigator.userAgent}) );
        }, 
        function(error) { 
            console.log("Auth failed: " + error); 
        });

    //enable buttons
    regLinkClickHandlers();
}

function appStart(creds)
{
    // Force init
    Force.init(creds, null, null, cordova.require("salesforce/plugin/oauth").forcetkRefresh);

    angular.bootstrap(document, ["App"]);
}

function salesforceSessionRefreshed(creds) {
	// Depending on how we come into this method, `creds` may be callback data from the auth
	// plugin, or an event fired from the plugin.  The data is different between the two.	
	/*var credsData = creds;
	if (creds.data) // Event sets the `data` object with the auth data.
		credsData = creds.data;

	forcetkClient = new forcetk.Client(credsData.clientId, credsData.loginUrl, null,
		cordova.require("salesforce/plugin/oauth").forcetkRefresh);
	forcetkClient.setSessionToken(credsData.accessToken, apiVersion, credsData.instanceUrl);
	forcetkClient.setRefreshToken(credsData.refreshToken);
	forcetkClient.setUserAgentString(credsData.userAgent);*/

	//Previous was default generated code, when SmartStore/SmartSync is used, Force.init does this all for us.
	Force.init( _.extend(creds, {userAgent: navigator.userAgent}), null, null, cordova.require("salesforce/plugin/oauth").forcetkRefresh);
	angular.bootstrap(document, ["App"]);
}

function getAuthCredentialsError(error) {
	logToConsole("getAuthCredentialsError: " + error);
}