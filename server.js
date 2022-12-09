require("dotenv").config();

const fs = require("fs");
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient,ObjectId } = require('mongodb');
const { json } = require("express");
const hackSVG = require("./hackSVG.js");

var port = process.env.SERVER_PORT || 80;

//public key not required since catalog is public

var routePrefix = process.env.ROUTE_PREFIX || "/catalog";


//deep cloned forever ok message ;)
function ok(res,message="") {
  return res.status(200).send(JSON.parse(`{"status":"ok","message":"`+message+`"}`))
}
function nok(res,message="",preMessage="internal error") {
  var txt = JSON.parse(`{"status":"error","message":"`+preMessage+((message=="")?"":": "+message)+`"}`);
  res.status(500).send(txt);
}
var initCatalog = [
  {
    name: "sticker",
    description: "it's a Kasten sticker",
    price: 3,
    imgurl: "/static/static-sticker-export-plain.svg",
    stock: 100,
  },
  {
    name: "mug",
    description: "it's a Kasten mug",
    price: 3,
    imgurl: "/static/static-mug-export-plain.svg",
    stock: 100,
  },
];


try {
  let tryCatalog = JSON.parse(fs.readFileSync(process.env.CATALOG_INIT_FILE || "/catalog/init/catalog.json" ))
  initCatalog = tryCatalog
} catch(error) {
  console.log("Couldn't find init file, proceeding with built in :",error)
}



