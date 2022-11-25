require("dotenv").config();

const fs = require("fs");
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");

var port = process.env.SERVER_PORT || 3001;

// removed for local testing, uncomment before building Docker image.
// var publicKey = fs.readFileSync(process.env.PUBLIC_KEY, "utf8");
var routePrefix = process.env.ROUTE_PREFIX || "/catalog";

const catalog = [
  {
    id: 1,
    name: "sticker",
    description: "it's a Kasten sticker",
    price: 3,
    imgurl: "https://www.kasten.io/hubfs/Kasten%20logos/logo-kasten.io.svg",
    stock: 100,
  },
];

let index = 1;

function startServer() {
  var app = express();

  app.use(express.json());
  app.use(cors());

  app.get("/", async (req, res) => {
    res.status(404).send("unrecognized route");
  });
  app.get(routePrefix + "/list", async (req, res) => {
    res.send(catalog);
  });
  app.get(routePrefix + "/list/:catalogId([0-9]+)", async (req, res) => {
    const itemSelect = req.params.catalogId;

    res.send(catalog[itemSelect]);
  });

  app.post(routePrefix + "/update", async (req, res) => {
    index += 1;
    req.body.id = index;
    catalog.push(req.body);
    res.send({
      status: "success",
    });
  });

  app.listen(port, () => {
    console.log("Server running on port " + port);
  });
}

console.log("Starting fake catalog svc");

startServer();
