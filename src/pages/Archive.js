import {close} from "ionicons/icons";
import React, {useState, useEffect, useContext} from "react";
import {useAlert} from "react-alert";

import Loader from "../components/Loader";
import Rooms from "../components/Rooms";
import ClientConnection from "../context/Client";
import Base from "./Base";

const Devices = () => {
  const alert = useAlert();

  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const {connect, client, disconnect, isConnected, username} = useContext(ClientConnection);

  const fetchRooms = async () => {
    try {
      await client.syncLeftRooms();
      const leftRooms = client.getRooms().filter(room => {
        return room.hasMembershipState(client.getUserId(), "leave");
      });
      setRooms(leftRooms);
    } catch (error) {
      alert.show("Failed to fetch archived rooms!", {
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) fetchRooms();
  }, [isConnected]);

  const onDelete = id => {
    fetchRooms();
  };

  const onRejoin = id => {
    fetchRooms();
  };

  return (
    <Base icon={close} title="Archive" parentPage="/settings">
      <Rooms list={rooms} onDelete={onDelete} onRejoin={onRejoin} />
      <Loader isOpen={isLoading} />
    </Base>
  );
};

export default Devices;