const clientData = {
  "host": process.env.MONGODB_HOST || 'localhost' ,
  "port": process.env.MONGODB_PORT || 27017,
  "user": process.env.MONGODB_USER || 'mongoadmin',
  "password": process.env.MONGODB_PASSWORD || 'secret',
  "database": process.env.MONGODB_DATABASE|| 'catalog',
};
//"/"+clientData.database
const connectionString = "mongodb://"+clientData.user+":"+clientData.password+"@"+clientData.host+":"+clientData.port+"?maxPoolSize=20&retryWrites=true&w=majority"

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
    db.collection("catalog").find().toArray().then(
      (queryResult) => { res.send(queryResult) },
      (err) => { 
        console.log("can not list",err)
        nok(res)
      }
    )
  });
  app.get(routePrefix + "/list/:catalogId([0-9a-zA-Z]{24})", async (req, res) => {
    var queryId= req.params.catalogId
    try {
      var oid = ObjectId(queryId)
      db.collection("catalog").findOne(oid).then(
        (queryResult) => { 
          if (queryResult) {
            res.send(queryResult) 
          }  else {
            nok(res,"Invalid ID")
          }
        },
        (err) => { 
          console.log("could not query db ",err)
          nok(res)
        }
      )
    } catch {
      console.log("something went wrong pre or in query of specific item",log)
      nok(res)
    }
  });

  app.get(routePrefix+"/admin",async(req,res) => {
    var answer = []

    var col = 150

    db.collection("catalog").find().toArray().then(
      (queryResult) => { 
        
        answer.push("<html><head><title>Insecure Admin Page</title><style>body {font-family:arial; color: #333333;} #h3alert { color: #ee3333; }</style></head><body><div>"+hackSVG.hackSVG()+"</div><h3 id='h3alert'></h3><table>")
        answer.push("<script> function route(n) { return '"+routePrefix+"'+'/'+n}")
        answer.push("function txtById(id) { return document.getElementById('txt'+id).value }")
        answer.push("function h3alert(a) {document.getElementById('h3alert').innerHTML = ((new Date())+' '+a)}")
        answer.push("function hideById(id) { ['tr','trd'].forEach(el=>{document.getElementById(el+id).innerHTML = ''})}")
        answer.push("function deleteItem(id) { fetch(route('delete/'+id),{'method':'delete'}).then((res)=> { if (res.ok) { h3alert('You just committed a crime!');hideById(id)} else {h3alert('Failed to commit crime ',err)}}).catch((err)=>{h3alert('Failed to commit crime ',err)}) }")
        answer.push("function modifyItem(id) { fetch(route('update/'+id),{headers: {'Content-Type': 'application/json'},'body':txtById(id),'method':'post'}).then((res)=> { if (res.ok) { h3alert('You just committed a crime!')} else {h3alert('Failed to commit crime ',err)}}).catch((err)=>{h3alert('Failed to commit crime ',err)}) }")
        answer.push("function addItem() {var p = JSON.parse(txtById('add')); var arr=(Array.isArray(p))?p:[p];var promises=[];arr.forEach(el=>{promises += fetch(route('add'),{headers: {'Content-Type': 'application/json'},'body':JSON.stringify(el),'method':'post'}); Promise.all(promises).then((res)=>{location.reload()})}) }")
        answer.push("</script>")
        queryResult.forEach(ci => {
          var cid = ""+ci._id
          delete ci._id
          answer.push("<tr id='tr"+cid+"'>")
          answer.push("<td><a href='#' onclick='deleteItem(\""+cid+"\");return false'>DEL</a> | <a href='#' onclick='modifyItem(\""+cid+"\");return false'>UPD</a></td>")
          answer.push("<td>"+cid+"</td>")
          answer.push("<td>"+ci.name+"</td>")
          answer.push("</tr><tr id='trd"+cid+"'>")
          answer.push("<td colspan=\"3\"><textarea id='txt"+cid+"' cols='"+col+"' rows='10'>"+JSON.stringify(ci, null, 2)+"</textarea></td>")
          answer.push("</tr>")
        })
        answer.push("<tr >")
        answer.push("<td colspan=\"3\"><a href='#' onclick='addItem();return false'>ADD</a></td></tr><tr>")
        answer.push("<td colspan=\"3\"><textarea id='txtadd' cols='"+col+"' rows='30'>"+JSON.stringify([{
          "name":"mug","description":"","price":10,"imgurl":"/static/logokastenio.svg","stock":1000
        },], null, 2)+"</textarea></td>")
        answer.push("</tr>")     

        answer.push("</table></head></html>")
        res.send(answer.join("\n"))
      },
      (err) => { 
        console.log("can not list",err)
        nok(res)
      }
    )
    

    
  })
  app.delete(routePrefix + "/delete/:catalogId([0-9a-zA-Z]{24})", async (req, res) => {
    db.collection("catalog").findOneAndDelete({ _id:ObjectId(req.params.catalogId)}).then(
      (queryResult) => { ok(res,"") },
      (err) => { 
        console.log("Could delete",err)
        nok(res,"Could not delete")
      }
    )
  });

  app.post(routePrefix + "/add", async(req,res) => {
    if (req.body.price && req.body.name) {
      var newItem = {
        name: req.body.name,
        description: req.body.description || req.body.name,
        imgurl: req.body.imgurl || process.env.CATALOG_NOLOGOFOUND,
        price: parseFloat(req.body.price),
        stock: parseInt(req.body.stock?req.body.stock:0)
      }

      db.collection("catalog").insertOne(newItem).then(
        (queryResult) => { res.send({"_id":queryResult.insertedId,"status":"ok"}) },
        (err) => { 
          console.log("Could not add",err)
          nok(res,"Not able to add")
        }
      )
    } else {
      nok(res,"Need at least name and price in JSON object")
    }
    
  })

  app.post(routePrefix + "/update/:catalogId([0-9a-zA-Z]{24})", async (req, res) => {
    var id = req.params.catalogId
    var replace = req.body
    delete replace._id

    console.log("mod",id,replace)
    db.collection("catalog").findOneAndReplace({ _id:ObjectId(id)},replace).then(
      (queryResult) => { ok(res,"") },
      (err) => { 
        console.log("Could update",err)
        nok(res,"Could not update")
      }
    )
  });
  app.post(routePrefix+"/bulkStockUpdate",async(req,res) => {
    //console.log(req.body)
    if (req.body.updates && req.body.updates.length &&  req.body.updates.length > 0) {
      //https://mongodb.github.io/node-mongodb-native/4.12/classes/UnorderedBulkOperation.html#execute
      var bulk = db.collection("catalog").initializeUnorderedBulkOp()
      req.body.updates.forEach(singleUpdate => {
        if (singleUpdate._id && singleUpdate.inc) {
          console.log("stock update via bulk ",singleUpdate._id,singleUpdate.inc)
          bulk.find({ _id:ObjectId(singleUpdate._id)}).updateOne({$inc : {"stock":singleUpdate.inc} })
        }
      });
      bulk.execute().then(
        (exec) => {
          ok(res,"Bulk update successful")
        },
        (err) => { 
          console.log("Bulk update failure",err)
          nok(res,"Update failure")
        }
      )
    } else {
      res.status(403).send("invalid request, missing updates")
    }
  })

  app.listen(port, () => {
    console.log("Server running on port " + port);
  });
}

console.log("Starting WeHaveItAll! Catalog Service");

async function run() {
  try {
    await mongoClient.connect();
  
    db = mongoClient.db(clientData.database);
    console.log("Connected successfully to server");

   
    //some init code for if there is nothing
    //today inserts catalog defined at beginning of file but might be swtich to configmap
    db.collection("catalog").countDocuments().then(
      (res) => { 
          if (res == 0) {
              console.log("Database is empty, init")
              console.log(initCatalog)
              db.collection("catalog").insertMany(initCatalog).then(
                  (res) => {
                    console.log("ASYNC DB init successful")
                  },
                  (err) => {
                    console.log("ASYNC Some err, initing, ignoring async call")
                  }
              )
          } else {
              console.log("ASYNC DB not empty, already inited, have to do nothing")
          }
          startServer()
       },
      (err) => { console.log("Some errors in db query, not starting server",err)}
    )

    

  } catch(err) {
      console.log(err)
  } 
}
run().catch(console.dir);
