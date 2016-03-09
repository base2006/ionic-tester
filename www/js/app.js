// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('starter', ['ionic', 'ngCordova']);
var db = null;

app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      // cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});

/**
 * Configuration and states
 */

app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

    // menu
    .state('home', {
        url: '/home',
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
    })

    // google maps
    .state('maps', {
        url: '/maps',
        templateUrl: 'templates/maps.html',
        controller: 'MapCtrl'
    })

    // todo list
    .state('config', {
        url: '/todo',
        templateUrl: 'templates/config.html',
        controller: 'ConfigCtrl'
    })

    .state('categories', {
        url: '/categories',
        templateUrl: 'templates/categories.html',
        controller: 'CategoriesCtrl'
    })

    .state('lists', {
        url: '/lists/:categorieId',
        templateUrl: 'templates/lists.html',
        controller: 'ListsCtrl'
    })

    .state('items', {
        url: '/items/:listId',
        templateUrl: 'templates/items.html',
        controller: 'ItemsCtrl'
    })

    // contacts
    .state('contacts', {
        url: '/contacts',
        templateUrl: 'templates/contacts.html',
        controller: 'ContactCtrl'
    })

    $urlRouterProvider.otherwise('/home');
});

/**
 * Controllers
 */

app.controller("AppCtrl", function($scope) {

});

// Google maps
app.controller("MapCtrl", function($scope) {
    $scope.init = function() {
        var myLatlng = new google.maps.LatLng(51.271213, 6.044010);
        var mapOptions = {
            center: myLatlng,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map"), mapOptions);

        var infowindow = new google.maps.InfoWindow({
            content: '<h4>My Home!</h4>Wittebergstraat 60<br>5954 AK Beesel'
        });

        var marker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            title: 'My home!'
          });

        marker.addListener('click', function() {
          infowindow.open(map, marker);
        });
        $scope.map = map;
    };
});

// Todo list
app.controller("ConfigCtrl", function($scope, $ionicLoading, $cordovaSQLite, $location, $ionicHistory, $ionicPlatform) {
    $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
    });
    $ionicPlatform.ready(function() {
        $ionicLoading.show({ template: "Loading..." });
        if(window.cordova) {
            window.plugins.sqlDB.copy("populated.db", function() {
                db = $cordovaSQLite.openDB("populated.db");
                $ionicLoading.hide();
                $location.path("/categories");
            }, function(error) {
                db = $cordovaSQLite.openDB("populated.db");
                $ionicLoading.hide();
                $location.path("/categories");
            });
        } else {
            db = openDatabase("websql.db", "1.0", "My WebSQL Database", 2 * 1024 * 1024);
            db.transaction(function(tx) {
                tx.executeSql("DROP TABLE IF EXISTS tblCategories");
                tx.executeSql("CREATE TABLE IF NOT EXISTS tblCategories (id integer primary key, category_name text)");
                tx.executeSql("CREATE TABLE IF NOT EXISTS tblTodoLists (id integer primary key, category_id integer, todo_list_name text)");
                tx.executeSql("CREATE TABLE IF NOT EXISTS tblTodoListItems (id integer primary key, todo_list_id integer, todo_list_item_name text)");
                tx.executeSql("INSERT INTO tblCategories (category_name) VALUES (?)", ["fun"]);
                tx.executeSql("INSERT INTO tblCategories (category_name) VALUES (?)", ["holidays"]);
                tx.executeSql("INSERT INTO tblCategories (category_name) VALUES (?)", ["work"]);
            });
            $ionicLoading.hide();
            $location.path("/categories");
        }
    });
});

app.controller("CategoriesCtrl", function($scope, $ionicPlatform, $cordovaSQLite) {
    $scope.categories = [];
    $ionicPlatform.ready(function() {
        var query = "SELECT id, category_name FROM tblCategories";
        $cordovaSQLite.execute(db, query, []).then(function(res) {
            if (res.rows.length > 0) {
                for (var i = 0; i < res.rows.length; i++) {
                    $scope.categories.push({id: res.rows.item(i).id, category_name: res.rows.item(i).category_name});
                }
            }
        }, function(error) {
            console.error(error);
        });
    });
});

