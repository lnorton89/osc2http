import React, { useState, useEffect } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { TextField, Checkbox, CircularProgress } from "@material-ui/core";
import {
  AddBox,
  ArrowDownward,
  Check,
  Clear,
  DeleteOutline,
  ChevronLeft,
  ChevronRight,
  Edit,
  SaveAlt,
  FilterList,
  FirstPage,
  LastPage,
  Search,
  Remove,
  ViewColumn,
} from "@material-ui/icons";
import MaterialTable from "material-table";

const tableIcons = {
  Add: React.forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
  Check: React.forwardRef((props, ref) => <Check {...props} ref={ref} />),
  Clear: React.forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Delete: React.forwardRef((props, ref) => (
    <DeleteOutline {...props} ref={ref} />
  )),
  DetailPanel: React.forwardRef((props, ref) => (
    <ChevronRight {...props} ref={ref} />
  )),
  Edit: React.forwardRef((props, ref) => <Edit {...props} ref={ref} />),
  Export: React.forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
  Filter: React.forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
  FirstPage: React.forwardRef((props, ref) => (
    <FirstPage {...props} ref={ref} />
  )),
  LastPage: React.forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
  NextPage: React.forwardRef((props, ref) => (
    <ChevronRight {...props} ref={ref} />
  )),
  PreviousPage: React.forwardRef((props, ref) => (
    <ChevronLeft {...props} ref={ref} />
  )),
  ResetSearch: React.forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Search: React.forwardRef((props, ref) => <Search {...props} ref={ref} />),
  SortArrow: React.forwardRef((props, ref) => (
    <ArrowDownward {...props} ref={ref} />
  )),
  ThirdStateCheck: React.forwardRef((props, ref) => (
    <Remove {...props} ref={ref} />
  )),
  ViewColumn: React.forwardRef((props, ref) => (
    <ViewColumn {...props} ref={ref} />
  )),
};

const useStyles = makeStyles((theme) => ({
  table: {},
  "& div": {
    "& div": {
      "& table": {
        // width: '50%'
      },
    },
  },
  preloader: {
    padding: theme.spacing(6),
    textAlign: "center",
    width: "100%",
    margin: "0 auto",
  },
}));

