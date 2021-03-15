import {close} from "ionicons/icons";
import React, {useState, useEffect, useContext} from "react";
import {useAlert} from "react-alert";
import {useHistory} from "react-router-dom";

import {IonIcon} from "@ionic/react";

import ClientConnection from "../context/Client";
import DateFormatter from "../utils/DateFormatter";
import {getIcon} from "../utils/DeviceUtils";
import Base from "./Base";

const Devices = () => {
  const history = useHistory();
  const alert = useAlert();

  const [devices, setDevices] = useState([]);
  const [myDeviceID, setMyDeviceID] = useState();

  const {connect, client, disconnect, isConnected, username} = useContext(ClientConnection);

  useEffect(() => {
    const x = async () => {
      setMyDeviceID(client.getDeviceId());
      const knownDevices = [];
      // TODO: Implement E2E Support
      try {
        knownDevices = client.getStoredDevicesForUser(client.getUserId());
      } catch (error) {
        // End-to-end encryption disabled
      }
      console.log(knownDevices);
      const data = await client.getDevices();
      console.log(data);
      if (data.devices)
        setDevices(
          data.devices.map(device => {
            return {...device, verified: false};
          })
        );
    };

    if (isConnected) x();
  }, [isConnected]);

  const Device = ({displayName, deviceID, ts, verified}) => {
    return (
      <div className="flex flex-nowrap py-2 px-2 hover:bg-light-tint focus:outline-none cursor-pointer">
        <div className="mr-3">
          <div className="rounded-full bg-primary-default h-12 w-12">
            <div className="flex items-center justify-center h-full w-full">
              <IonIcon icon={getIcon(displayName)} className="h-8 w-8 shadow-lg fit-content" />
            </div>
          </div>
        </div>
        <div className="flex-grow">
          <div className="flex flex-col">
            <div>
              {displayName} {deviceID === myDeviceID ? <span className="italic">(This)</span> : ""}
            </div>
            <div className="text-sm italic opacity-50">{deviceID}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex flex-col">
            <div title={DateFormatter.full(ts)}>{DateFormatter.chatOverview(ts)}</div>
            <div>{verified ? <span className="text-success-default">Verified</span> : <span className="text-warning-default">Unknown Device</span>}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Base icon={close} title="Devices" parentPage="/settings">
      {devices.map(device => {
        return (
          <Device key={device.device_id} displayName={device.display_name} deviceID={device.device_id} ts={device.last_seen_ts} verified={device.verified} />
        );
      })}
    </Base>
  );
};

export default Devices;
