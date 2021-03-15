import {enter, trash, close} from "ionicons/icons";
import React, {useContext, useState} from "react";
import {useAlert} from "react-alert";
import {useHistory} from "react-router";

import {IonActionSheet} from "@ionic/react";

import ClientConnection from "../../context/Client";
import DateFormatter from "../../utils/DateFormatter";
import CachedIMG from "../CachedIMG";
import Loader from "../Loader";

const Room = ({room, isLast, onDelete, onRejoin, onJoin, onEnter}) => {
  const {client} = useContext(ClientConnection);

  const history = useHistory();
  const alert = useAlert();

  const [showArchiveSheet, setShowArchiveSheet] = useState(false);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = e => {
    e.preventDefault();
    if (room.isArchive) setShowArchiveSheet(true);
    else if (room.isInvite) setShowJoinSheet(true);
    else {
      if (onEnter) onEnter(room.id);
      history.push(`/chat/${room.id}`);
    }
  };

  return (
    <>
      <li className="flex flex-no-wrap items-center pr-3 text-dark-default cursor-pointer hover:bg-light-tint">
        <div className="flex justify-between w-full focus:outline-none">
          <div className="flex justify-between w-full my-2">
            <div className="relative flex items-center ml-2 mr-3 text-xl font-semibold text-dark-default rounded-full flex-no-shrink">
              <CachedIMG
                className="object-cover w-12 h-12 rounded-full bg-primary-default"
                src="/assets/icon/user.png"
                fetchSrc={room.getAvatar}
                alt="avatar"
              />
            </div>
            {/* TODO: join room first if is invite */}
            <div className="items-center flex-1 min-w-0" onClick={handleClick}>
              <div className="flex justify-between mb-1 h-3/6">
                <h2 className="text-sm font-semibold text-dark-default">{room.name}</h2>
                <div className="flex">
                  <span className="mt-1 text-xs font-medium text-dark-shade">{room.modified > 0 ? DateFormatter.chatOverview(room.modified) : ""}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm leading-none truncate">
                <span>{room.isInvite ? `${room.invite} invited you` : room.isWriting ? `Writing...` : room.lastMessage}</span>
                {room.count > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-xs text-right text-primary-contrast bg-primary-default rounded-full">
                    {room.count}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </li>
      {isLast === false && <hr className="mx-7 opacity-30 bg-light-tint"></hr>}
      <Loader isOpen={isLoading} />
      {room.isArchive && (
        <IonActionSheet
          isOpen={showArchiveSheet}
          header="Archived room"
          buttons={[
            {
              text: "Cancle",
              icon: close,
              handler: () => {
                setShowArchiveSheet(false);
              },
            },
            {
              text: "Re-join",
              icon: enter,
              handler: async () => {
                setIsLoading(true);
                console.log("Rejoin clicked");
                try {
                  await client.joinRoom(room.id, {syncRoom: true});
                  if (onRejoin) onRejoin(room.id);
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
              text: "Delete",
              role: "destructive",
              icon: trash,
              handler: async () => {
                setIsLoading(true);
                console.log("Delete clicked");
                try {
                  await client.forget(room.id, true);
                  if (onDelete) onDelete(room.id);
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
      )}
      {room.isInvite && (
        <IonActionSheet
          isOpen={showJoinSheet}
          header="Join room"
          onDidDismiss={() => setShowJoinSheet(false)}
          buttons={[
            {
              text: "Join",
              icon: enter,
              handler: async () => {
                setIsLoading(true);
                console.log("join clicked");
                try {
                  await client.joinRoom(room.id, {syncRoom: true});
                  if (onJoin) onJoin(room.id);
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
              text: "Delete",
              role: "destructive",
              icon: trash,
              handler: async () => {
                setIsLoading(true);
                console.log("Delete clicked");
                try {
                  await client.forget(room.id, true);
                  if (onDelete) onDelete(room.id);
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
      )}
    </>
  );
};
export default Room;
