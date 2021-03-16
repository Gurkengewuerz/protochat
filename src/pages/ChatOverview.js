import {pencil, search, ellipsisVertical, chatbubbles} from "ionicons/icons";
import React, {useState, useEffect, useContext, useRef} from "react";
import {useCustomEventListener} from "react-custom-events";
import {Link, useHistory} from "react-router-dom";
import {useSpring, animated} from "react-spring";

import {IonContent, IonPage} from "@ionic/react";
import {IonIcon} from "@ionic/react";

import Config from "../AppConfig";
import Rooms from "../components/Rooms";
import ClientConnection from "../context/Client";
import useOutsideClick from "../hooks/useOutsideClick";

const ChatOverview = () => {
  const {connect, client, disconnect, isConnected} = useContext(ClientConnection);
  var initialized = false;
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
    if (!initialized) return;
    client.stopPeeking();
    setRooms(
      client.getVisibleRooms().filter(room => {
        return !room.hasMembershipState(client.getUserId(), "leave");
      })
    );
  };

  useCustomEventListener("roomUpdate", () => {
    updateRooms();
  });

  useCustomEventListener("typing", () => {
    updateRooms();
  });

  useCustomEventListener("message", () => {
    updateRooms();
  });

  useEffect(() => {
    if (isConnected) {
      initialized = true;
      updateRooms();
    }
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
            <Rooms list={rooms} onJoin={updateRooms} onDelete={updateRooms} />
          </div>
          <div className="fixed absolute bottom-0 right-0 z-40 mb-6 mr-4">
            <button className="flex items-center justify-center w-12 h-12 mr-3 text-xl font-semibold text-primary-contrast bg-primary-default rounded-full focus:outline-none flex-no-shrink">
              <IonIcon icon={chatbubbles} className="w-6 h-6 fill-current" />
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ChatOverview;
