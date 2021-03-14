import {pencil, search, ellipsisVertical, chatbubbles} from "ionicons/icons";
import React, {useState, useEffect, useContext, useRef} from "react";
import {useCustomEventListener} from "react-custom-events";
import {Link, useHistory} from "react-router-dom";
import {useSpring, animated} from "react-spring";

import {IonContent, IonPage} from "@ionic/react";
import {IonIcon} from "@ionic/react";

import {Plugins} from "@capacitor/core";

import Config from "../AppConfig";
import CachedIMG from "../components/CachedIMG";
import ClientConnection from "../context/Client";
import useOutsideClick from "../hooks/useOutsideClick";
import DateFormatter from "../utils/DateFormatter";

const {Storage} = Plugins;

const ChatOverview = () => {
  const {connect, client, disconnect, isConnected} = useContext(ClientConnection);
  const dropDownRef = useRef();
  const history = useHistory();
  const [rooms, setRooms] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [dropdownShow, setDropdownShow] = useState(false);
  const contentProps = useSpring({
    opacity: showSearch ? 1 : 0,
    marginRight: showSearch ? 0 : 200,
  });

  const updateRooms = async () => {
    let rooms = client.getRooms();
    rooms.sort(function (a, b) {
      // < 0 = a comes first (lower index) - we want high indexes = newer
      var aMsg = a.timeline[a.timeline.length - 1];
      if (!aMsg) {
        return -1;
      }
      var bMsg = b.timeline[b.timeline.length - 1];
      if (!bMsg) {
        return 1;
      }
      if (aMsg.getTs() > bMsg.getTs()) {
        return -1;
      } else if (aMsg.getTs() < bMsg.getTs()) {
        return 1;
      }
      return 0;
    });

    let roomMeta = [];
    rooms.forEach(room => {
      console.log(room);
      let isWriting = false;
      let lastMessage = "";
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
        modified: room.getLastActiveTimestamp(),
        invite: room._selfMembership === "invite" ? room.getDMInviter() : "",
        isWriting,
        isGroup,
        lastMessage,
        getAvatar: async () => {
          if (client === null) return;
          const desiredHeight = 256;
          const desiredWidth = 256;

          const avatarData = await (isGroup ? room : otherUser).getAvatarUrl(client.getHomeserverUrl(), desiredHeight, desiredWidth, "scale", false);
          return avatarData;
        },
      });
    });
    setRooms(roomMeta);
  };

  useCustomEventListener("roomUpdate", () => {
    updateRooms();
  });

  useCustomEventListener("sync", () => {
    updateRooms();
  });

  useCustomEventListener("typing", () => {
    updateRooms();
  });

  useCustomEventListener("message", () => {
    updateRooms();
  });

  useEffect(() => {
    if (isConnected) updateRooms();
  }, [isConnected]);

  useOutsideClick(dropDownRef, () => {
    if (dropdownShow) setDropdownShow(false);
  });

  const StartChat = () => (
    <>
      <div className="flex h-full justify-center items-center">
        <div className="text-center opacity-30">
          <div className="text-center select-none">
            <IonIcon icon={chatbubbles} className="text-9xl" />
            <br />
            <span className="text-2xl">Start your first Chat! 🤭</span>
          </div>
        </div>
      </div>
    </>
  );
  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="flex flex-col h-full">
          <div className="flex justify-between px-3 pt-1 bg-light-default">
            <div className="flex items-center w-full py-2">
              <span className="font-bold text-2xl flex-grow opacity-70">{Config.name}</span>

              {!showSearch ? (
                <button
                  onClick={() => {
                    setShowSearch(true);
                  }}>
                  <IonIcon icon={search} className="w-6 h-6 fill-current" />
                </button>
              ) : (
                <animated.div style={contentProps}>
                  <div className="relative flex items-center w-full pl-2 overflow-hidden text-gray-600 focus-within:text-gray-400">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                      <button className="p-1 focus:outline-none focus:shadow-none">
                        <IonIcon icon={search} className="w-6 h-6 fill-current" />
                      </button>
                    </span>
                    <input
                      autoFocus
                      type="search"
                      onBlur={() => {
                        setShowSearch(false);
                      }}
                      className="w-full py-2 pl-12 text-sm text-dark-default bg-gray-200 border border-transparent appearance-none rounded-full focus:bg-dark-default focus:outline-none focus:border-blue-500 focus:text-gray-900 focus:shadow-outline-blue"
                      placeholder="Search..."
                      autoComplete="off"
                    />
                  </div>
                </animated.div>
              )}

              <div className="relative">
                <button
                  aria-haspopup="true"
                  onClick={() => setDropdownShow(!dropdownShow)}
                  className="px-2 py-1 rounded-full focus:outline-none hover:bg-light-tint">
                  <IonIcon icon={ellipsisVertical} className="w-6 h-6 text-dark-default fill-current align-text-bottom" />
                </button>
                <div ref={dropDownRef} className={`absolute right-0 -mt-10 origin-top-right z-50 ${dropdownShow ? "" : "hidden"}`}>
                  {[
                    {
                      name: "Settings",
                      url: "/settings",
                      clickHandler: () => {
                        history.push("/settings");
                      },
                    },
                  ].map((el, i) => {
                    return (
                      <div key={i}>
                        <Link
                          className="pl-4 py-2 pr-6 text-normal block bg-light-default text-dark-default hover:bg-light-tint"
                          to={el.url}
                          onClick={el.clickHandler}>
                          {el.name}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="relative mb-4 overflow-x-hidden h-full">
            {rooms.length == 0 && <StartChat />}
            <ul className="flex flex-col inline-block w-full select-none">
              {rooms.map((room, i) => {
                return (
                  <div key={`chat-${room.id}`}>
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
                          <div
                            className="items-center flex-1 min-w-0"
                            onClick={() => {
                              /// TODO: join room first if is invite
                              history.push(`/chat/${room.id}`);
                            }}>
                            <div className="flex justify-between mb-1 h-3/6">
                              <h2 className="text-sm font-semibold text-dark-default">{room.name}</h2>
                              <div className="flex">
                                <span className="mt-1 text-xs font-medium text-dark-shade">
                                  {room.modified > 0 ? DateFormatter.chatOverview(room.modified) : ""}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between text-sm leading-none truncate">
                              <span>{room.invite ? `${room.invite} invited you` : room.isWriting ? `Writing...` : room.lastMessage}</span>
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
                    {rooms.length !== i + 1 && <hr className="mx-7 opacity-30 bg-light-tint"></hr>}
                  </div>
                );
              })}
            </ul>
          </div>
          <div className="fixed absolute bottom-0 right-0 z-40 mb-6 mr-4">
            <button className="flex items-center justify-center w-12 h-12 mr-3 text-xl font-semibold text-primary-contrast bg-primary-default rounded-full focus:outline-none flex-no-shrink">
              <IonIcon icon={pencil} className="w-6 h-6 fill-current" />
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ChatOverview;
