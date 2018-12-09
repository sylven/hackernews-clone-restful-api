var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var CONTRIBUTIONS_COLLECTION = "contributions";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server. 
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
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

// CONTACTS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/contributions"
 *    GET: finds all contributions
 *    POST: creates a new contribution
 */

app.get("/contributions", function(req, res) {
  db.collection(CONTRIBUTIONS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contributions.");
    } else {
      res.status(200).json(docs);  
    }
  });
});

app.post("/contributions", function(req, res) {
  var newContribution = {};
  newContribution.createDate = new Date();

  if (!req.body.title || !(req.body.text || req.body.url)) {
    handleError(res, "Invalid contribution input", "Must provide all parameters.", 400);
  }
  else if (req.body.text && req.body.url) {
    handleError(res, "Invalid contribution input", "You can only provide a text or url", 400);
  }
  else {
    newContribution.title = req.body.title;
    if (req.body.url) {
      newContribution.url = req.body.url;
      db.collection(CONTRIBUTIONS_COLLECTION).findOne({ url: req.body.url }, function(err, contribution) { 
        if (contribution) {
          handleError(res, "Contribution already exists", "This url has already been submited", 400);
        }
        else {
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
    }
    else {
      // if (req.body.title.slice(-1) == "?") {
      //   newContribution.title = "Ask HN: "+req.body.title;
      // }
      newContribution.text = req.body.text;
      db.collection(CONTRIBUTIONS_COLLECTION).insertOne(newContribution, function(err, doc) {
        if (err) {
          handleError(res, err.message, "Failed to create new contribution.");
        }
        else {
          res.status(201).json(doc.ops[0]);
        }
      });
    }
    
  }
  
});

/*  "/contributions/new"
 *    GET: find all contributions ordered by date
 */
app.get("/contributions/new", function(req, res) {
  db.collection(CONTRIBUTIONS_COLLECTION).find({}, {"sort" : [['createDate', 'desc']]}).toArray(function(err, docs) {
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
// app.get("/contributions/threads", function(req, res) {
//   db.collection(CONTRIBUTIONS_COLLECTION).find({ text: { $exists: true } }).toArray(function(err, docs) {
//     if (err) {
//       handleError(res, err.message, "Failed to get contributions.");
//     } else {
//       res.status(200).json(docs);  
//     }
//   });
// });

/*  "/contributions/ask"
 *    GET: find all contributions of type ask
 */
app.get("/contributions/ask", function(req, res) {
  db.collection(CONTRIBUTIONS_COLLECTION).find({ title: { $regex: "\\?$" } }).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contributions.");
    } else {
      res.status(200).json(docs);  
    }
  });
});

/*  "/contributions/:id"
 *    GET: find contribution by id
 *    PUT: update contribution by id
 *    DELETE: deletes contribution by id
 */

app.get("/contributions/:id", function(req, res) {
  db.collection(CONTRIBUTIONS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get contribution");
    } else {
      res.status(200).json(doc);  
    }
  });
});

app.put("/contributions/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(CONTRIBUTIONS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update contribution");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/contributions/:id", function(req, res) {
  db.collection(CONTRIBUTIONS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete contribution");
    } else {
      res.status(204).end();
    }
  });
});
