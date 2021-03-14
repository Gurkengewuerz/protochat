import React from "react";

import {IonLoading} from "@ionic/react";

const Loader = ({isOpen}) => {
  return <IonLoading isOpen={isOpen} message="Please wait..." backdropDismiss={false} mode="ios" spinner="lines" />;
};

export default Loader;
