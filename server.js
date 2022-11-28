require("dotenv").config();

const fs = require("fs");
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

var port = process.env.SERVER_PORT || 3001;

// removed for local testing, uncomment before building Docker image.
// var publicKey = fs.readFileSync(process.env.PUBLIC_KEY, "utf8");
var routePrefix = process.env.ROUTE_PREFIX || "/catalog";

const catalog = [
  {
    name: "sticker",
    description: "it's a Kasten sticker",
    price: 3,
    imgurl: "https://www.kasten.io/hubfs/Kasten%20logos/logo-kasten.io.svg",
    stock: 100,
  },
  {
    name: "mug",
    description: "it's a Kasten mug",
    price: 3,
    imgurl: "https://www.kasten.io/hubfs/Kasten%20logos/logo-kasten.io.svg",
    stock: 100,
  },
];

const clientData = {
  host: process.env.MONGODB_HOST || "localhost",
  port: process.env.MONGODB_PORT || 27017,
  user: process.env.MONGODB_USER || "mongoadmin",
  password: process.env.MONGODB_PASSWORD || "secret",
  database: process.env.MONGODB_DATABASE || "catalog",
};
//"/"+clientData.database
const connectionString =
  "mongodb://" +
  clientData.user +
  ":" +
  clientData.password +
  "@" +
  clientData.host +
  ":" +
  clientData.port +
  "?maxPoolSize=20&retryWrites=true&w=majority";

const mongoClient = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

function startServer() {
  var app = express();

  app.use(express.json());
  app.use(cors());

  app.get("/", async (req, res) => {
    res.status(404).send("unrecognized route");
  });
  app.get(routePrefix + "/list", async (req, res) => {
    db.collection("catalog")
      .find()
      .toArray()
      .then(
        (queryResult) => {
          res.send(queryResult);
        },
        (err) => {
          res.status(404).send("");
        }
      );
  });
  app.get(
    routePrefix + "/list/:catalogId([0-9a-zA-Z]{24})",
    async (req, res) => {
      var queryId = req.params.catalogId;
      try {
        var oid = ObjectId(queryId);
        db.collection("catalog")
          .findOne(oid)
          .then(
            (queryResult) => {
              if (queryResult) {
                res.send(queryResult);
              } else {
                res.status(404).send("Invalid ID");
              }
            },
            (err) => {
              res.status(404).send("");
            }
          );
      } catch {
        res.status(404).send("");
      }
    }
  );

  app.post(routePrefix + "/add", async (req, res) => {
    db.collection("catalog")
      .insertOne(req.body)
      .then(
        (queryResult) => {
          res.send(queryResult);
        },
        (err) => {
          res.status(404).send("");
        }
      );
  });

  app.put(routePrefix + "/update", async (req, res) => {
    const queryId = req.body._id;
    const newStock = req.body.stock;
    const myQuery = { _id: new ObjectId(queryId) };
    const newValues = { $set: { stock: newStock } };
    db.collection("catalog")
      .updateOne(myQuery, newValues)
      .then(
        (queryResult) => {
          res.send(queryResult);
        },
        (err) => {
          res.status(404).send(err);
        }
      );
  });

  app.listen(port, () => {
    console.log("Server running on port " + port);
  });
}

console.log("Starting fake catalog svc");

async function run() {
  try {
    await mongoClient.connect();

    db = mongoClient.db(clientData.database);
    console.log("Connected successfully to server");

    //some init code for if there is nothing
    //today inserts catalog defined at beginning of file but might be swtich to configmap
    db.collection("catalog")
      .countDocuments()
      .then(
        (res) => {
          if (res == 0) {
            console.log("Database is empty, init");
            db.collection("catalog")
              .insertMany(catalog)
              .then(
                (res) => {
                  console.log("ASYNC DB init successful");
                },
                (err) => {
                  console.log("ASYNC Some err, initing, ignoring async call");
                }
              );
          } else {
            console.log(
              "ASYNC DB not empty, already inited, have to do nothing"
            );
          }
          startServer();
        },
        (err) => {
          console.log("Some error in db query, not starting server", err);
        }
      );
  } catch (err) {
    console.log(err);
  }
}
run().catch(console.dir);
