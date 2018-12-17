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
                /*resolve: {
                    comments: function(Users) {
                        return Users.getThreads();
                    }
                }*/
            })
            .when("/submit", {
                controller: "NewContributionController",
                templateUrl: "submit.html"
            })
            .when("/contribution/:contributionId", {
                controller: "EditContributionController",
                templateUrl: "contribution.html"
            })
            .when("/user/:userId", {
                controller: "UserController",
                templateUrl: "profile.html"
            })
            .otherwise({
                redirectTo: "/"
            })
    })
    .service("Contributions", function($http, $location, $window) {
        this.getContributions = function() {
            return $http.get("/api/contributions").
                then(function(response) {
                    console.log(response);
                    return response;
                }, function(response) {
                    //alert("Error finding contributions.");
                    //$("#error_messages").html("Error: "+response.data.error).show();
                    console.log(response);
                });
        }
        this.getNewestContributions = function() {
            return $http.get("/api/contributions/new").
                then(function(response) {
                    return response;
                }, function(response) {
                    //alert("Error finding contributions.");
                    //$("#error_messages").html("Error: "+response.data.error).show();
                    console.log(response);
                });
        }
        this.getAskContributions = function() {
            return $http.get("/api/contributions/ask").
                then(function(response) {
                    return response;
                }, function(response) {
                    //alert("Error finding contributions.");
                    //$("#error_messages").html("Error: "+response.data.error).show();
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
                        $window.location.href = response.data.redirectUrl;
                        //$location.path(response.data.redirectUrl);
                    }
                    else {
                        //$("#error_messages").html("Error: "+response.data.error).show();
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
                    //$("#error_messages").html("Error: "+response.data.error).show();
                    console.log(response);
                });
        }
        this.editContribution = function(token, contribution) {
            contribution.access_token = token;
            var url = "/api/contributions/" + contribution._id;
            console.log(contribution._id);
            return $http.put(url, contribution).
                then(function(response) {
                    console.log(response);
                    return response;
                }, function(response) {

                    //alert("Error editing this contribution.");
                    //$("#error_messages").html("Error: "+response.data.error).show();
                    console.log(response);
                });
        }
        this.deleteContribution = function(token, contributionId) {
            var url = "/api/contributions/" + contributionId;
            let body = {};
            body.access_token = token;
            return $http.delete(url, {data: body, headers: {'Content-Type': 'application/json;charset=utf-8'}}).
                then(function(response) {
                    console.log(response);
                    //return response;
                }, function(response) {
                    //alert("Error deleting this contribution.");
                    //$("#error_messages").html("Error: "+response.data.error).show();
                    console.log(response);
                });
        }
        this.upvote = function(token, contributionId) {
            let body = {};
            body.access_token = token;
            var url = "/api/contributions/"+contributionId+"/votes";
            return $http.post(url, body).
                then(function(response) {
                    return response;
                }, function(response) {
                    //alert("Error deleting this contribution.");
                    //$("#error_messages").html("Error: "+response.data.error).show();
                    console.log(response);
                });
        }
        this.getComments = function(token, contributionId) {
            let body = {};
            body.access_token = token;
            var url = "/api/contributions/"+contributionId+"/comments";
            return $http.get(url, body).
                then(function(response) {
                    return response;
                }, function(response) {
                    //alert("Error deleting this contribution.");
                    //$("#error_messages").html("Error: "+response.data.error).show();
                    console.log(response);
                });
        }
        this.postComment = function(token, contributionId, newComment) {
            var url = "/api/contributions/" + contributionId + "/comments";
            newComment.access_token = token;
            return $http.post(url, newComment).
                then(function(response) {
                    return response;
                }, function(response) {
                    //alert("Error deleting this contribution.");
                    //$("#error_messages").html("Error: "+response.data.error).show();
                    console.log(response);
                });
        }
    })
    .service("Comments", function ($http) {
        this.post = function(token, commentId, newComment) {
            var url = "/api/comments/" + commentId + "/comments";
            newComment.access_token = token;
            return $http.post(url, newComment).
                then(function(response) {
                    return response;
                }, function(response) {
                    //alert("Error deleting this contribution.");
                    //$("#error_messages").html("Error: "+response.data.error).show();
                    console.log(response);
                });
        }
        this.upvote = function(token, commentId) {
            let body = {};
            body.access_token = token;
            var url = "/api/comments/"+commentId+"/votes";
            return $http.post(url, body).
                then(function(response) {
                    return response;
                }, function(response) {
                    //alert("Error deleting this contribution.");
                    //$("#error_messages").html("Error: "+response.data.error).show();
                    console.log(response);
                });
        }
        this.delete = function(token, commentId) {
            var url = "/api/comments/" + commentId;
            let body = {};
            body.access_token = token;
            return $http.delete(url, {data: body, headers: {'Content-Type': 'application/json;charset=utf-8'}}).
                then(function(response) {
                    console.log(response);
                    return response;
                }, function(response) {
                    //alert("Error deleting this contribution.");
                    //$("#error_messages").html("Error: "+response.data.error).show();
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
                //$("#error_messages").html("Error: "+response.data.error).show();
                console.log(response);
            })
        }
        this.getUser = function(id) {
            return $http.get("/api/users/"+id).
                then(function(response) {
                    return response.data;
            }, function (response) {
                //alert("Error getting login url");
                //$("#error_messages").html("Error: "+response.data.error).show();
                console.log(response);
            })
        }
        this.getThreads = function(id) {
            return $http.get("/api/users/"+id+"/comments").
                then(function(response) {
                    return response.data;
            }, function (response) {
                //alert("Error getting login url");
                //$("#error_messages").html("Error: "+response.data.error).show();
                console.log(response);
            })
        }
    })
    .controller("UserController", function($scope, $cookies, $location, Users){
        let token = $cookies.get('access_token');
        $scope.userDisplayName = $cookies.get('user_display_name');
        $scope.authToken = token;
        $scope.userImageUrl = $cookies.get('user_image');
        $scope.userKarma = $cookies.get('user_points');
        $scope.userAbout = $cookies.get('user_about');
        $scope.userEmail = $cookies.get('user_email');
        }
    )
    .controller("ListController", function($scope, $cookies, $location, contributions, Users, Contributions) {
        $scope.contributions = contributions.data;

        let token = $cookies.get('access_token');
        $scope.authToken = token;
        $scope.userDisplayName = $cookies.get('user_display_name');
        $scope.userImageUrl = $cookies.get('user_image');
        $scope.userId = $cookies.get('user_id');
        Users.getLoginUrl().then(function(doc) {
            $scope.loginUrl = doc.data.url;
        }, function(response) {
            //alert(response);
            //$("#error_messages").html("Error: "+response.data.error).show();
            console.log(response);
        });
        $scope.logout = function() {
            $cookies.remove('access_token');
            $cookies.remove('user_display_name');
            $cookies.remove('user_image');
            $cookies.remove('user_id');
            $location.path("#/");
        }
        $scope.upvote = function(contributionId) {
            Contributions.upvote(token, contributionId).then(function(doc) {
                console.log(doc);
            }, function(response) {
                //alert(response);
                //$("#error_messages").html("Error: "+response.data.error).show();
                console.log(response);
            });
        }
        Users.getUser($scope.userId).then(function(doc) {
            $scope.userPoints = doc.points;
        }, function(response) {
            //alert(response);
            //$("#error_messages").html("Error: "+response.data.error).show();
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
            //$("#error_messages").html("Error: "+response.data.error).show();
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
            $scope.userPoints = doc.points;
        }, function(response) {
            //alert(response);
            //$("#error_messages").html("Error: "+response.data.error).show();
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
            //$("#error_messages").html("Error: "+response.data.error).show();
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
            $scope.userPoints = doc.points;
        }, function(response) {
            //alert(response);
            //$("#error_messages").html("Error: "+response.data.error).show();
            console.log(response);
        });
    })
    .controller("NewContributionController", function($scope, $cookies, $location, Contributions, Users, $window) {
        $scope.back = function() {
            $location.path("#/");
        }

        var token = $cookies.get('access_token');
        $scope.saveContribution = function(contribution) {
            console.log(contribution);
            if (!contribution || !contribution.title || (!contribution.text && !contribution.url)) {
                $("#error_messages").html("Please insert data").show();
            } else if (contribution.title && contribution.text && contribution.url) {
                $("#error_messages").html("You can only send a text or url").show();
            } else {
                Contributions.createContribution(token, contribution).then(function(doc) {
                    console.log("createContribution");
                    console.log(doc);
                    var contributionUrl = "#/contribution/" + doc.data._id;
                    //$location.path(contributionUrl);
                    $window.location.href = contributionUrl;
                }, function(response) {
                    //alert(response);
                    //$("#error_messages").html("Error: "+response.data.error).show();
                    console.log(response);
                });
            }
        }

        $scope.authToken = $cookies.get('access_token');
        $scope.userDisplayName = $cookies.get('user_display_name');
        $scope.userImageUrl = $cookies.get('user_image');
        $scope.userId = $cookies.get('user_id');
        Users.getLoginUrl().then(function(doc) {
            $scope.loginUrl = doc.data.url;
        }, function(response) {
            //alert(response);
            //$("#error_messages").html(response.data.error);
            //$("#error_messages").display();
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
            $scope.userPoints = doc.points;
        }, function(response) {
            //alert(response);
            //$("#error_messages").html("Error: "+response.data.error).show();
            console.log(response);
        });
    })
    .controller("ThreadsController", function($scope, $cookies, $location, Contributions, Users) {
        //$scope.contributions = comments.data;

        $scope.authToken = $cookies.get('access_token');
        $scope.userDisplayName = $cookies.get('user_display_name');
        $scope.userImageUrl = $cookies.get('user_image');
        $scope.userId = $cookies.get('user_id');
        Users.getLoginUrl().then(function(doc) {
            $scope.loginUrl = doc.data.url;
        }, function(response) {
            //alert(response);
            //$("#error_messages").html("Error: "+response.data.error).show();
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
            $scope.userPoints = doc.points;
        }, function(response) {
            //alert(response);
            //$("#error_messages").html("Error: "+response.data.error).show();
            console.log(response);
        });
        Users.getThreads($scope.userId).then(function(doc) {
            console.log(doc);
            $scope.contributions = doc;
        }, function(response) {
            //alert(response);
            //$("#error_messages").html("Error: "+response.data.error).show();
            console.log(response);
        });
    })
    .controller("EditContributionController", function($scope, $cookies, $routeParams, Contributions, Users, $location, $window, Comments) {
        let token = $cookies.get('access_token');

        $scope.authToken = token;
        $scope.userDisplayName = $cookies.get('user_display_name');
        $scope.userImageUrl = $cookies.get('user_image');
        $scope.userId = $cookies.get('user_id');

        Contributions.getContribution($routeParams.contributionId).then(function(doc) {
            $scope.contribution = doc.data;
            console.log("getContribution doc.authorId "+doc.data.authorId);
            console.log("getContribution authorId "+$scope.userId);
            if (doc.data.authorId === $scope.userId) {
                $scope.mine = true;
                console.log($scope.mine);
            }
        }, function(response) {
            //alert(response);
            $("#error_messages").html("Error: "+response.data.error).show();
            console.log(response);
        });

        $scope.toggleEdit = function() {
            $scope.editMode = true;
            $scope.contributionFormUrl = "contribution-form.html";
        }

        $scope.postReplyToComment = function(newComment, parentCommentId) {
            //console.log(newComment);
            if (!newComment || !newComment.text) {
                $("#error_messages").html("Please insert data").show();
            } else {
                Comments.post(token, parentCommentId, newComment).then(function(doc) {
                    $window.location.reload();
                }, function(response) {
                    console.log(response);
                });
                //$scope.editMode = false;
                //$scope.contributionFormUrl = "";
            }
        }

        $scope.postComment = function(newComment, contributionId) {
            //console.log(newComment);
            if (!newComment || !newComment.text) {
                $("#error_messages").html("Please insert data").show();
            } else {
                Contributions.postComment(token, contributionId, newComment).then(function(doc) {
                    $window.location.reload();
                }, function(response) {
                    console.log(response);
                });
                //$scope.editMode = false;
                //$scope.contributionFormUrl = "";
            }
        }

        $scope.showReplyForm = function(replyFormContributionId) {
            $("#reply"+replyFormContributionId).show();
        }

        $scope.cancelReply = function(replyFormContributionId) {
            $("#reply"+replyFormContributionId).hide();
            $("#error_messages").hide();
        }

        $scope.back = function() {
            $scope.editMode = false;
            $scope.contributionFormUrl = "";
            $("#error_messages").hide();
        }

        $scope.saveContribution = function(contribution) {
            console.log(contribution);
            if (!contribution || !contribution.title || (!contribution.text && !contribution.url)) {
                $("#error_messages").html("Please insert data").show();
            } else if (contribution.title && contribution.text && contribution.url) {
                $("#error_messages").html("You can only send a text or url").show();
            } else {
                Contributions.editContribution(token, contribution);
                $scope.editMode = false;
                $scope.contributionFormUrl = "";
            }
        }

        $scope.deleteContribution = function(contributionId) {
            Contributions.deleteContribution(token, contributionId).then(function(doc) {
                //console.log("createContribution");
                //console.log(doc);
                //$location.path(contributionUrl);

                $window.location.reload();
                // It's not working
                //setTimeout(() => {
                //    $window.location.href = '#/';
                //}, 3000);  //5s
            }, function(response) {
                //alert(response);
                //$("#error_messages").html("Error: "+response.data.error).show();
                console.log("controller error");
                console.log(response);
            });
        }

        $scope.upvoteComment = function(commentId) {
            Comments.upvote(token, commentId).then(function(doc) {
                //console.log("createContribution");
                //console.log(doc);
                //$location.path(contributionUrl);

                $window.location.reload();
                // It's not working
                //setTimeout(() => {
                //    $window.location.href = '#/';
                //}, 3000);  //5s
            }, function(response) {
                //alert(response);
                //$("#error_messages").html("Error: "+response.data.error).show();
                console.log(response);
            });
        }
        
        Users.getLoginUrl().then(function(doc) {
            $scope.loginUrl = doc.data.url;
        }, function(response) {
            //alert(response);
            //$("#error_messages").html("Error: "+response.data.error).show();
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
            $scope.userPoints = doc.points;
        }, function(response) {
            //alert(response);
            //$("#error_messages").html("Error: "+response.data.error).show();
            console.log(response);
        });
        Contributions.getComments(token, $routeParams.contributionId).then(function(doc) {
            console.log(doc.data);
            $scope.comments = doc.data;
        }, function(response) {
            //alert(response);
            //$("#error_messages").html("Error: "+response.data.error).show();
            console.log(response);
        });

        $scope.deleteComment = function(commentId) {
            Comments.delete(token, commentId).then(function(doc) {
                //console.log("createContribution");
                //console.log(doc);
                //$location.path(contributionUrl);

                $window.location.reload();
                // It's not working
                //setTimeout(() => {
                //    $window.location.href = '#/';
                //}, 3000);  //5s
            }, function(response) {
                //alert(response);
                //$("#error_messages").html("Error: "+response.data.error).show();
                console.log("controller error");
                console.log(response);
            });
        }
    });
