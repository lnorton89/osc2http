import webpack from "webpack";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackHotMiddleware from "webpack-hot-middleware";
import config from "../../webpack.dev.config.js";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
import { Server } from "node-osc";
import { appConfig } from "./config.js";
import { Database } from "./data.js";
import fetch from "node-fetch";

var db = new Database();

var oscServer = new Server(Number(appConfig.config.port), "0.0.0.0", () => {
  console.log(
    "OSC Server is listening on port: ",
    Number(appConfig.config.port)
  );
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
  router = express.Router(),
  compiler = webpack(config);

app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
  })
);
app.use(webpackHotMiddleware(compiler));

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
  console.log("status update: ", req.body);
  let currentConfig;
  db.get("config", function (err, result) {
    if (err) {
      console.log(err);
      res.set("content-type", "application/json");
      res.send(JSON.stringify("Error!"));
      res.end();
    }
    currentConfig = result;
    delete currentConfig[Object.keys(req.body)[0]];
    let newConfig = {
      ...currentConfig,
      [Object.keys(req.body)[0]]: req.body[Object.keys(req.body)[0]],
    };
    db.add("config", newConfig);
    res.set("content-type", "application/json");
    res.send(JSON.stringify("Successfully updated status!"));
    res.end();
  });
});

// Update all endpoints (This is used by update single and updateall on front end)
router.post("/endpoints/update", (req, res) => {
  db.add("endpoints", req.body);
  let response = "Endpoints updated!";
  console.log(req.body);
  res.set("content-type", "application/json");
  res.send({ response });
  res.end();
});

// Add new endpoint and generate ID after previous
router.post("/endpoint/add", (req, res) => {
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
        res.set("content-type", "application/json");
        res.send(result);
        res.end();
      }
    }
  });
});

// Delete endpoint by ID
router.post("/endpoint/delete/:endpoint_id", (req, res) => {
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

// Edit endpoint by ID
router.post("/endpoint/update/:endpoint_id", (req, res) => {
  db.get("endpoints", function (err, result) {
    if (err) {
      console.log(err);
    } else {
      let response;
      var index = result.findIndex((p) => p.id == req.params.endpoint_id);

      if (index < 0) response = "Error";
      else {
        result[index].enabled = !result[index].enabled;
        response = `Endpoint ${req.params.endpoint_id} state changed!`;
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
