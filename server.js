var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const {google} = require('googleapis');

///////////////////////////////////////////
//
// CONFIG
//
///////////////////////////////////////////

  var googleConfig;
  if (process.env.ENVIRONMENT == 'production') {
    googleConfig = {
      clientId: '264687752532-odanf2qa1m4qoas6ltn2q26a6qbc6juf.apps.googleusercontent.com', // e.g. asdfghjkljhgfdsghjk.apps.googleusercontent.com
      clientSecret: 'p7ur_JgYLWls80AcSKnRXOsR', // e.g. _ASDFA%DFASDFASDFASD#FAD-
      redirect: 'https://hackernews-clone-restful-api.herokuapp.com/api/auth/google/callback' // this must match your google api settings
    };
  }
  else {
    googleConfig = {
      clientId: '264687752532-odanf2qa1m4qoas6ltn2q26a6qbc6juf.apps.googleusercontent.com', // e.g. asdfghjkljhgfdsghjk.apps.googleusercontent.com
      clientSecret: 'p7ur_JgYLWls80AcSKnRXOsR', // e.g. _ASDFA%DFASDFASDFASD#FAD-
      redirect: 'http://localhost:8080/api/auth/google/callback' // this must match your google api settings
    };
  }

  const defaultScope = [
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  var googleutils = {
    /*************/
    /** HELPERS **/
    /*************/

    createConnection: function() {
      return new google.auth.OAuth2(
          googleConfig.clientId,
          googleConfig.clientSecret,
          googleConfig.redirect
      );
    },

    getConnectionUrl: function(auth) {
      return auth.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: defaultScope
      });
    },

    getGooglePlusApi: function(auth) {
      return google.plus({ version: 'v1', auth });
    },

    /**********/
    /** MAIN **/
    /**********/

    /**
     * Part 1: Create a Google URL and send to the client to log in the user.
     */
    urlGoogle: function() {
      const auth = this.createConnection();
      const url = this.getConnectionUrl(auth);
      return url;
    },

    /**
     * Part 2: Take the "code" parameter which Google gives us once when the user logs in, then get the user's email and id.
     */
    // getGoogleAccountFromCode: function (code) {
    //   const data = await auth.getToken(code);
    //   const tokens = data.tokens;
    //   const auth = createConnection();
    //   auth.setCredentials(tokens);
    //   const plus = getGooglePlusApi(auth);
    //   const me = await plus.people.get({userId: 'me'});
    //   const userGoogleId = me.data.id;
    //   const userGoogleEmail = me.data.emails && me.data.emails.length && me.data.emails[0].value;
    //   return {
    //     id: userGoogleId,
    //     email: userGoogleEmail,
    //     tokens: tokens,
    //   };
    // }
    getGoogleAccountFromCode: async function (code) {
      const auth = await this.createConnection();
      const data = await auth.getToken(code);
      const tokens = data.tokens;
      auth.setCredentials(tokens);
      const plus = this.getGooglePlusApi(auth);
      const me = await plus.people.get({userId: 'me'});
      const userGoogleId = me.data.id;
      const userGoogleEmail = me.data.emails && me.data.emails.length && me.data.emails[0].value;
      console.log(me.data);
      const displayName =  me.data.displayName;
      const image =  me.data.image;
      return {
        id: userGoogleId,
        email: userGoogleEmail,
        tokens: tokens,
        displayName: displayName,
        image: image
      };
    }
  };

  var CONTRIBUTIONS_COLLECTION = "contributions";
  var USERS_COLLECTION = "users";
  var COMMENTS_COLLECTION = "comments";
  var REPLIES_COLLECTION = "replies";

  var ERROR_CONTRIBUTION_OK = 0;
  var ERROR_CONTRIBUTION_MISSING_PARAMS = -1;
  var ERROR_CONTRIBUTION_URL_OR_TEXT = -2;
  var ERROR_CONTRIBUTION_URL_EXISTS = -3;

  var app = express();
  app.use(express.static(__dirname + "/public"));
  app.use(bodyParser.json());
  app.use(cookieParser());

  // Create a database variable outside of the database connection callback to reuse the connection pool in your app.
  var db;

  // Connect to the database before starting the application server. 

  // Use environment variable to get database url (doesn't work on local environment)
  //mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {

  var mongodbURI;
  if (process.env.ENVIRONMENT == 'production') {
    mongodbURI = process.env.MONGODB_URI;
  }
  else {
    mongodbURI = "mongodb://heroku_57rvbrlm:nhct4o3svduopt5nsc6dhohe5s@ds127604.mlab.com:27604/heroku_57rvbrlm";
  }
  mongodb.MongoClient.connect(mongodbURI, function (err, database) {
    if (err) {
      console.log(err);
      process.exit(1);
    }

    // Save database object from the callback for reuse.
    db = database;
    console.log("Database connection ready");

    // Initialize the app.
    var server = app.listen(process.env.PORT || 8080, function () {
      var port = server.address().port;
      console.log("App now running on port", port);
    });
  });

