/* TODO: Bessere Flow Authentifizierung schreiben
(API welche die Stages annimmt, und die passenden Dialoge anzeigt) 
*/
import React, {useState, useEffect, useContext, useRef} from "react";
import {useAlert} from "react-alert";

import {IonAlert} from "@ionic/react";

import {Plugins, CameraResultType, CameraSource, CameraDirection} from "@capacitor/core";

import Loader from "../components/Loader";
import ClientConnection from "../context/Client";

const {Browser} = Plugins;

const FlowControl = ({asyncFunc, prePassword, preUsername, isActive}) => {
  const {currentUser, client} = useContext(ClientConnection);
  const alert = useAlert();

  const [sessionID, setSessionID] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(currentUser.username);
  const [flowType, setFlowType] = useState("");
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const [showFallbackAlert, setShowFallbackAlert] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof asyncFunc !== "function") return;
    if (isActive) nextStep();
    else onDidDismiss();
  }, [isActive]);

  useEffect(() => {
    if (flowType === "") return;
    switch (flowType) {
      case "m.login.password":
        setShowFallbackAlert(false);
        if (!password && !prePassword) setShowPasswordAlert(true);
        else doLoginPassword(password || prePassword);
        break;

      case "m.login.dummy":
        setShowFallbackAlert(false);
        nextStep();
        break;

      default:
        openFallbackURL();
        setShowFallbackAlert(true);
        break;
    }
  }, [flowType]);

  const doLoginPassword = p => {
    client.login(
      "m.login.password",
      {
        user: username,
        password: p,
        session: sessionID,
      },
      (err, data) => {
        setShowPasswordAlert(false);
        nextStep();
      }
    );
  };

  const openFallbackURL = () => {
    Browser.open({
      url: client.getFallbackAuthUrl(flowType, sessionID),
    });
  };

  const nextStep = async () => {
    console.log("nextStep");
    setIsLoading(true);
    try {
      await asyncFunc({
        session: sessionID,
        password: password || prePassword,
        username: username || preUsername,
        type: flowType,
      });
    } catch (err) {
      console.log(err);
      if (err.data) {
        console.log(err.data);
        setSessionID(err.data.session || "");
        const completed = err.data.completed || [];
        const flows = err.data.flows;
        const firstFlow = flows[0];
        const {stages} = firstFlow;
        console.log(stages);

        if (flowType && completed.length === 0) {
          alert.show("Whoops! Something went wrong.", {
            type: "error",
          });
          onDidDismiss();
          return;
        }

        for (let i = 0; i < stages.length; i++) {
          const stage = stages[i];
          if (completed.includes(stage)) continue;
          console.log("setting stage", stage, completed);
          setFlowType(stage);
          break;
        }
      } else {
        onDidDismiss();
        alert.show(err.message, {
          type: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onDidDismiss = () => {
    setSessionID("");
    setShowPasswordAlert(false);
    setShowFallbackAlert(false);
  };

  return (
    <>
      <IonAlert
        isOpen={showPasswordAlert}
        onDidDismiss={() => setShowPasswordAlert(false)}
        header={"Current password"}
        backdropDismiss={false}
        inputs={[
          {
            name: "password",
            type: "password",
          },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
          },
          {
            text: "Ok",
            handler: data => {
              setPassword(data.password);
              doLoginPassword(data.password);
              return false;
            },
          },
        ]}
      />
      <IonAlert
        isOpen={showFallbackAlert}
        message={"Please follow the steps on the page and press next."}
        onDidDismiss={onDidDismiss}
        backdropDismiss={false}
        buttons={[
          {
            text: "Cancel",
            handler: () => {},
          },
          {
            text: "Reopen",
            handler: () => {
              openFallbackURL();
              return false;
            },
          },
          {
            text: "Done",
            handler: () => {
              nextStep();
              return false;
            },
          },
        ]}
      />
      <Loader isOpen={isLoading} />
    </>
  );
};

export default FlowControl;
