import React, {useState, useEffect, useContext} from "react";

import ClientConnection from "../context/Client";
import Loader from "./Loader";
import Device from "./rows/Device";

const Devices = ({id}) => {
  const {client, isConnected, currentUser} = useContext(ClientConnection);
  const {deviceID, userID} = currentUser || {};
  if (id === undefined) id = userID;
  const isMe = id === userID;

  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected && id) updateDeviceList();
  }, [isConnected, id]);

  const updateDeviceList = async () => {
    setIsLoading(true);
    const knownDevices = [];
    // TODO: Implement E2E Support
    try {
      knownDevices = client.getStoredDevicesForUser(client.getUserId());
    } catch (error) {
      // End-to-end encryption disabled
    }
    console.log("knownDevices", knownDevices);
    const data = await client.getDevices();
    if (data.devices)
      setDevices(
        data.devices.map(device => {
          return {...device, verified: false, isMyDeviceID: deviceID === device.device_id};
        })
      );
    setIsLoading(false);
  };

  return (
    <>
      {devices.map(device => {
        return <Device key={device.device_id} device={device} isMe={isMe} onUpdate={updateDeviceList} />;
      })}
      <Loader isOpen={isLoading} />
    </>
  );
};

export default Devices;
