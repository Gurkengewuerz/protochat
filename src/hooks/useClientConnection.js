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
  const [username, setUsername] = useState("");

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

  useEffect(() => {
    if (client !== null && !eventsSet) {
      setEventsSet(true);
      client.on("event", event => {
        console.log(event.getType(), event);
      });

      client.on("sync", (state, prevState, data) => {
        // TODO: add currentUser to Context => Object with prefetched data like userID, name, avatar etc
        switch (state) {
          case "PREPARED":
            setIsConnected(true);
            emitCustomEvent("sync");
            client.setDeviceDetails(client.getDeviceId(), {display_name: `${AppConfig.name} ${capitalize(Capacitor.platform)}`});
            break;
        }
      });

      client.on("Room", () => {
        emitCustomEvent("roomUpdate");
      });

      client.on("RoomMember.typing", (data, member) => {
        emitCustomEvent("typing", member);
      });

      client.on("RoomState.members", (event) => {
        if ("avatar_url" in event.getContent()) emitCustomEvent("avatarChange", event);
      });

      client.on("Room.timeline", (event, room, toStartOfTimeline) => {
        if (toStartOfTimeline) return;
        emitCustomEvent("message", {event, room});
      });

      client.on("Event.decrypted", event => {
        if (event.getType() === "m.room.message") {
          console.log(event.getContent().body);
        } else {
          console.log("decrypted an event of type", event.getType());
          console.log(event);
        }
      });

      /*client.on("roommember.membership", async (event, member) => {
          if (
            member.membership === "invite" &&
            member.userId === matrixClient.getUserId()
          ) {
            await client.joinRoom(member.roomId);
            // setting up of room encryption seems to be triggered automatically
            // but if we don't wait for it the first messages we send are unencrypted
            await client.setRoomEncryption(member.roomId, {
              algorithm: "m.megolm.v1.aes-sha2",
            });
          }
        });*/
    }
  }, [client, eventsSet]);

  return {
    isConnected,
    client,
    disconnect,
    connect,
    username,
    setUsername,
  };
};

export default useClientConnection;
