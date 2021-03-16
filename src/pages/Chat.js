import {arrowBackSharp, search, refresh, arrowUp, caretDown} from "ionicons/icons";
import moment from "moment";
import React, {useState, useEffect, useContext, useRef} from "react";
import {useAlert} from "react-alert";
import {useCustomEventListener} from "react-custom-events";
import {useHistory, useParams} from "react-router-dom";
import SwipeableViews from "react-swipeable-views";
import useInfiniteScroll from "react-use-infinite-loading";

import {IonContent, IonPage, IonIcon} from "@ionic/react";

import {Plugins, HapticsImpactStyle, Capacitor} from "@capacitor/core";

import AppConfig from "../AppConfig";
import CachedIMG from "../components/CachedIMG";
import Loader from "../components/Loader";
import ClientConnection from "../context/Client";
import DateFormatter from "../utils/DateFormatter";

const {Haptics} = Plugins;

const SubHeader = ({isGroup, isOnline, typing}) => {
  if (typing.length > 0) {
    let text = "Writing...";
    if (isGroup) {
      if (typing.length == 1) text = `${typing[0]} is writing`;
      else if (typing.length == 2) text = `${typing.join("and")} are writing`;
      else if (typing.length > 2) text = `${typing.length} are writing`;
    }
    return <span className="text-primary-default">{text}</span>;
  }
  if (isOnline) return <>Online</>;
  return <></>;
};

