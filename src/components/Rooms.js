import React, {useState, useEffect, useContext} from "react";

import AppConfig from "../AppConfig";
import ClientConnection from "../context/Client";
import Room from "./rows/Room";

const Rooms = ({list, onDelete, onRejoin, onEnter, onJoin}) => {
  const {client} = useContext(ClientConnection);

  const [roomList, setRoomList] = useState([]);

  useEffect(() => {
    let roomMeta = [];
    list.forEach(room => {
      let isWriting = false;
      let lastMessage = "";
      let lastMessageTS = undefined;
      const isGroup = room.currentState.getMembers() > 2;

      let otherUser = undefined;
      if (!isGroup) {
        room.currentState.getMembers().forEach(user => {
          if (isWriting) return;
          if (user.userId == client.getUserId()) return;
          isWriting = user.typing;
          otherUser = user;
        });
      }

      const ENCRYPTED = <div className="italic">Encrypted</div>;
      room.timeline
        .slice()
        .reverse()
        .forEach(msg => {
          if (lastMessage !== "") return;
          lastMessageTS = msg.getTs();
          if (msg.getType() === "m.room.encrypted") {
            lastMessage = ENCRYPTED;
            return;
          }
          if (msg.getType() !== "m.room.message") return;

          const roomMessageType = msg.getContent().msgtype;
          if (roomMessageType === "m.image") lastMessage = "Image";
          else if (roomMessageType === "m.file") lastMessage = "Document";
          else if (roomMessageType === "m.audio") lastMessage = "Audio";
          else if (roomMessageType === "m.location") lastMessage = "Location";
          else if (roomMessageType === "m.video") lastMessage = "Video";
          else if (roomMessageType === "m.bad.encrypted") lastMessage = ENCRYPTED;
          else lastMessage = msg.getContent().body;
        });

      roomMeta.push({
        count: room.getUnreadNotificationCount(),
        id: room.roomId,
        name: room.name,
        modified: lastMessageTS,
        invite: room.hasMembershipState(client.getUserId(), "invite") ? room.getDMInviter() : "",
        isWriting,
        isGroup,
        lastMessage,
        isArchive: room.hasMembershipState(client.getUserId(), "leave"),
        isInvite: room.hasMembershipState(client.getUserId(), "invite"),
        getAvatar: async () => {
          if (client === null) return;
          const avatarData = await (isGroup ? room : otherUser).getAvatarUrl(
            client.getHomeserverUrl(),
            AppConfig.avatarHeight,
            AppConfig.avatarWidth,
            AppConfig.avatarType,
            false
          );
          return avatarData;
        },
      });

      roomMeta.sort((a, b) => {
        if (a.modified < b.modified) return 1;
        if (a.modified > b.modified) return -1;
        return 0;
      });
    });
    setRoomList(roomMeta);
  }, [list]);

  return (
    <ul className="flex flex-col inline-block w-full select-none">
      {roomList.map((room, i) => (
        <Room
          room={room}
          isLast={roomList.length === i + 1}
          key={`chat-${room.id}`}
          onDelete={onDelete}
          onRejoin={onRejoin}
          onEnter={onEnter}
          onJoin={onJoin}
        />
      ))}
    </ul>
  );
};

export default Rooms;