///////////////////////////////////////////
//
// GENERAL
//
///////////////////////////////////////////

  // Generic error handler used by all endpoints.
  function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
  }

  function isObjectId(value) {
    try {
        const { ObjectId } = mongoose.Types;
        const asString = value.toString(); // value is either ObjectId or string or anything
        const asObjectId = new ObjectId(asString);
        const asStringifiedObjectId = asObjectId.toString();
        return asString === asStringifiedObjectId;
      } catch (error) {
        return false;
      }
  }

  function isAuthTokenValid(res, token, callback) {
    console.log("Checking Auth Token "+token);
    db.collection(USERS_COLLECTION).findOne({ "tokens.access_token": token }, function(err, doc) {
      if (err) {
        handleError(res, "Unauthorized", "Failed to authenticate token", 401);
      } else {
        if (doc) {
          callback(doc._id);
        } else {
          handleError(res, "Unauthorized", "Failed to authenticate token", 401);
        }
      }
    });
  }

///////////////////////////////////////////
//
// COMMENTS
//
///////////////////////////////////////////

app.post("/api/contributions/:id/comments", function(req, res) {
  var token = req.body.access_token;
  console.log(req.body);
  if (!token) {
    handleError(res, "Bad request", "No token provided", 401);
  }
  else {
    isAuthTokenValid(res, req.body.access_token, function(userId) {
      console.log("userId "+userId);

      if (isObjectId(req.params.id)) {
        db.collection(CONTRIBUTIONS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
          if (err) {
            handleError(res, err.message, "Contribution doesn't exist", 404);
          } else {
            if (!doc) {
              handleError(res, "Not found", "Contribution doesn't exist", 404);
            } else {
              // All good
              var newComment = {};
              newComment.contributionId = req.params.id;
              newComment.createdDate = new Date();
              newComment.points = 0;
              newComment.replies = 0;

              if (!req.body.text) {
                handleError(res, "Invalid contribution input: Must provide all parameters", "Must provide all parameters.", 400);
              } else {
                newComment.text = req.body.text;
                newComment.authorId = userId;
                db.collection(COMMENTS_COLLECTION).insertOne(newComment, function(err2, doc2) {
                  if (err2) {
                    handleError(res, err2.message, "Failed to create new comment.");
                  }
                  else {
                    res.status(201).json(doc2.ops[0]);
                  }
                });
              }
            }
          }
        });
      } else {
        handleError(res, "Bad request", "Provided id is not valid", 400);
      }
    });
  }
});

///////////////////////////////////////////
//
// CONTRIBUTIONS
//
///////////////////////////////////////////

function validateContributionData(contribution, callback) {
  // Checks if the contribution has either an url or text
  if (!contribution.title || (!contribution.url && !contribution.text)) {
    callback(ERROR_CONTRIBUTION_MISSING_PARAMS);
  }
  else if (contribution.url && contribution.text) {
    callback(ERROR_CONTRIBUTION_URL_OR_TEXT);
  }
  else {
    // If it has an url, it checks if the url already exists and returns the id of the contribution containing it
    if (contribution.url) {
      db.collection(CONTRIBUTIONS_COLLECTION).findOne({ url: contribution.url }, function(err, contributionFound) { 
        if (contributionFound) {
          callback(ERROR_CONTRIBUTION_URL_EXISTS);
        }
        else {
          callback(ERROR_CONTRIBUTION_OK);
        }
      });
    }
    else {
      callback(ERROR_CONTRIBUTION_OK);
    } 
  }
}