export default function List() {
  const classes = useStyles();
  const theme = useTheme();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoaded] = useState(false);
  const [validationError, setValidationError] = useState(false);
  const [data, setData] = useState([]);
  const [state, setState] = useState({});
  const tableRef = React.useRef(null);

  const handleChange = (event) => {
    let value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    function setData(target, value, id) {
      return fetch(`/api/endpoint/update/${id}`, {
        method: "POST",
        body: JSON.stringify({
          id: id,
          [target]: value,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then(
          (result) => {
            console.log(result);
          },
          (error) => {
            console.log(error);
          }
        );
    }

    setData(event.target.name, value, Number(event.target.id)).then(() => {
      setState({ ...state, [event.target.name]: value });
    });
  };

  const columns = [
    {
      field: "id",
      title: "ID",
      editable: "never",
      width: "5%",
      defaultSort: "asc",
    },
    {
      field: "name",
      title: "Name",
      width: "15%",
      validate: (rowData) =>
        rowData.name === "" ? "Name cannot be empty" : "",
    },
    {
      field: "osc",
      title: "OSC Message",
      width: "50%",
      validate: (rowData) =>
        rowData.osc === "" ? "OSC Message cannot be empty" : "",
    },
    {
      field: "ip",
      title: "Controller IP",
      width: "15%",
      validate: (rowData) =>
        rowData.ip === "" ? "Controller IP cannot be empty" : "",
    },
    {
      field: "preset",
      title: "WLED Preset",
      width: "10%",
      validate: (rowData) =>
        rowData.preset === "" ? "WLED Preset cannot be empty" : "",
    },
    {
      field: "enabled",
      title: "Enabled",
      editable: "never",
      width: "5%",
      render: (rowData) => (
        <Checkbox
          name="enabled"
          id={String(rowData.id)}
          defaultChecked={rowData.enabled}
          value={state.enabled}
          onChange={handleChange}
        />
      ),

      // editComponent: (props) => {
      //   return (
      //     <TextField
      //       type={"text"}
      //       placeholder="test"
      //       required={true}
      //       autoFocus={true}
      //       margin="dense"
      //       value={props.value === props ? "" : props.value}
      //       onChange={(event) => {
      //         props.onChange(event.target.value);
      //       }}
      //       error={validationError}
      //     />
      //   );
      // },
    },
  ];

  const tableOptions = {
    filtering: false,
    padding: "dense",
    selection: false,
    pageSize: 10,
    actionsColumnIndex: -1,
    pageSizeOptions: [10, 50, 100],
    rowStyle: (rowData, index) => {
      if (index % 2) {
        return { backgroundColor: theme.palette.background.default };
      }
      return {};
    },
  };

  // Note: the empty deps array [] means
  // this useEffect will run once
  // similar to componentDidMount()
  useEffect(() => {
    fetch("/api/endpoints")
      .then((res) => res.json())
      .then(
        (result) => {
          setIsLoaded(true);
          setData(result);
        },
        (error) => {
          setIsLoaded(true);
          setError(error);
        }
      );
  }, []);

  if (error) {
    return <div>Error: {error.message}</div>;
  } else if (!isLoading) {
    return (
      <div className={classes.preloader}>
        <CircularProgress />
      </div>
    );
  } else {
    return (
      <MaterialTable
        tableRef={tableRef}
        columns={columns}
        data={data}
        title=""
        options={tableOptions}
        icons={tableIcons}
        className={classes.table}
        editable={{
          onBulkUpdate: (changes) =>
            new Promise((resolve, reject) => {
              setTimeout(() => {
                let newData = [];

                for (const key of Object.keys(changes)) {
                  let mergedData = {
                    ...changes[key].oldData,
                    ...changes[key].newData,
                  };
                  data.splice(
                    data.findIndex(function (i) {
                      return i.id === changes[key].oldData.id;
                    }),
                    1
                  );
                  newData.push(mergedData);
                }

                for (const key of Object.keys(data)) {
                  newData.push(data[key]);
                }

                console.log(newData);
                setData(newData);
                fetch("/api/endpoints/update", {
                  method: "POST",
                  body: JSON.stringify(
                    newData.map(({ tableData, ...rest }) => rest)
                  ),
                  headers: {
                    "Content-Type": "application/json",
                  },
                })
                  .then((res) => res.json())
                  .then(
                    (result) => {
                      console.log(result.response);
                      resolve();
                    },
                    (error) => {
                      console.log(error);
                      reject();
                    }
                  );
              }, 500);
            }),
          onRowAdd: (newData) =>
            new Promise((resolve, reject) => {
              setTimeout(() => {
                // need to reach out to backend and get reponse with ID and to resolve promise
                // check here or server side for ID collison/new ID#?
                fetch("/api/endpoint/add", {
                  method: "POST",
                  body: JSON.stringify({
                    ...newData,
                  }),
                  headers: {
                    "Content-Type": "application/json",
                  },
                })
                  .then((res) => res.json())
                  .then(
                    (result) => {
                      console.log();
                      newData = {
                        ...newData,
                        enabled: true,
                        id:
                          result[
                            result.findIndex((p) => p.name == newData.name)
                          ].id,
                      };
                      setData([...data, newData]);
                      resolve();
                    },
                    (error) => {
                      console.log(error);
                      reject();
                    }
                  );
              }, 500);
            }),
          onRowUpdate: (newData, oldData) =>
            new Promise((resolve, reject) => {
              setTimeout(() => {
                const dataUpdate = [...data];
                const index = oldData.tableData.id;
                dataUpdate[index] = newData;
                setData([...dataUpdate]);
                newData = dataUpdate.map(({ tableData, ...rest }) => rest);
                fetch("/api/endpoints/update", {
                  method: "POST",
                  body: JSON.stringify(newData),
                  headers: {
                    "Content-Type": "application/json",
                  },
                })
                  .then((res) => res.json())
                  .then(
                    (result) => {
                      console.log(result.response);
                      resolve();
                    },
                    (error) => {
                      console.log(error);
                      reject();
                    }
                  );
              }, 500);
            }),
          onRowDelete: (oldData) =>
            new Promise((resolve, reject) => {
              setTimeout(() => {
                const dataDelete = [...data];
                const index = oldData.tableData.id;
                dataDelete.splice(index, 1);
                setData([...dataDelete]);
                fetch(`/api/endpoint/delete/${oldData.id}`, {
                  method: "POST",
                })
                  .then((res) => res.json())
                  .then(
                    (result) => {
                      console.log(result);
                      resolve();
                    },
                    (error) => {
                      console.log(error);
                      reject();
                    }
                  );
              }, 500);
            }),
        }}
      />
    );
  }
}
