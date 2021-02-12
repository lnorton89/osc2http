# OSC2HTTP

Express / React application to listen and convert OSC messages to interact with an HTTP API. It's currently only setup to output to my WLED controllers but could be modified easily to communicate with other APIs.

All the data is stored in data.json in the root folder. If you would like to export/import data you can do so there. Currently the output sends a `POST` request to `http://IP.ADDRESS/json/state` with the item WLED preset. See [WLED Wiki](https://github.com/Aircoookie/WLED/wiki/JSON-API "WLED Wiki") for more information.

## Installation & Usage
You must have [Node.js/npm](https://github.com/nodejs/node) installed to use this! 

    git clone https://github.com/lnorton89/osc2http.git
    cd osc2http
    npm install
    npm run dev

## Known Bugs

- `material-table` [has a bug](https://github.com/mbrn/material-table/issues/2404) where a React Hook triggers an infinite loop. Version locked at `1.69.1` to mitigate. Seems like `WONTFIX` at this point.
- `material-table` [has a bug](https://github.com/mbrn/material-table/issues/2270) where pressing enter when editing a field bypasses validation. Seems like `WONTFIX` at this point.

## TODO

- Add button to capture OSC messages to avoid typing them out.
- Add more configuration for per-item output.

### License

Based off of [`expack`](https://github.com/bengrunfeld/expack). This project is licensed under the terms of the [MIT license](https://github.com/lnorton89/osc2http/blob/master/LICENSE).