/*  "/contributions"
 *    GET: finds all contributions
 *    POST: creates a new contribution
 */

app.get("/api/contributions", function(req, res) {
  db.collection(CONTRIBUTIONS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contributions.");
    } else {
      res.status(200).json(docs);  
    }
  });
});

app.post("/api/contributions", function(req, res) {
  var token = req.body.access_token;
  console.log(req.body);
  if (!token) {
    handleError(res, "Bad request", "No token provided", 401);
  }
  else {
    isAuthTokenValid(res, req.body.access_token, function(userId) {
      console.log("userId "+userId);

      // All good
      var newContribution = {};
      newContribution.createdDate = new Date();
      newContribution.points = 0;
      newContribution.comments = 0;

      validateContributionData(req.body, function(response) {
        if (response == ERROR_CONTRIBUTION_MISSING_PARAMS) {
          handleError(res, "Invalid contribution input: Must provide all parameters", "Must provide all parameters.", 400);
        }
        else if (response == ERROR_CONTRIBUTION_URL_OR_TEXT) {
          handleError(res, "Invalid contribution input: You can only provide a text or url", "You can only provide a text or url", 400);
        }
        else if (response == ERROR_CONTRIBUTION_URL_EXISTS) {
          db.collection(CONTRIBUTIONS_COLLECTION).findOne({ url: req.body.url }, function(err2, doc2) {
            if (err2) {
              handleError(res, err2.message, "Error checking if a contribution with same url exists");
            } else {
              var errorResponse = {};
              errorResponse.error = "A contribution with this url already exists";
              errorResponse.contributionId = doc2._id;
              //res.status(302).json(errorResponse);
              // Redirect to base url
              //var newPath = req.originalUrl.split('api')[0];
              var newPath = 'http://'+req.headers.host+'/#/contribution/'+doc2._id;
              console.log(newPath);
              errorResponse.redirectUrl = newPath;
              res.status(302).json(errorResponse);
              //res.redirect(301, newPath);
            }
          });
        }
        else if (response == ERROR_CONTRIBUTION_OK) {
          newContribution.title = req.body.title;
          if (req.body.url) {
            newContribution.url = req.body.url;
          }
          else {
            // if (req.body.title.slice(-1) == "?") {
            //   newContribution.title = "Ask HN: "+req.body.title;
            // }
            newContribution.text = req.body.text;
          }
          newContribution.authorId = userId;
          db.collection(CONTRIBUTIONS_COLLECTION).insertOne(newContribution, function(err, doc) {
            if (err) {
              handleError(res, err.message, "Failed to create new contribution.");
            }
            else {
              res.status(201).json(doc.ops[0]);
            }
          });
        }
      });
    });
  }
});

/*  "/contributions/ask"
 *    GET: find all contributions of type ask
 */
app.get("/api/contributions/ask", function(req, res) {
  db.collection(CONTRIBUTIONS_COLLECTION).find({ title: { $regex: "\\?$" } }).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contributions.");
    } else {
      res.status(200).json(docs);  
    }
  });
});

/*  "/contributions/new"
 *    GET: find all contributions ordered by date
 */
app.get("/api/contributions/new", function(req, res) {
  db.collection(CONTRIBUTIONS_COLLECTION).find({}, {"sort" : [['createdDate', 'desc']]}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contributions.");
    } else {
      res.status(200).json(docs);  
    }
  });
});

/*  "/contributions/threads"
 *    GET: find all comments of the logged in user
 */
// app.get("/api/contributions/threads", function(req, res) {
//   db.collection(CONTRIBUTIONS_COLLECTION).find({ text: { $exists: true } }).toArray(function(err, docs) {
//     if (err) {
//       handleError(res, err.message, "Failed to get contributions.");
//     } else {
//       res.status(200).json(docs);  
//     }
//   });
// });

/*  "/contributions/:id"
 *    GET: find contribution by id
 *    PUT: update contribution by id
 *    DELETE: deletes contribution by id
 */

