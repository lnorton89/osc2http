import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  AppBar,
  CssBaseline,
  Toolbar,
  Typography,
  Container,
  TextField,
  FormGroup,
  FormControlLabel,
  Switch,
  CircularProgress,
} from "@material-ui/core";
import CodeTwoToneIcon from "@material-ui/icons/CodeTwoTone";
import List from "./components/List";
import { Block } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  preloader: {
    padding: theme.spacing(6),
    textAlign: "center",
    width: "100%",
    margin: "0 auto",
  },
  heroContent: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(8, 0, 6),
  },
  cardGrid: {
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(8),
  },
  footer: {
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(1),
  },
  icon: {
    display: "block",
    color: theme.palette.primary.light,
    margin: theme.spacing(1, "auto"),
  }
}));

export default function App() {
  const classes = useStyles();
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [buttonState, setState] = useState({});

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then(
        (result) => {
          setState({
            enabled: result.enabled,
            port: result.port,
          });
          setIsLoaded(true);
        },
        (error) => {
          setIsLoaded(true);
          setError(error);
        }
      );
  }, []);

  const handleChange = (event) => {
    let value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    function setData(target, value) {
      return fetch("/api/status/update", {
        method: "POST",
        body: JSON.stringify({
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

    setData(event.target.name, value).then(() => {
      setState({ ...buttonState, [event.target.name]: value });
    });
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  } else if (!isLoaded) {
    return (
      <div className={classes.preloader}>
        <CircularProgress />
      </div>
    );
  } else {
    return (
      <React.Fragment>
        <CssBaseline />
        <AppBar position="relative">
          <Toolbar>
            <Typography variant="h6" color="inherit" noWrap>
              OSC2HTTP
            </Typography>
          </Toolbar>
        </AppBar>

        <main>
          <div className={classes.heroContent}>
            <Container maxWidth="sm">
              <Typography
                component="h2"
                variant="h3"
                align="center"
                color="textPrimary"
                gutterBottom
              >
                Settings
              </Typography>
              <Typography
                variant="body1"
                align="center"
                color="textSecondary"
                paragraph
              >
                This is your output port from Resolume Arena. Default is{" "}
                <code>7001</code>.
                <br />
                <i>Changing this requires restart of listen server!</i>
              </Typography>
              <FormGroup row>
                <TextField
                  name="port"
                  label="OSC Port"
                  onChange={handleChange}
                  placeholder={buttonState.port}
                  defaultValue={buttonState.port}
                />
                <FormControlLabel
                  control={
                    <Switch
                      defaultChecked={
                        buttonState.enabled ? buttonState.enabled : true
                      }
                      value={buttonState.enabled}
                      onClick={handleChange}
                      name="enabled"
                    />
                  }
                  label="Enable OSC Listener"
                />
              </FormGroup>
            </Container>
          </div>

          <Container className={classes.cardGrid} maxWidth="lg">
            <List />
          </Container>
        </main>

        <footer className={classes.footer}>
          <Typography variant="h6" align="center" gutterBottom>
            OSC2HTTP
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            color="textSecondary"
            component="p"
          >
            <CodeTwoToneIcon className={classes.icon} />
            Developed with React & Express
          </Typography>
        </footer>
      </React.Fragment>
    );
  }
}
