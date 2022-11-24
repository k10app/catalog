require('dotenv').config()



const fs = require('fs');
const express = require('express');
const jwt = require('jsonwebtoken');


var port = process.env.SERVER_PORT || 80;



var publicKey = fs.readFileSync(process.env.PUBLIC_KEY,"utf8")
var routePrefix = process.env.ROUTE_PREFIX || '/catalog' 



function startServer() {
    var app = express();

    app.use(express.json());

    app.get("/", async (req, res) => {
        res.status(404).send("unrecognized route")
    });
    app.get(routePrefix+'/list',  async (req, res) => {
        res.send({
            "id":1,
            "name":"sticker",
            "description":"it's a Kasten sticker",
            "price":3,
            "imgurl":"https://www.kasten.io/hubfs/Kasten%20logos/logo-kasten.io.svg",
            "stock":100
        })
    })
    app.get(routePrefix+'/list/:catalogId([0-9]+)',  async (req, res) => {
        res.send({
            "id":req.params.catalogId,
            "name":"sticker",
            "description":"it's a Kasten sticker",
            "price":3,
            "imgurl":"https://www.kasten.io/hubfs/Kasten%20logos/logo-kasten.io.svg",
            "stock":100
        })
    })

    app.post(routePrefix+"/update", async (req, res) => {
        res.send({
            "status":"success"
        })
    })
    
    app.listen(port, () => {
     console.log("Server running on port "+port);
    });   
    
}


console.log("Starting fake catalog svc")

startServer()