const Chat = () => {
  const {id} = useParams();
  const history = useHistory();
  const alert = useAlert();

  const [name, setName] = useState([]);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState({});
  const [isGroup, setIsGroup] = useState(false); // memebers > 2
  const [isOnline, setIsOnline] = useState(false); // m.presence
  const [firstInit, setFirstInit] = useState();
  const [typing, setTyping] = useState([]); // m.typing

  const [replyTo, setReplyTo] = useState("");

  const [messagesLoading, setMessagesLoading] = useState(true);

  const [avatarURL, setAvatarURL] = useState(undefined);

  const {client, isConnected} = useContext(ClientConnection);

  useEffect(() => {
    const x = async () => {
      if (client === null) return;
      if (!id || id === "") {
        console.log("chat room id unknown");
        history.replace("/overview");
        return;
      }

      const currentRoom = client.getRoom(id);
      if (currentRoom === null) {
        console.log("current chat room does not exists");
        history.replace("/overview");
        return;
      }

      const isGroup = currentRoom.currentState.getMembers() > 2;
      setIsGroup(isGroup);
      setName(currentRoom.name);

      let typingList = [];
      let memberList = {};
      let otherUser = {};
      currentRoom.currentState.getMembers().forEach(member => {
        if (member.typing) typingList.push(member.userId);
        if (member.userId === client.getUserId()) return;
        otherUser = member;
        memberList[member.userId] = member.rawDisplayName;
      });
      // TODO: If not is Group get other User client.getUser(otherUser.userId) => react on presence and get lastPresenceTs
      setMembers(memberList);
      setAvatarURL(
        await (isGroup ? currentRoom : otherUser).getAvatarUrl(
          client.getHomeserverUrl(),
          AppConfig.avatarHeight,
          AppConfig.avatarWidth,
          AppConfig.avatarType,
          false
        )
      );

      client.scrollback(currentRoom, 5, async (err, room) => {
        console.log("current chat room", room);

        if (err) {
          setMessages([...currentRoom.timeline]);
          setMessagesLoading(false);
          return;
        }

        setMessages([...room.timeline]);
        setMessagesLoading(false);
      });
    };
    if (isConnected) x();
  }, [isConnected]);

  useCustomEventListener("typing", data => {
    let copy = [...typing];
    if (data.roomId !== id) return;
    if (data.typing) copy.push(data.userId);
    else copy.pop(data.userId);
    setTyping(copy);
  });

  useCustomEventListener("message", data => {
    if (!name) return;
    let copy = [...messages];
    if (data.event.getRoomId() !== id) return;
    copy.push(data.event);
    setMessages(copy);
  });

  const getAvatarURL = async () => {
    return avatarURL;
  };

  const fetchMessages = page =>
    new Promise(async resolve => {
      if (client === null || !firstInit || moment().unix() - firstInit.unix() <= 2) {
        resolve();
        return;
      }

      const room = client.getRoom(id);
      if (room === null) {
        resolve();
        return;
      }
      console.log("---------------- fetchMessages ----------------");
      client.scrollback(room, 15, (err, newRoom) => {
        if (err === null) {
          setMessages([...newRoom.timeline]);
          resolve();
          return;
        }
        resolve();
        alert.show(err.message, {
          type: "error",
        });
      });
    });

  const [ref, containerRef, isLoading] = useInfiniteScroll({
    hasMore: true, // if server-side has more items for us
    offset: 200, // send request 100px before the end of scrolling container
    direction: "top", // scroll direction
    callback: fetchMessages, // api request
  });

  useEffect(() => {
    if (firstInit) return;
    if (messages.length === 0) return;
    setFirstInit(moment());
  }, [messages]);

  const printMessage = data => {
    const type = data.getType().toLowerCase();
    const ts = data.getTs();
    const sender = data.getSender();
    const content = data.getContent();
    const eventID = data.getId();

    const isMe = sender === client.getUserId();
    let systemMessage = "";
    switch (type) {
      case "m.room.create":
        systemMessage = `${content.creator} created this room`;
        break;
      case "m.room.join_rules":
        let state = "unknown";
        if (content.join_rule === "public") state = "public";
        else if (content.join_rule === "knock") state = "knocking";
        else if (content.join_rule === "invite") state = "invite only";
        else if (content.join_rule === "private") state = "private";
        systemMessage = `${sender} changed the join rules to ${state}`;
        break;
      case "m.room.member":
        if (content.membership === "invite") systemMessage = `${sender} invited ${content.displayname}`;
        else if (content.membership === "join") systemMessage = `${sender} joined this room`;
        else if (content.membership === "leave") systemMessage = `${sender} left this room`;
        else if (content.membership === "ban") systemMessage = `${sender} banned ${content.displayname}`;
        else systemMessage = `${sender}: ${content.membership}`;
        break;
      case "m.room.redaction":
        systemMessage = `Message reacted: ${content.reason}`;
        break;
      case "m.room.name":
        systemMessage = `${sender} set the room name to "${content.name}"`;
        break;
      case "m.room.topic":
        systemMessage = `${sender} set the room topic to "${content.ropic}"`;
        break;
      case "m.room.guest_access":
        systemMessage = `${sender} ${content.guest_access === "forbidden" ? "disabled guest access" : "enabled guest access"}`;
        break;
      case "m.room.history_visibility":
        let stateHistory = content.history_visibility;
        if (content.history_visibility === "invited") stateHistory = `since invited`;
        else if (content.history_visibility === "joined") stateHistory = `since joined`;
        else if (content.history_visibility === "shared") stateHistory = `since this message`;
        else if (content.history_visibility === "world_readable") stateHistory = `everyone`;
        systemMessage = `${sender} set history visibility to ${stateHistory}`;
        break;
      case "m.room.message":
        let message = content.body;
        switch (content.msgtype.toLowerCase()) {
          case "m.video":
            break;
          case "m.image":
            break;
          case "m.file":
            break;
          case "m.audio":
            break;
        }
        return (
          <SwipeableViews
            enableMouseEvents
            index={1}
            hysteresis={1.1}
            onSwitching={(index, type) => {
              if (type !== "move") return;
              if (index < 0.5 && replyTo === "") {
                console.log("start", index, replyTo);
                setReplyTo(eventID);
                if (Capacitor.platform !== "web") Haptics.selectionStart();
                // TODO: Implement Reply
              }

              if (index > 0.5 && replyTo) {
                console.log("end", index, replyTo);
                setReplyTo("");
                if (Capacitor.platform !== "web") Haptics.selectionEnd();
              }
            }}>
            <div className="w-40 h-8"></div>
            <div className={"min-w-min max-w-sm my-2 " + (isMe ? "self-end" : "self-start")}>
              <div
                className={"p-4 text-sm rounded-t-lg shadow border-light-shade bg-light-default text-dark-default " + (isMe ? "rounded-l-lg" : "rounded-r-lg")}>
                <div className="flex">
                  <div className="flex-auto">{sender}</div>
                  <div className="flex-auto">{DateFormatter.message(ts)}</div>
                </div>
                {message}
              </div>
            </div>
          </SwipeableViews>
        );
    }

    return (
      <div className="self-center px-2 py-1 text-sm border border-light-shade bg-light-default text-dark-default rounded-full shadow rounded-tg m-auto max-w-max mt-1">
        {systemMessage || type}
      </div>
    );
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="flex flex-col flex-1 h-full">
          <div className="z-20 flex flex-grow-0 flex-shrink-0 w-full bg-light-default text-dark-default border-b border-light-tint">
            <button className="flex self-center p-2 rounded-full focus:outline-none hover:bg-light-tint text-2xl" onClick={() => history.replace("/overview")}>
              <IonIcon icon={arrowBackSharp} className="w-6 h-6 fill-current" />
            </button>
            <CachedIMG
              className="w-12 h-12 mx-4 my-2 bg-blue-500 bg-center bg-no-repeat bg-cover rounded-full cursor-pointer"
              src="/assets/icon/user.png"
              fetchSrc={getAvatarURL}
              alt="avatar"
              rerender={avatarURL}
            />
            <div className="flex flex-col justify-center flex-1 overflow-hidden cursor-pointer">
              <div className={"overflow-hidden font-medium leading-tight whitespace-no-wrap " + (!isOnline && typing.length == 0 ? "" : "text-lg")}>{name}</div>
              <div className="overflow-hidden text-sm font-medium leading-tight whitespace-no-wrap">
                <SubHeader isGroup={isGroup} typing={typing} isOnline={isOnline} />
              </div>
            </div>
            <button className="flex self-center p-2 mx-2 rounded-full focus:outline-none text-dark-default hover:bg-light-tint">
              <IonIcon icon={search} className="w-6 h-6 fill-current" />
            </button>
          </div>
          <div className="h-full w-full overflow-auto flex flex-col-reverse self-center relative max-w-xl" ref={containerRef}>
            <div className="overflow-auto flex flex-col-reverse">
              {messages.length > 0 &&
                messages
                  .slice(0)
                  .reverse()
                  .map(msg => {
                    return (
                      <div key={msg.getId()} className="flex-auto px-3 w-100 h-100">
                        {printMessage(msg)}
                      </div>
                    );
                  })}
              <div ref={ref} className="flex-auto pt-5 mt-8">
                {isLoading && <IonIcon icon={refresh} className="text-4xl m-auto w-full my-3 text-dark-default" />}
              </div>
            </div>
          </div>
          <div className="fixed absolute bottom-12 right-0 z-40 mb-6 mr-4">
            <button className="flex items-center justify-center w-10 h-10 mr-3 rounded-full focus:outline-none flex-no-shrink bg-light-shade text-dark-default">
              <IonIcon icon={caretDown} className="w-6 h-6 fill-current" />
            </button>
          </div>
          <div className="relative flex items-center self-center w-full max-w-xl p-4 overflow-hidden text-gray-600 focus-within:text-gray-400">
            <div className="w-full">
              <span className="absolute inset-y-0 right-0 flex items-center pr-6">
                <button type="submit" className="p-1 focus:outline-none focus:shadow-none hover:text-blue-500">
                  <svg className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path
                      fillRule="nonzero"
                      d="M6.43800037,12.0002892 L6.13580063,11.9537056 C5.24777712,11.8168182 4.5354688,11.1477159 4.34335422,10.2699825 L2.98281085,4.05392998 C2.89811796,3.66698496 2.94471512,3.2628533 3.11524595,2.90533607 C3.53909521,2.01673772 4.60304421,1.63998415 5.49164255,2.06383341 L22.9496381,10.3910586 C23.3182476,10.5668802 23.6153089,10.8639388 23.7911339,11.2325467 C24.2149912,12.1211412 23.8382472,13.1850936 22.9496527,13.6089509 L5.49168111,21.9363579 C5.13415437,22.1068972 4.73000953,22.1534955 4.34305349,22.0687957 C3.38131558,21.8582835 2.77232686,20.907987 2.9828391,19.946249 L4.34336621,13.7305987 C4.53547362,12.8529444 5.24768451,12.1838819 6.1356181,12.0469283 L6.43800037,12.0002892 Z M5.03153725,4.06023585 L6.29710294,9.84235424 C6.31247211,9.91257291 6.36945677,9.96610109 6.44049865,9.97705209 L11.8982869,10.8183616 C12.5509191,10.9189638 12.9984278,11.5295809 12.8978255,12.182213 C12.818361,12.6977198 12.4138909,13.1022256 11.8983911,13.1817356 L6.44049037,14.0235549 C6.36945568,14.0345112 6.31247881,14.0880362 6.29711022,14.1582485 L5.03153725,19.9399547 L21.6772443,12.0000105 L5.03153725,4.06023585 Z"></path>
                  </svg>
                </button>
              </span>
              <input
                type="search"
                className="w-full py-2 text-sm bg-white border border-transparent appearance-none rounded-tg placeholder-gray-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:text-gray-900 rounded-2xl focus:shadow-outline-blue"
                placeholder="Message..."
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </IonContent>
      <Loader isOpen={messagesLoading} />
    </IonPage>
  );
};

export default Chat;
