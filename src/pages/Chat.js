import {arrowBackSharp, search, ellipsisVertical, sendSharp} from "ionicons/icons";
import React, {useState, useEffect, useContext, useRef} from "react";
import {useCustomEventListener} from "react-custom-events";
import InfiniteScroll from "react-infinite-scroller";
import {useHistory, useParams} from "react-router-dom";

import {IonContent, IonPage, IonIcon} from "@ionic/react";

import ClientConnection from "../context/Client";
import DateFormatter from "../utils/DateFormatter";

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

  const [name, setName] = useState([]);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState({});
  const [isGroup, setIsGroup] = useState(false); // memebers > 2
  const [isOnline, setIsOnline] = useState(false); // m.presence
  const [typing, setTyping] = useState([]); // m.typing

  const {connect, client, disconnect, isConnected} = useContext(ClientConnection);

  useEffect(() => {
    const x = async () => {
      if (!id || id === "") {
        console.log("chat room id unknown");
        history.replace("/overview");
        return;
      }

      const room = client.getRoom(id);
      if (room === null) {
        console.log("current chat room does not exists");
        history.replace("/overview");
        return;
      }

      console.log("current chat room", room);

      let typingList = [];
      let memberList = {};
      room.currentState.getMembers().forEach(member => {
        if (member.typing) typingList.push(member.userId);
        memberList[member.userId] = member.rawDisplayName;
      });
      setIsGroup(room.currentState.getMembers() > 2);
      setMessages([...room.timeline]);
      setName(room.name);
      setMembers(memberList);
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
    let copy = [...messages];
    if (data.event.getRoomId() !== id) return;
    copy.push(data.event);
    setMessages(copy);
  });

  const fetchMessages = async page => {
    console.log("fetchMessages");
    const room = client.getRoom(id);
    if (room === null) {
      return;
    }
    // client.scrollback(room, 50).then((data) => {
    //   setMessages([...room.timeline]);
    // });
  };

  const printMessage = (data, firstInit = true) => {
    const type = data.getType().toLowerCase();
    const ts = data.getTs();
    const sender = data.getSender();
    const content = data.getContent();

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
        if (content.avatar_url) systemMessage = `${sender} changed his profile picture`;
        else if (content.membership === "invite") systemMessage = `${sender} invited ${content.displayname}`;
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
          <div key={data.getId()} className={"min-w-min max-w-sm my-2 " + (isMe ? "self-end" : "self-start")}>
            <div
              className={"p-4 text-sm rounded-t-lg shadow border-light-shade bg-light-default text-dark-default " + (isMe ? "rounded-l-lg" : "rounded-r-lg")}>
              <div className="flex">
                <div className="flex-auto">{sender}</div>
                <div className="flex-auto">{DateFormatter.message(ts)}</div>
              </div>
              {message}
            </div>
          </div>
        );
    }

    return (
      <div
        key={data.getId()}
        className="self-center px-2 py-1 text-sm border border-light-shade bg-light-default text-dark-default rounded-full shadow rounded-tg m-auto max-w-max mt-1">
        {systemMessage || type}
      </div>
    );
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="flex flex-col flex-1 h-full">
          <div className="z-20 flex flex-grow-0 flex-shrink-0 w-full bg-light-default text-dark-default border-b border-light-tint">
            <button className="flex self-center p-2 rounded-full focus:outline-none hover:bg-light-tint text-2xl" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackSharp} className="w-6 h-6 fill-current" />
            </button>
            <div
              className="w-12 h-12 mx-4 my-2 bg-blue-500 bg-center bg-no-repeat bg-cover rounded-full cursor-pointer"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=crop&amp;w=200&amp;q=50')",
              }}></div>
            <div className="flex flex-col justify-center flex-1 overflow-hidden cursor-pointer">
              <div className={"overflow-hidden font-medium leading-tight whitespace-no-wrap " + (!isOnline && typing.length == 0 ? "" : "text-lg")}>{name}</div>
              <div className="overflow-hidden text-sm font-medium leading-tight whitespace-no-wrap">
                <SubHeader isGroup={isGroup} typing={typing} isOnline={isOnline} />
              </div>
            </div>
            <button className="flex self-center p-2 ml-2 rounded-full focus:outline-none text-dark-default hover:bg-light-tint">
              <IonIcon icon={search} className="w-6 h-6 fill-current" />
            </button>
            <button type="button" className="flex self-center p-2 ml-2 mr-1 rounded-full md:block focus:outline-none text-dark-default hover:bg-light-tint">
              <IonIcon icon={ellipsisVertical} className="w-6 h-6 fill-current" />
            </button>
          </div>
          <div className="h-full overflow-auto">
            <div className="top-0 bottom-0 left-0 right-0 flex flex-col flex-1 bg-transparent bg-bottom bg-cover">
              <div className="self-center flex-1 w-full max-w-xl">
                <div className="relative flex flex-col px-3 py-1 m-auto">
                  <InfiniteScroll loadMore={fetchMessages} hasMore={true} loader={<h4 key={"scroll-" + messages.length}>Loading...</h4>} isReverse={true}>
                    {messages.length > 0 &&
                      messages.map(msg => {
                        return printMessage(msg);
                      })}
                  </InfiniteScroll>
                </div>
              </div>
            </div>
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
    </IonPage>
  );
};

export default Chat;
