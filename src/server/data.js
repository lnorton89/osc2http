import flatfile from "flatfile";

const DATA_PATH = "data.json";

class Database {
  add(key, value) {
    flatfile.db(DATA_PATH, function (err, data) {
      if (err) throw err;

      data[key] = value;

      data.save(function (err) {
        if (err) throw err;
      });
    });
  }

  get(key, callback) {
    flatfile.db(DATA_PATH, function (err, data) {
      if (err) {
        callback(error);
        return;
      }

      callback(0, data[key]);
    });
  }
}

export { Database };
