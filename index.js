const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const sqlDbFactory = require("knex");
const process = require("process");
const base64 = require("base-64");

let sqlDb = sqlDbFactory({
  debug: true,
  client: "pg",
  connection: "postgresql://localhost:5432/zaccaria",
  ssl: true
});

function initDb() {
  return sqlDb.schema.hasTable("blobs").then(exists => {
    if (!exists) {
      console.log("Table does not exist");
      return sqlDb.schema.createTable("blobs", table => {
        table.increments();
        table.binary("data");
        table.string("description");
      });
    } else {
      return true;
    }
  });
}

let serverPort = process.env.PORT || 5000;

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// /* Register REST entry point */
app.get("/blobs/:id", function(req, res) {
  let idn = parseInt(req.params.id);
  sqlDb("blobs")
    .where("id", idn)
    .then(result => {
      result.data = base64.encode(result.data);
      res.send(JSON.stringify(result));
    });
});

app.delete("/blobs/:id", function(req, res) {
  let idn = parseInt(req.params.id);
  sqlDb("blobs")
    .where("id", idn)
    .del()
    .then(() => {
      res.status(200);
      res.send({ message: "ok" });
    });
});

app.post("/blobs", function(req, res) {
  let toappend = {
    description: req.body.description,
    data: req.body.data
  };
  sqlDb("blobs")
    .insert(toappend)
    .then(ids => {
      let id = ids[0];
      res.send({ id, description: toappend.description });
    });
});

app.set("port", serverPort);

initDb().then(() => {
  app.listen(serverPort, function() {
    console.log(`Your app is ready at port ${serverPort}`);
  });
});
