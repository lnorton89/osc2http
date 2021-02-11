import path from "path";
import express from "express";
import bodyParser from "body-parser";
import { Server } from "node-osc";
import { appConfig } from "./config.js";
import { Database } from "./data.js";
import fetch from "node-fetch";

var db = new Database();

var oscServer = new Server(appConfig.config.port, "0.0.0.0", () => {
  console.log("OSC Server is listening on port: ", appConfig.config.port);
});

oscServer.on("message", function (msg) {
  // Check if we're supposed to be listening for OSC!
  db.get("config", function (err, result) {
    if (err) {
      console.log(err);
    } else {
      if (result.enabled) {
        console.log(`Incoming Message: ${msg}`);
        db.get("endpoints", function (err, result) {
          // Remove items that aren't enabled
          result = result.filter(function (obj) {
            return obj.enabled !== false;
          });

          // Get index of item that matches the incoming OSC message
          var index = result.findIndex((p) => p.osc == msg);

          // Only move forward if an item in the array matches
          if (index > -1) {
            let item = result[index];

            fetch(`http://${item.ip}/json/state`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ps: item.preset,
              }),
            }).then(
              (res) => {
                console.log("Command sent! Response:", res.statusText);
              },
              (err) => {
                console.log("Error POST'ing API: ", err);
              }
            );
          }
        });
      }
    }
  });
});

const app = express(),
  DIST_DIR = __dirname,
  HTML_FILE = path.join(DIST_DIR, "index.html"),
  router = express.Router();

app.use(express.static(DIST_DIR));

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(bodyParser.json());

// Front end default route
app.get("/", (req, res, next) => {
  compiler.outputFileSystem.readFile(HTML_FILE, (err, result) => {
    if (err) {
      return next(err);
    }
    res.set("content-type", "text/html");
    res.send(result);
    res.end();
  });
});

// Get endpoint by ID
router.get("/endpoint/:endpoint_id", (req, res) => {
  db.get("endpoints", function (err, result) {
    if (err) {
      console.log(err);
    } else {
      res.set("content-type", "application/json");
      res.send(result.filter((ele) => ele.id == req.params.endpoint_id));
      res.end();
    }
  });
});

// Get status of config
router.get("/status", (req, res) => {
  db.get("config", function (err, result) {
    if (err) {
      console.log(err);
    } else {
      res.set("content-type", "application/json");
      res.send(result);
      res.end();
    }
  });
});

// Get all endpoints
router.get("/endpoints", (req, res) => {
  db.get("endpoints", function (err, result) {
    let response;
    if (err) {
      response = err;
    } else {
      response = result;
    }
    res.set("content-type", "application/json");
    res.send(response);
    res.end();
  });
});

// Update config status
router.post("/status/update", (req, res) => {
  db.add("config", req.body);
  let response = "Config updated!";
  res.set("content-type", "application/json");
  res.send({ response });
  res.end();
});

// Update all endpoints
router.post("/endpoints/update", (req, res) => {
  db.add("endpoints", req.body);
  let response = "Endpoints updated!";

  res.set("content-type", "application/json");
  res.send({ response });
  res.end();
});

// Add new endpoint and generate ID after previous
router.post("/endpoints/add", (req, res) => {
  db.get("endpoints", function (err, result) {
    if (err) {
      console.log(err);
    } else {
      // probably need some validation here
      let response;
      var index = result.findIndex((p) => p.osc == req.body.osc);

      if (index > -1) response = "Error";
      else {
        result.sort(function (a, b) {
          if (a.id < b.id) return -1;
          return 0;
        });

        response = {
          id: result[result.length - 1].id + 1,
          ...req.body,
        };
        result.push(response);
        db.add("endpoints", result);
      }
      res.set("content-type", "application/json");
      res.send({ response });
      res.end();
    }
  });
});

// Delete endpoint by ID
router.post("/endpoints/delete/:endpoint_id", (req, res) => {
  db.get("endpoints", function (err, result) {
    if (err) {
      console.log(err);
    } else {
      let response;
      var index = result.findIndex((p) => p.id == req.params.endpoint_id);

      if (index < 0) response = "Error";
      else {
        result.splice(index, 1);
        response = "Deleted";
        db.add("endpoints", result);
      }
      res.set("content-type", "application/json");
      res.send({ response });
      res.end();
    }
  });
});

app.use("/api", router);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`App listening to ${PORT}....`);
  console.log("Press Ctrl+C to quit.");
});
