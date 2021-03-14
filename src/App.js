import React, {useEffect, useState} from "react";
import {transitions, positions, Provider as AlertProvider} from "react-alert";
import {Route, Redirect} from "react-router-dom";

import {IonApp} from "@ionic/react";
import {IonReactHashRouter} from "@ionic/react-router";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
// import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

import {Plugins} from "@capacitor/core";

import UserConfig from "./UserConfig";
import AlertTemplate from "./components/AlertTemplate";
import ClientConnection from "./context/Client";
import useClientConnection from "./hooks/useClientConnection";
import Chat from "./pages/Chat";
import ChatOverview from "./pages/ChatOverview";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Devices from "./pages/Devices";
import "./tailwindcss/base.css";
import "./tailwindcss/components.css";

/* Optional CSS utils that can be commented out */
// import "@ionic/react/css/padding.css";
// import "@ionic/react/css/float-elements.css";
// import "@ionic/react/css/text-alignment.css";
// import "@ionic/react/css/text-transformation.css";
// import "@ionic/react/css/flex-utils.css";
// import "@ionic/react/css/display.css";
import "./tailwindcss/utilities.css";
import "./theme/styles.css";

/* Theme variables */
import "./theme/variables.css";

const {Storage} = Plugins;

export let userConfig;
export let setUserConfig;

const App = () => {
  const clientConnector = useClientConnection();
  const [loggedin, setLoggedin] = useState("");
  const [storageData, setStorageData] = useState({});
  const [userSetting, setUserSetting] = useState(UserConfig);

  userConfig = userSetting;
  setUserConfig = setUserSetting;

  const options = {
    position: positions.BOTTOM_CENTER,
    timeout: 3000,
    offset: "30px",
    transition: transitions.SCALE,
  };

  const tryPersistWithoutPromtingUser = async () => {
    if (!navigator.storage || !navigator.storage.persisted) {
      return "never";
    }
    let persisted = await navigator.storage.persisted();
    if (persisted) {
      return "persisted";
    }
    if (!navigator.permissions || !navigator.permissions.query) {
      return "prompt"; // It MAY be successful to prompt. Don't know.
    }
    const permission = await navigator.permissions.query({
      name: "persistent-storage",
    });
    if (permission.state === "granted") {
      persisted = await navigator.storage.persist();
      if (persisted) {
        return "persisted";
      } else {
        throw new Error("Failed to persist");
      }
    }
    if (permission.state === "prompt") {
      return "prompt";
    }
    return "never";
  };

  const initStoragePersistence = async () => {
    const persist = await tryPersistWithoutPromtingUser();
    switch (persist) {
      case "never":
        console.log("Not possible to persist storage");
        break;
      case "persisted":
        console.log("Successfully persisted storage silently");
        break;
      case "prompt":
        const isPersisted = await navigator.storage.persist();
        console.log(`Persisted storage granted: ${isPersisted}`);
        break;
    }
  };

  useEffect(() => {
    initStoragePersistence();
    const checkSession = async () => {
      const data = await Storage.get({key: "data"});
      if (data.value !== null) {
        const parsedData = JSON.parse(data.value);
        setStorageData(parsedData);
        clientConnector.setUsername(parsedData.username);
        clientConnector.connect({
          baseUrl: parsedData["well_known"]["m.homeserver"]["base_url"],
          userId: parsedData["user_id"],
          accessToken: parsedData["access_token"],
          deviceId: parsedData["device_id"],
        });
        return;
      }
      setLoggedin("false");
    };
    const getUserSettings = async () => {
      const data = await Storage.get({key: "userConfig"});
      if (data.value !== null) {
        const parsedData = JSON.parse(data.value);
        setUserSetting(Object.assign(userSetting, parsedData));
      }
    };
    getUserSettings();
    if (clientConnector.client === null || clientConnector.client === undefined) checkSession();
  }, []);

  useEffect(() => {
    if (clientConnector.client !== null && Object.keys(storageData).length > 0) {
      setStorageData("");
      clientConnector.client.initCrypto();
      clientConnector.client.startClient();
      if (clientConnector.client.isLoggedIn()) {
        console.log("user already logged in");
        setLoggedin("true");
        return;
      } else {
        clientConnector.client.stopClient();
        clientConnector.disconnect();
      }
    }
  }, [clientConnector.client]);

  return (
    <ClientConnection.Provider value={clientConnector}>
      <AlertProvider template={AlertTemplate} {...options}>
        <IonApp>
          <IonReactHashRouter>
            <Route exact path="/login">
              <Login />
            </Route>
            <Route exact path="/overview">
              <ChatOverview />
            </Route>
            <Route exact path="/devices">
              <Devices />
            </Route>
            <Route path="/chat/:id">
              <Chat />
            </Route>
            <Route exact path="/settings">
              <Settings />
            </Route>
            {loggedin === "true" && location.hash == "#/" && <Redirect to="/overview" />}
            {loggedin === "false" && <Redirect to="/login" />}
          </IonReactHashRouter>
        </IonApp>
      </AlertProvider>
    </ClientConnection.Provider>
  );
};

export default App;
