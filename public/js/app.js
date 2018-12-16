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
            .when("/newest", {
                templateUrl: "newest.html",
                controller: "NewestController",
                resolve: {
                    contributions: function(Contributions) {
                        return Contributions.getNewestContributions();
                    }
                }
            })
            .when("/ask", {
                templateUrl: "ask.html",
                controller: "AskController",
                resolve: {
                    contributions: function(Contributions) {
                        return Contributions.getAskContributions();
                    }
                }
            })
            .when("/threads", {
                templateUrl: "threads.html",
                controller: "ThreadsController",
                resolve: {
                    contributions: function(Contributions) {
                        return Users.getThreads();
                    }
                }
            })
            .when("/submit", {
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
    .service("Contributions", function($http, $location) {
        this.getContributions = function() {
            return $http.get("/api/contributions").
                then(function(response) {
                    return response;
                }, function(response) {
                    //alert("Error finding contributions.");
                    document.getElementById("error_messages").innerHTML = response.data.error;
                    console.log(response);
                });
        }
        this.getNewestContributions = function() {
            return $http.get("/api/contributions/new").
                then(function(response) {
                    return response;
                }, function(response) {
                    //alert("Error finding contributions.");
                    document.getElementById("error_messages").innerHTML = response.data.error;
                    console.log(response);
                });
        }
        this.getAskContributions = function() {
            return $http.get("/api/contributions/ask").
                then(function(response) {
                    return response;
                }, function(response) {
                    //alert("Error finding contributions.");
                    document.getElementById("error_messages").innerHTML = response.data.error;
                    console.log(response);
                });
        }
        this.createContribution = function(token, contribution) {
            // console.log(token);
            // let headers = new Headers();
            // headers.append('Authorization', 'Basic ' + token);
            // headers.append('Content-Type', 'application/json');
            // console.log(headers);
            contribution.access_token = token;
            return $http.post("/api/contributions", contribution).
                then(function(response) {
                    console.log("service then");
                    return response;
                }, function(response) {
                    //alert("Error creating contribution.");
                    if (response.status == 302) {
                        console.log(response.data.redirectUrl);
                        $location.path(response.data.redirectUrl);
                    }
                    else {
                        document.getElementById("error_messages").innerHTML = response.data.error;
                        console.log(response);
                    }
                    //console.log("service error");

                });
        }
        this.getContribution = function(contributionId) {
            var url = "/api/contributions/" + contributionId;
            return $http.get(url).
                then(function(response) {
                    return response;
                }, function(response) {
                    //alert("Error finding this contribution.");
                    document.getElementById("error_messages").innerHTML = response.data.error;
                    console.log(response);
                });
        }
        this.editContribution = function(contribution) {
            var url = "/api/contributions/" + contribution._id;
            console.log(contribution._id);
            return $http.put(url, contribution).
                then(function(response) {
                    return response;
                }, function(response) {

                    //alert("Error editing this contribution.");
                    document.getElementById("error_messages").innerHTML = response.data.error;
                    console.log(response);
                });
        }
        this.deleteContribution = function(contributionId) {
            var url = "/api/contributions/" + contributionId;
            return $http.delete(url).
                then(function(response) {
                    return response;
                }, function(response) {
                    //alert("Error deleting this contribution.");
                    document.getElementById("error_messages").innerHTML = response.data.error;
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
                //alert("Error getting login url");
                document.getElementById("error_messages").innerHTML = response.data.error;
                console.log(response);
            })
        }
        this.getUser = function(id) {
            return $http.get("/api/users/"+id).
                then(function(response) {
                    return response.data;
            }, function (response) {
                //alert("Error getting login url");
                document.getElementById("error_messages").innerHTML = response.data.error;
                console.log(response);
            })
        }
        this.getThreads = function(id) {
            return $http.get("/api/users/"+id+"/comments").
                then(function(response) {
                    return response.data;
            }, function (response) {
                //alert("Error getting login url");
                document.getElementById("error_messages").innerHTML = response.data.error;
                console.log(response);
            })
        }
    })
    .controller("ListController", function($scope, $cookies, $location, contributions, Users) {
        $scope.contributions = contributions.data;

        $scope.authToken = $cookies.get('access_token');
        $scope.userDisplayName = $cookies.get('user_display_name');
        $scope.userImageUrl = $cookies.get('user_image');
        $scope.userId = $cookies.get('user_id');
        Users.getLoginUrl().then(function(doc) {
            $scope.loginUrl = doc.data.url;
        }, function(response) {
            //alert(response);
            document.getElementById("error_messages").innerHTML = response.data.error;
            console.log(response);
        });
        $scope.logout = function() {
            $cookies.remove('access_token');
            $cookies.remove('user_display_name');
            $cookies.remove('user_image');
            $cookies.remove('user_id');
            $location.path("#/");
        }
        Users.getUser($scope.userId).then(function(doc) {
            console.log(doc);
            $scope.userPoints = doc.points;
        }, function(response) {
            //alert(response);
            document.getElementById("error_messages").innerHTML = response.data.error;
            console.log(response);
        });
    })
    .controller("NewestController", function($scope, $cookies, $location, contributions, Users) {
        $scope.contributions = contributions.data;

        $scope.authToken = $cookies.get('access_token');
        $scope.userDisplayName = $cookies.get('user_display_name');
        $scope.userImageUrl = $cookies.get('user_image');
        $scope.userId = $cookies.get('user_id');
        Users.getLoginUrl().then(function(doc) {
            $scope.loginUrl = doc.data.url;
        }, function(response) {
            //alert(response);
            document.getElementById("error_messages").innerHTML = response.data.error;
            console.log(response);
        });
        $scope.logout = function() {
            $cookies.remove('access_token');
            $cookies.remove('user_display_name');
            $cookies.remove('user_image');
            $cookies.remove('user_id');
            $location.path("#/");
        }
        Users.getUser($scope.userId).then(function(doc) {
            console.log(doc);
            $scope.userPoints = doc.points;
        }, function(response) {
            //alert(response);
            document.getElementById("error_messages").innerHTML = response.data.error;
            console.log(response);
        });
    })
    .controller("AskController", function($scope, $cookies, $location, contributions, Users) {
        $scope.contributions = contributions.data;

        $scope.authToken = $cookies.get('access_token');
        $scope.userDisplayName = $cookies.get('user_display_name');
        $scope.userImageUrl = $cookies.get('user_image');
        $scope.userId = $cookies.get('user_id');
        Users.getLoginUrl().then(function(doc) {
            $scope.loginUrl = doc.data.url;
        }, function(response) {
            //alert(response);
            document.getElementById("error_messages").innerHTML = response.data.error;
            console.log(response);
        });
        $scope.logout = function() {
            $cookies.remove('access_token');
            $cookies.remove('user_display_name');
            $cookies.remove('user_image');
            $cookies.remove('user_id');
            $location.path("#/");
        }
        Users.getUser($scope.userId).then(function(doc) {
            console.log(doc);
            $scope.userPoints = doc.points;
        }, function(response) {
            //alert(response);
            document.getElementById("error_messages").innerHTML = response.data.error;
            console.log(response);
        });
    })
    .controller("NewContributionController", function($scope, $cookies, $location, Contributions, Users) {
        $scope.back = function() {
            $location.path("#/");
        }

        var token = $cookies.get('access_token');
        $scope.saveContribution = function(contribution) {
            Contributions.createContribution(token, contribution).then(function(doc) {
                var contributionUrl = "/api/contribution/" + doc.data._id;
                console.log("controller ok");
                $location.path(contributionUrl);
            }, function(response) {
                //alert(response);
                document.getElementById("error_messages").innerHTML = response.data.error;
                console.log("controller error");
                console.log(response);
            });
        }

        $scope.authToken = $cookies.get('access_token');
        $scope.userDisplayName = $cookies.get('user_display_name');
        $scope.userImageUrl = $cookies.get('user_image');
        Users.getLoginUrl().then(function(doc) {
            $scope.loginUrl = doc.data.url;
        }, function(response) {
            //alert(response);
            document.getElementById("error_messages").innerHTML = response.data.error;
            console.log(response);
        });
        $scope.logout = function() {
            $cookies.remove('access_token');
            $cookies.remove('user_display_name');
            $cookies.remove('user_image');
            $location.path("#/");
        }
    })
    .controller("EditContributionController", function($scope, $cookies, $routeParams, Contributions, Users, $location) {
        Contributions.getContribution($routeParams.contributionId).then(function(doc) {
            $scope.contribution = doc.data;
        }, function(response) {
            //alert(response);
            document.getElementById("error_messages").innerHTML = response.data.error;
            console.log(response);
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

        $scope.authToken = $cookies.get('access_token');
        $scope.userDisplayName = $cookies.get('user_display_name');
        $scope.userImageUrl = $cookies.get('user_image');
        Users.getLoginUrl().then(function(doc) {
            $scope.loginUrl = doc.data.url;
        }, function(response) {
            //alert(response);
            document.getElementById("error_messages").innerHTML = response.data.error;
            console.log(response);
        });
        $scope.logout = function() {
            $cookies.remove('access_token');
            $cookies.remove('user_display_name');
            $cookies.remove('user_image');
            $location.path("#/");
        }
    });