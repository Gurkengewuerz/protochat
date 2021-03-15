import React, {useEffect, useRef} from "react";
import {useHistory} from "react-router-dom";

import {IonContent, IonPage, IonIcon, IonAlert} from "@ionic/react";

const Devices = ({children, title, icon, transparent, absolute, onScroll, parentPage}) => {
  const scrollContent = useRef();
  const history = useHistory();

  const debounce = (func, timeFrame) => {
    var lastTime = 0;
    return function () {
      var now = new Date();
      if (now - lastTime >= timeFrame) {
        func();
        lastTime = now;
      }
    };
  };

  useEffect(() => {
    const handleDebounced = () => {
      onScroll(scrollContent.current.scrollTop);
    };
    const onScrollHandler = debounce(handleDebounced, 50);

    if (onScroll === undefined) return;
    window.addEventListener("scroll", onScrollHandler, true);

    return () => window.removeEventListener("scroll", onScrollHandler, true);
  }, []);

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="flex flex-col flex-1 h-full">
          <div
            className={
              "z-20 flex flex-grow-0 flex-shrink-0 w-full text-dark-default py-2 mb-1" +
              (absolute ? " absolute" : "") +
              (transparent ? "" : " bg-light-default border-b border-light-tint")
            }>
            <button className="flex self-center p-2 rounded-full focus:outline-none hover:bg-light-tint text-2xl" onClick={() => history.replace(parentPage)}>
              <IonIcon icon={icon} className="w-6 h-6 fill-current" />
            </button>
            <div className="flex self-center items-center h-full w-full ml-3">
              <span className="text-xl">{title}</span>
            </div>
          </div>
          <div className="h-full overflow-auto max-w-xl w-full self-center" ref={scrollContent}>
            {children}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Devices;
