import React from "react";

import {IonAlert} from "@ionic/react";

import {Capacitor} from "@capacitor/core";

import packageInfo from "../../package.json";
import Config from "../AppConfig";

const AboutAlert = ({showAlert, setShowAlert}) => {
  return (
    <>
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={Config.name}
        subHeader={`Version: ${packageInfo.version} ${Capacitor.platform}`}
        buttons={["OK"]}
      />
    </>
  );
};

export default AboutAlert;