app.get("/api/contributions/:id", function(req, res) {
  if (isObjectId(req.params.id)) {
    db.collection(CONTRIBUTIONS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
        if (err) {
          handleError(res, "Contribution doesn't exist", "Contribution not found", 404);
        } else {
          if (doc) {
            db.collection(USERS_COLLECTION).findOne({ _id: new ObjectID(doc.authorId) }, function(err2, doc2) {
              if (err2) {
                handleError(res, "Failed to get contribution's author", "Contribution not found");
              } else {
                if (doc2) {
                  doc.authorName = doc2.displayName;
                  res.status(200).json(doc);
                } else {
                  handleError(res, "Contribution's author doesn't exist anymore", "Contribution's author doesn't exist anymore", 500);
                }
              }
            });
          } else {
            handleError(res, "Contribution doesn't exist", "Contribution not found", 404);
          }
        }
      });
  } else {
    handleError(res, "Bad request", "Provided id is not valid", 400);
  }
});

app.put("/api/contributions/:id", function(req, res) {
  if (!req.body.access_token) {
    handleError(res, "Unauthorized", "Authentication token was not provided", 401);
  } else {
    isAuthTokenValid(res, req.body.access_token, function(userId) {
      console.log("userId "+userId);
      if (isObjectId(userId)) {
        db.collection(CONTRIBUTIONS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
          if (err) {
            handleError(res, err.message, "Contribution doesn't exist", 404);
          } else {
            if (!doc) {
              handleError(res, "Not found", "Contribution doesn't exist", 404);
            } else {
              if (doc.authorId.toString() != userId) {
                handleError(res, "Unauthorized", "This contribution doesn't belong to you", 401);
              } else {
                validateContributionData(req.body, function(response) {
                  if (response == ERROR_CONTRIBUTION_MISSING_PARAMS) {
                    handleError(res, "Invalid contribution input: Must provide all parameters", "Must provide all parameters.", 400);
                  }
                  else if (response == ERROR_CONTRIBUTION_URL_OR_TEXT) {
                    handleError(res, "Invalid contribution input: You can only provide a text or url", "You can only provide a text or url", 400);
                  }
                  else if (response == ERROR_CONTRIBUTION_URL_EXISTS) {
                    db.collection(CONTRIBUTIONS_COLLECTION).findOne({ url: req.body.url }, function(err2, doc2) {
                      if (err2) {
                        handleError(res, err.message, "Error finding the already existing url contribution");
                      } else {
                        var errorResponse = {};
                        errorResponse.error = "A contribution with this url already exists";
                        errorResponse.contributionId = doc2._id;
                        res.status(302).json(errorResponse);
                      }
                    });
                  }
                  else if (response == ERROR_CONTRIBUTION_OK) {
                    var updatedDoc = doc;
                    delete updatedDoc.text;
                    delete updatedDoc.url;
                    updatedDoc.modificationDate = new Date();
                    if (req.body.text) {
                      updatedDoc.text = req.body.text;
                    } else {
                      updatedDoc.url = req.body.url;
                    }

                    db.collection(CONTRIBUTIONS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updatedDoc, function(err3, doc3) {
                      if (err3) {
                        handleError(res, err3.message, "Failed to update contribution");
                      } else {
                        res.status(204).end();
                      }
                    }); 
                  }
                });
              }
            }
          }
        });
      } else {
        handleError(res, "Bad request", "Provided id is not valid", 400);
      }
    });
  }
});

app.delete("/api/contributions/:id", function(req, res) {
  var token = req.body.access_token;
  console.log(req.body);
  if (!token) {
    handleError(res, "Bad request", "No token provided", 401);
  }
  else {
    isAuthTokenValid(res, req.body.access_token, function(userId) {
      console.log("userId "+userId);

      if (isObjectId(req.params.id)) {
        db.collection(CONTRIBUTIONS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
          console.log(result);
          if (err) {
            handleError(res, err.message, "Failed to delete contribution");
          } else {
            if (result.deletedCount == 0) {
              handleError(res, "Not found", "Contribution not found", 404);
            } else {
              res.status(204).end();
            }
          }
        });
      } else {
        handleError(res, "Bad request", "Provided id is not valid", 400);
      }
    });
  }  
});

