angular.module("contributionsApp", ['ngRoute', 'ngCookies'])
    .config(function($routeProvider) {
        $routeProvider
            .when("/", {
                templateUrl: "home.html",
                controller: "ListController",
                resolve: {
                    contributions: function(Contributions) {
                        return Contributions.getContributions();
                    }
                }
            })
            .when("/new/contribution", {
                controller: "NewContributionController",
                templateUrl: "contribution-form.html"
            })
            .when("/contribution/:contributionId", {
                controller: "EditContributionController",
                templateUrl: "contribution.html"
            })
            .otherwise({
                redirectTo: "/"
            })
    })
    .service("Contributions", function($http) {
        this.getContributions = function() {
            return $http.get("/api/contributions").
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error finding contributions.");
                });
        }
        this.createContribution = function(contribution) {
            return $http.post("/api/contributions", contribution).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error creating contribution.");
                });
        }
        this.getContribution = function(contributionId) {
            var url = "/api/contributions/" + contributionId;
            return $http.get(url).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error finding this contribution.");
                });
        }
        this.editContribution = function(contribution) {
            var url = "/api/contributions/" + contribution._id;
            console.log(contribution._id);
            return $http.put(url, contribution).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error editing this contribution.");
                    console.log(response);
                });
        }
        this.deleteContribution = function(contributionId) {
            var url = "/api/contributions/" + contributionId;
            return $http.delete(url).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error deleting this contribution.");
                    console.log(response);
                });
        }
    })
    .service("Users", function ($http) {
        this.getLoginUrl = function() {
            return $http.get("/api/users/login-url").
                then(function(response) {
                    return response;
            }, function (response) {
                alert("Error getting login url");
            })
        }
    })
    .controller("ListController", function($scope, $cookies, $location, contributions, Users) {
        $scope.contributions = contributions.data;
        $scope.authToken = $cookies.get('access_token');

        //$cookies.put('myFavorite', 'oatmeal');
        Users.getLoginUrl().then(function(doc) {
            $scope.loginUrl = doc.data.url;
        }, function(response) {
            alert(response);
        });

        $scope.logout = function() {
            $cookies.remove('access_token');
            $location.path("#/");
        }
    })
    .controller("NewContributionController", function($scope, $location, Contributions) {
        $scope.back = function() {
            $location.path("#/");
        }

        $scope.saveContribution = function(contribution) {
            Contributions.createContribution(contribution).then(function(doc) {
                var contributionUrl = "/api/contribution/" + doc.data._id;
                $location.path(contributionUrl);
            }, function(response) {
                alert(response);
            });
        }
    })
    .controller("EditContributionController", function($scope, $routeParams, Contributions) {
        Contributions.getContribution($routeParams.contributionId).then(function(doc) {
            $scope.contribution = doc.data;
        }, function(response) {
            alert(response);
        });

        $scope.toggleEdit = function() {
            $scope.editMode = true;
            $scope.contributionFormUrl = "contribution-form.html";
        }

        $scope.back = function() {
            $scope.editMode = false;
            $scope.contributionFormUrl = "";
        }

        $scope.saveContribution = function(contribution) {
            Contributions.editContribution(contribution);
            $scope.editMode = false;
            $scope.contributionFormUrl = "";
        }

        $scope.deleteContribution = function(contributionId) {
            Contributions.deleteContribution(contributionId);
        }
    });