app.controller("ListsCtrl", function($scope, $ionicPlatform, $cordovaSQLite, $stateParams, $ionicPopup) {
    $scope.lists = [];
    $ionicPlatform.ready(function() {
        var query = "SELECT id, category_id, todo_list_name FROM tblTodoLists WHERE category_id = ?";
        $cordovaSQLite.execute(db, query, [$stateParams.categoryId]).then(function(res) {
            if (res.rows.length > 0) {
                for (var i = 0; i < res.rows.length; i++) {
                    $scope.lists.push({id: res.rows.item(i).id, category_id: res.rows.item(i).category_id, todo_list_name: res.rows.item(i).todo_list_name});
                }
            }
        }, function(error) {
            console.error(error);
        });
    });

    $scope.insert = function() {
        $ionicPopup.prompt({
            title: "Enter a new TODO list",
            inputType: "text"
        })
        .then(function(result) {
            if (result !== undefined) {
                var query = "INSERT INTO tblTodoLists (category_id, todo_list_name) VALUES (?, ?)";
                $cordovaSQLite.execute(db, query, [$stateParams.categoryId, result]).then(function(res) {
                    $scope.lists.push({id: res.insertId, category_id: $stateParams.categoryId, todo_list_name: result});
                }, function(error) {
                    console.error(error);
                });
            } else {
                console.log("Action not completed");
            }
        });
    }
});

app.controller("ItemsCtrl", function($scope, $ionicPlatform, $cordovaSQLite, $stateParams, $ionicPopup) {
    $scope.items = [];
    $ionicPlatform.ready(function() {
        var query = "SELECT id, todo_list_id, todo_list_item_name FROM tblTodoListItems WHERE todo_list_id = ?";
        $cordovaSQLite.execute(db, query, [$stateParams.listId]).then(function(res) {
            if (res.rows.length > 0) {
                for (var i = 0; i < res.rows.length; i++) {
                    $scope.items.push({id: res.rows.item(i).id, todo_list_id: res.rows.item(i).todo_list_id, todo_list_item_name: res.rows.item(i).todo_list_item_name});
                }
            }
        }, function(error) {
            console.error(error);
        });
    });

    $scope.insert = function() {
        $ionicPopup.prompt({
            title: "Enter a new TODO list item",
            inputType: "text"
        })
        .then(function(result) {
            if (result !== undefined) {
                var query = "INSERT INTO tblTodoListItems (todo_list_id, todo_list_item_name) VALUES (?, ?)";
                $cordovaSQLite.execute(db, query, [$stateParams.listId, result]).then(function(res) {
                    $scope.items.push({id: res.insertId, todo_list_id: $stateParams.listId, todo_list_item_name: result});
                }, function(error) {
                    console.error(error);
                });
            } else {
                console.log("Action not completed");
            }
        });
    }
});

// Contacts
app.controller("ContactCtrl", function($scope, $cordovaContacts, $ionicPlatform) {
    $scope.getContactList = function() {
        $cordovaContacts.find({}).then(function(result) {
            $scope.contacts = result;
        }, function(error) {
            console.log(error);
        });
    }

    $ionicPlatform.ready(function() {
        $scope.getContactList();
    });

    $scope.createContact = function() {
        $cordovaContacts.save({"displayName": "Dre Hendriks"}).then(function(result) {
            $scope.getContactList();
        }, function(error) {
            console.log(error);
        });
    }

    $scope.removeContact = function() {
        $cordovaContacts.remove({"displayName": "Dre Hendriks"}).then(function(result) {
            $scope.getContactList();
        }, function(error) {
            console.log(error);
        });
    }
});
