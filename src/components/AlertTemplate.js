import {checkmarkDone, information, warning} from "ionicons/icons";
import React from "react";

import {IonIcon} from "@ionic/react";

const AlertTemplate = ({message, options}) => {
  const getIcon = () => {
    switch (options.type) {
      case "success":
        return checkmarkDone;

      case "error":
        return warning;

      default:
      case "info":
        return information;
    }
  };

  const getColor = () => {
    switch (options.type) {
      case "success":
        return "bg-success-default text-success-contrast";

      case "error":
        return "bg-danger-default text-danger-contrast";

      default:
      case "info":
        return "bg-primary-default text-primary-contrast";
    }
  };

  return (
    <div className={"border-t-4 rounded-b px-4 py-3 shadow-md my-2 " + getColor()} role="alert">
      <div className="flex">
        <IonIcon icon={getIcon()} className="text-teal mr-4 text-lg" />
        <div>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default AlertTemplate;