///////////////////////////////////////////
//
// USERS
//
///////////////////////////////////////////

  // Gets the url to login with Google
  app.get("/api/users/login-url", function(req, res) {
    var json = {};
    json.url = googleutils.urlGoogle();
    res.status(200).json(json);
  });

  // Google login callback
  // It creates or updates an user account and saves the token in the cookies
  app.get("/api/auth/google/callback", function (req, res) {
    googleutils.getGoogleAccountFromCode(req.query.code).then(function (response) {
      //res.cookie('access_token', response.tokens.access_token, {maxAge: 24 * 60 * 60 * 1000, httpOnly: true});
      res.cookie('access_token', response.tokens.access_token, {maxAge: 24 * 60 * 60 * 1000, httpOnly: false});
      res.cookie('user_display_name', response.displayName, {maxAge: 24 * 60 * 60 * 1000, httpOnly: false});
      res.cookie('user_image', response.image.url, {maxAge: 24 * 60 * 60 * 1000, httpOnly: false});
      // Check if user already exists
      console.log("User object from Google");
      console.log(response);
      db.collection(USERS_COLLECTION).findOne({ email: response.email }, function(err, userFound) {
        if (userFound) {
          let updatedUser = userFound;
          delete updatedUser.tokens;
          updatedUser.tokens = response.tokens;
          delete updatedUser.image;
          updatedUser.image = response.image;

          console.log("User object updated");
          console.log(updatedUser);
          db.collection(USERS_COLLECTION).updateOne({email: response.email}, updatedUser, function(err3, doc3) {
            if (err3) {
              handleError(res, err3.message, "Failed to update user");
            } else {
              //res.status(201).json(response);

              // Redirect to base url
              var newPath = req.originalUrl.split('api')[0];
              res.redirect(newPath);
            }
          });
          //res.status(200).end();
        }
        else {
          let insertUser = response;
          insertUser.about = "";
          insertUser.points = "";
          insertUser.createdDate = new Date();

          console.log("User object new");
          console.log(insertUser);
          db.collection(USERS_COLLECTION).insertOne(insertUser, function(err, doc) {
            if (err) {
              handleError(res, err.message, "Failed to create new user.");
            }
            else {
              //res.status(201).json(doc.ops[0]);

              // Redirect to base url
              var newPath = req.originalUrl.split('api')[0];
              res.redirect(newPath);
            }
          });
        }
      });
        // Then update his token or whatever

        // Else create user

      //console.log(response);
      //res.status(200).json(response);
    }).catch(console.error);
  });

  // Get user info
  app.get("/api/users/:id", function(req, res) {
    if (isObjectId(req.params.id)) {
      db.collection(USERS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
        if (err) {
          handleError(res, err.message, "Failed to get user", 404);
        } else {
          if (doc) {
            let response = {};
            response.id = req.params.id;
            response.displayName = doc.displayName;
            response.about = doc.about;
            response.createdDate = doc.createdDate;
            response.points = doc.points;
            res.status(200).json(response);
          } else {
            handleError(res, "Not found", "Failed to get user", 404);
          }
        }
      });
    } else {
      handleError(res, "Bad request", "Provided id is not valid", 400);
    }
  });

  app.put("/api/users", function(req, res) {
    if (!req.body.access_token) {
      handleError(res, "Unauthorized", "Authentication token was not provided", 401);
    } else {
      isAuthTokenValid(res, req.body.access_token, function(userId) {
        console.log("userId "+userId);
        if (isObjectId(userId)) {
          db.collection(USERS_COLLECTION).findOne({ _id: new ObjectID(userId) }, function(err, doc) {
            if (err) {
              handleError(res, err.message, "User doesn't exist", 404);
            } else {
              if (!doc) {
                handleError(res, "Not found", "User doesn't exist", 404);
              } else {
                console.log("userId from token "+userId);
                if (userId == userId) {
                  if (!req.body.about) {
                    handleError(res, "Invalid user input: Must provide all parameters", "Must provide all parameters.", 400);
                  } else {
                    var userObject = doc;
                    delete doc.about;
                    userObject.about = req.body.about;

                    db.collection(USERS_COLLECTION).updateOne({_id: new ObjectID(userId)}, userObject, function(err2, doc2) {
                      if (err2) {
                        handleError(res, err2.message, "Failed to update user");
                      } else {
                        res.status(204).end();
                      }
                    });
                  }
                } else {
                  handleError(res, "Unauthorized", "Authentication token doesn't correspond to user", 401);
                }      
              }
            }
          });
        } else {
          handleError(res, "Bad request", "Provided id is not valid", 400);
        }
      });
    }
  });
