import Matrix from "matrix-js-sdk";
import {useCallback, useState, useEffect} from "react";
import {emitCustomEvent} from "react-custom-events";

import {Capacitor} from "@capacitor/core";

import AppConfig from "../AppConfig";
import {capitalize} from "../utils/StringUtils";

const useClientConnection = () => {
  const [client, setClient] = useState(null);
  const [eventsSet, setEventsSet] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    username: undefined,
    avatar: undefined,
    userID: undefined,
    deviceID: undefined,
    displayName: undefined,
  });

  const setCurrentUserData = (key, val) => {
    currentUser[key] = val;
    setCurrentUser(currentUser);
  };

  const disconnect = useCallback(() => {
    if (client != null) client.stopClient();
    setClient(null);
    setEventsSet(false);
    setIsConnected(false);
  }, []);

  const connect = useCallback(async data => {
    let clientData = {baseUrl: "", useStore: true};
    if (typeof data === "string") clientData.baseUrl = data;
    else clientData = data;
    clientData.useAuthorizationHeader = true;

    // XXX: the way we pass the path to the worker script from webpack via html in body's dataset is a hack
    // but alternatives seem to require changing the interface to passing Workers to js-sdk
    const indexeddbWorkerScript = document.body.dataset.indexeddbWorkerScript;
    if (!indexeddbWorkerScript) {
      // If this is missing, something has probably gone wrong with
      // the bundling. The js-sdk will just fall back to accessing
      // indexeddb directly with no worker script, but we want to
      // make sure the indexeddb script is present, so fail hard.
      console.error("indexeddbWorkerScript is missing!");
    }

    // TODO: Write own Storage implementation to use native Storage
    const appName = AppConfig.name.toLocaleLowerCase().replace(" ", "");
    const db = new Matrix.IndexedDBStore({
      indexedDB: window.indexedDB,
      dbName: appName,
      workerScript: indexeddbWorkerScript,
      workerApi: Worker,
    });

    await db.startup();
    clientData.store = db;
    clientData.sessionStore = new Matrix.WebStorageSessionStore(window.localStorage);

    const cryptoDB = new Matrix.IndexedDBCryptoStore(window.indexedDB, `${appName}:crypto`);
    await cryptoDB.startup();
    clientData.cryptoStore = cryptoDB;

    setClient(Matrix.createClient(clientData));
  }, []);

  const addEvents = () => {
    if (client === null) return;
    setEventsSet(true);
    client.on("event", event => {
      console.log(event.getType(), event);
    });

    client.on("Room", () => {
      emitCustomEvent("roomUpdate");
    });

    client.on("RoomMember.typing", (data, member) => {
      emitCustomEvent("typing", member);
    });

    client.on("RoomState.members", event => {
      if ("avatar_url" in event.getContent()) emitCustomEvent("avatarChange", event);
    });

    client.on("Room.timeline", (event, room, toStartOfTimeline) => {
      if (toStartOfTimeline) return;
      emitCustomEvent("message", {event, room});
    });

    client.on("User.presence", function (event, user) {
      emitCustomEvent("userPresence", user);
    });

    client.on("Event.decrypted", event => {
      if (event.getType() === "m.room.message") {
        console.log(event.getContent().body);
      } else {
        console.log("decrypted an event of type", event.getType());
        console.log(event);
      }
    });
  };

  useEffect(() => {
    if (client !== null && !eventsSet) {
      client.on("sync", (state, prevState, data) => {
        const {avatar, userID, deviceID, displayName} = currentUser;
        const me = client.getUser(client.getUserId());
        if (me !== undefined || me !== null) {
          if (userID === undefined || userID === null) setCurrentUserData("userID", client.getUserId());
          if (deviceID === undefined || deviceID === null) setCurrentUserData("deviceID", client.getDeviceId());
          if (avatar === undefined || avatar === null) setCurrentUserData("avatar", me.avatarUrl);
          if (displayName === undefined || displayName === null) setCurrentUserData("displayName", me.displayName || undefined);
        }

        switch (state) {
          case "PREPARED":
            setIsConnected(true);
            client
              .getDevices()
              .then(r => {
                const currentDevice = r.devices.filter(device => device.device_id === client.getDeviceId());
                if (currentDevice.length === 0) console.warn("Couldn't find current Device");
                if (currentDevice[0].display_name !== null) return;
                console.log("set display name for device");
                client.setDeviceDetails(client.getDeviceId(), {display_name: `${AppConfig.name} ${capitalize(Capacitor.platform)}`});
              })
              .catch(err => console.error);
            addEvents();
            break;
        }
      });
    }
  }, [client, eventsSet]);

  return {
    isConnected,
    client,
    disconnect,
    connect,
    currentUser,
    setCurrentUserData,
  };
};

export default useClientConnection;
