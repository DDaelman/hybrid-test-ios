'use strict';

var AppModule = angular.module("App", ["ngRoute",
										"Models",
										"Services",
										"Controllers",												
										"ionic"]);

AppModule.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('home', {
      	url: '/home',
      	controller: 'LeadListController',
		templateUrl: 'app/viewparts/leadlistview.html'
    })
    .state('lead', {
      	url: '/lead?leadId&inSalesforce&inDevice&ctid',
      	controller: 'LeadController',
		templateUrl: 'app/viewparts/leaddetailview.html'
    })
    .state('conflict', {
      	url: '/compare',
      	controller: 'ConflictController',
		templateUrl: 'app/viewparts/conflictcompareview.html'
    }).state('settings', {
      	url: '/settings',
		templateUrl: 'app/viewparts/settingsview.html'
    });

    $urlRouterProvider.otherwise('/home');
});