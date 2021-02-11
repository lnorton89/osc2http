var fs = require("fs");

let appConfig = JSON.parse(
  fs.readFileSync("data.json", { encoding: "utf8" }, function (err, data) {
    if (err) {
      // For errors besides does-not-exist, pass downstream.
      if (err.code != "ENOENT") return callback(err, null);

      // If it doesn't exist, return an empty object for instantiation.
      data = "{}";
    }
  })
);

export { appConfig };
