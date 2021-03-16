import {close} from "ionicons/icons";
import React from "react";
import Devices from "../components/Devices";

import Base from "./Base";

const DeviceSettings = () => {
  return (
    <Base icon={close} title="Devices" parentPage="/settings">
      <Devices />
    </Base>
  );
};

export default DeviceSettings;
