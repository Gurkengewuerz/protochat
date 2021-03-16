import {ban, lockOpen, pencil, trashBin} from "ionicons/icons";
import React, {useState, useContext} from "react";
import {useAlert} from "react-alert";

import {IonActionSheet, IonAlert, IonIcon} from "@ionic/react";

import FlowControl from "../../components/Flow";
import ClientConnection from "../../context/Client";
import DateFormatter from "../../utils/DateFormatter";
import {getIcon} from "../../utils/DeviceUtils";
import Loader from "../Loader";

const Device = ({device, isMe, onUpdate}) => {
  console.log(device);
  const {client} = useContext(ClientConnection);
  const {display_name, device_id, last_seen_ts, user_id, verified, isMyDeviceID} = device;

  const alert = useAlert();

  const [actionSheet, setActionSheet] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDeviceFlow, setDeleteDeviceFlow] = useState(false);

  const doDelete = async data => {
    if (data === undefined) return;
    const {session, type} = data;
    await client.deleteMultipleDevices([device_id], session ? {session, type} : {});
    alert.show(`${device_id} deleted`, {
      type: "success",
    });
    setDeleteDeviceFlow(false);
    if (onUpdate !== undefined) onUpdate();
  };

  return (
    <div className="flex flex-nowrap py-2 px-2 hover:bg-light-tint focus:outline-none cursor-pointer" onClick={() => setActionSheet(true)}>
      <div className="mr-3">
        <div className="rounded-full bg-primary-default h-12 w-12">
          <div className="flex items-center justify-center h-full w-full">
            <IonIcon icon={getIcon(display_name)} className="h-8 w-8 shadow-lg fit-content" />
          </div>
        </div>
      </div>
      <div className="flex-grow">
        <div className="flex flex-col">
          <div>
            {display_name || "Unknown Device"} {isMyDeviceID ? <span className="italic">(This)</span> : ""}
          </div>
          <div className="text-sm italic opacity-50">{device_id}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="flex flex-col">
          <div title={DateFormatter.full(last_seen_ts)}>{DateFormatter.chatOverview(last_seen_ts)}</div>
          <div>{verified ? <span className="text-success-default">Verified</span> : <span className="text-warning-default">Unknown Device</span>}</div>
        </div>
      </div>
      {/* Rename, Start Verification, Block Device, Delete */}
      <IonActionSheet
        isOpen={actionSheet}
        onDidDismiss={() => setActionSheet(false)}
        buttons={[
          {
            text: "Start Verification",
            icon: lockOpen,
            cssClass: verified ? "hidden" : "",
            handler: async () => {
              setIsLoading(true);
              console.log("verification clicked");
              try {
                // TODO: Implement E2E Support
              } catch (error) {
                alert.show(error.message, {
                  type: "error",
                });
              } finally {
                setIsLoading(false);
              }
            },
          },
          {
            text: "Change device name",
            icon: pencil,
            cssClass: isMe ? "" : "hidden",
            handler: async () => {
              console.log("change device name clicked");
              setShowRename(true);
            },
          },
          {
            text: "Block device",
            icon: ban,
            cssClass: isMyDeviceID ? "hidden" : "text-danger-default",
            handler: async () => {
              setIsLoading(true);
              console.log("block clicked");
              try {
                await client.setDeviceBlocked(user_id, device_id, true);
                alert.show(`Device ${device_id} blocked`, {
                  type: "success",
                });
              } catch (error) {
                alert.show(error.message, {
                  type: "error",
                });
              } finally {
                setIsLoading(false);
              }
            },
          },
          {
            text: "Delete device",
            icon: trashBin,
            cssClass: isMyDeviceID ? "hidden" : "text-danger-default",
            handler: async () => {
              console.log("delete clicked");
              setDeleteDeviceFlow(true);
            },
          },
        ]}
      />
      <IonAlert
        isOpen={showRename}
        onDidDismiss={() => setShowRename(false)}
        header={"Rename device"}
        inputs={[
          {
            name: "newName",
            type: "text",
            value: display_name,
          },
        ]}
        buttons={[
          {
            text: "Ok",
            handler: async data => {
              setIsLoading(true);
              try {
                await client.setDeviceDetails(device_id, {display_name: data.newName});
                alert.show(`Device ${device_id} renamed`, {
                  type: "success",
                });
                if (onUpdate !== undefined) onUpdate();
              } catch (error) {
                alert.show(error.message, {
                  type: "error",
                });
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]}
      />
      <FlowControl asyncFunc={doDelete} isActive={deleteDeviceFlow} />
      <Loader isOpen={isLoading} />
    </div>
  );
};

export default Device;
