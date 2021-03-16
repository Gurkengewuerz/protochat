import {
  arrowBackSharp,
  notifications,
  archive,
  happy,
  desktop,
  ban,
  key,
  mailUnread,
  skull,
  logOut,
  cloud,
  fingerPrint,
  helpCircle,
  shieldHalf,
  informationCircle,
  camera,
} from "ionicons/icons";
import React, {useState, useEffect, useContext, useRef} from "react";
import {useAlert} from "react-alert";
import {useHistory} from "react-router-dom";

import {IonIcon, IonAlert} from "@ionic/react";

import {Plugins, CameraResultType, CameraSource, CameraDirection} from "@capacitor/core";

import {userConfig, setUserConfig} from "../App";
import AppConfig from "../AppConfig";
import AboutAlert from "../components/AboutAlert";
import CachedIMG from "../components/CachedIMG";
import FlowControl from "../components/Flow";
import Loader from "../components/Loader";
import ClientConnection from "../context/Client";
import Base from "./Base";

const {Storage, Browser, Camera} = Plugins;

const Chat = () => {
  const history = useHistory();
  const alert = useAlert();
  const imgRef = useRef();

  const [userSetting, setUserSetting] = useState(userConfig);
  const [transparentHeader, setTransparentHeader] = useState(true);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [deactivateAccount, setDeactivateAccount] = useState(false);
  const [newPasswordFlow, setNewPasswordFlow] = useState(false);
  const [newPassword, setNewPassword] = useState();
  const [newPasswordAlertVisible, setNewPasswordAlertVisible] = useState(false);

  var imgButtonCnt = 0;
  const [isLoading, setIsLoading] = useState(false);

  const [changeDisplayname, setChangeDisplayname] = useState(false);

  const {client, disconnect, setCurrentUserData, currentUser} = useContext(ClientConnection);

  var nextAuthStep = undefined;

  const getAvatarURL = async () => {
    return currentUser.avatar === null
      ? null
      : client.mxcUrlToHttp(currentUser.avatar, AppConfig.avatarHeight, AppConfig.avatarWidth, AppConfig.avatarType, false);
  };

  const onScroll = scrollTop => {
    // Get the relevant measurements and positions
    const viewportHeight = window.innerHeight;
    const element = imgRef.current;
    const elementOffsetTop = element.offsetTop;
    const elementHeight = element.offsetHeight;

    // Calculate percentage of the element that's been seen
    const distance = scrollTop + viewportHeight - elementOffsetTop;
    const percentage = Math.round(distance / ((viewportHeight + elementHeight) / 100));

    // Restrict the range to between 0 and 100
    const perc = Math.min(100, Math.max(0, percentage));
    if (perc >= 95) setTransparentHeader(false);
    else setTransparentHeader(true);
  };

  const getImage = async cnt => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        direction: CameraDirection.Front,
      });

      if (cnt !== imgButtonCnt - 1) return;

      let format = "";
      if (image.format === "jpeg") format = "image/jpeg";
      else if (image.format === "png") format = "image/png";
      else {
        alert.show("Fileformat is not supported", {
          type: "error",
        });
        return;
      }
      setIsLoading(true);

      const fetchedData = await fetch(image.webPath);
      const blob = await fetchedData.blob();
      const upload = await client.uploadContent(blob, {includeFilename: false, type: format});
      client.setAvatarUrl(upload, (err, data) => {
        if (err === null) {
          alert.show("Avatar upload success", {
            type: "error",
          });
          setCurrentUserData("avatar", upload);
          return;
        }

        alert.show(err.message, {
          type: "error",
        });
      });
    } catch (error) {
      alert.show("Failed to update avatar", {
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteStorage = () => {
    setIsLoading(false);
    Storage.remove({key: "data"});
    if (client !== null) client.store.deleteAllData();
    //client.cryptoStore.deleteAllData();
    disconnect();
    history.replace("/login");
  };

  const logout = () => {
    if (client === null) return;
    setIsLoading(true);
    client
      .logout()
      .then(deleteStorage)
      .catch(e => {
        console.error(e);
        setIsLoading(false);
        alert.show("Failed to logout!", {
          type: "error",
        });
      });
  };

  const disableAccount = () => {
    setIsLoading(true);
    client
      .deactivateAccount({}, true)
      .then(deleteStorage)
      .catch(e => {
        setIsLoading(false);
        console.log(e);
      });
  };

  const updateValue = key => {
    const cpy = {...userSetting};
    cpy[key] = !(cpy[key] || false);
    setUserSetting(cpy);

    setUserConfig(cpy);
    Storage.set({
      key: "userConfig",
      value: JSON.stringify(cpy),
    });
  };

  const setDisplayNameFnc = alertData => {
    setIsLoading(true);
    client.setDisplayName(alertData.displayname, (err, data) => {
      setIsLoading(false);
      if (err === null) setCurrentUserData("displayName", alertData.displayname);
      else {
        alert.show("Failed to set new displayname!", {
          type: "error",
        });
      }
    });
  };

  const doNewPassword = async data => {
    if (data === undefined) return;
    const {session, type} = data;
    await client.setPassword(session ? {session, type} : {}, newPassword);
    alert.show("Password change successfull", {
      type: "success",
    });
    setNewPasswordFlow(false);
  };

  const Heading = ({children}) => {
    return <h1 className="text-xl font-bold text-primary-default pl-3 mt-4">{children}</h1>;
  };

  const Spacer = () => {
    return <hr className="border-light-shade" />;
  };

  const SettingButton = ({children, onClick, icon, value, className}) => {
    return (
      <button className={"w-full text-left text-lg px-3 py-2 hover:bg-light-tint focus:outline-none" + (className ? " " + className : "")} onClick={onClick}>
        <div className="flex">
          <div className="flex-grow">{children}</div>
          <div className="align-center m-auto text-text-center">
            {icon && ["string", "undefined"].includes(typeof value) && <IonIcon icon={icon} className="w-6 h-6 fill-current" />}
            {typeof value === "boolean" && (
              <div className={"w-12 h-6 flex items-center rounded-full" + (value ? " bg-success-default" : " bg-light-default")}>
                <div className={"w-5 h-5 rounded-full shadow-md transform" + (value ? " translate-x-6 bg-light-default" : " bg-dark-default")}></div>
              </div>
            )}
          </div>
        </div>
        {["string"].includes(typeof value) && <div className="w-full opacity-50 -mt-3">{value}</div>}
      </button>
    );
  };

  return (
    <>
      <Base title="Settings" icon={arrowBackSharp} absolute={true} transparent={transparentHeader} onScroll={onScroll} parentPage="/overview">
        <div className="m-auto h-80 my-2 relative">
          <CachedIMG className="h-full m-auto" src="/assets/icon/user.png" fetchSrc={getAvatarURL} alt="avatar" imgRef={imgRef} rerender={currentUser.avatar} />
          <button
            className="absolute right-1.5 bottom-1.5 w-10 h-10 rounded-full focus:outline-none focus:shadow-outline inline-flex p-2 shadow bg-primary-default"
            onClick={() => {
              getImage(imgButtonCnt++);
            }}>
            <IonIcon icon={camera} className="w-6 h-6 fill-current" />
          </button>
        </div>
        <Heading>Notifications</Heading>
        <SettingButton onClick={() => {}} icon={notifications}>
          Notifications
        </SettingButton>
        <Spacer />

        <Heading>Chat</Heading>
        <SettingButton onClick={() => updateValue("formatMessage")} value={userSetting.formatMessage}>
          Format messages
        </SettingButton>
        <SettingButton onClick={() => updateValue("showDeleted")} value={userSetting.showDeleted}>
          Show deleted messages
        </SettingButton>
        <SettingButton onClick={() => updateValue("hideUnknownEvents")} value={userSetting.hideUnknownEvents}>
          Hide unknown types
        </SettingButton>
        <SettingButton onClick={() => history.push("/archive")} icon={archive}>
          Archive
        </SettingButton>

        <Spacer />
        <Heading>Account</Heading>
        <SettingButton onClick={() => setChangeDisplayname(true)} icon={happy} value={currentUser.displayName}>
          Change displayname
        </SettingButton>
        <SettingButton onClick={() => history.push("/devices")} icon={desktop}>
          Devices
        </SettingButton>
        <SettingButton onClick={() => {}} icon={ban}>
          Ignored user
        </SettingButton>
        <SettingButton
          onClick={() => setNewPasswordAlertVisible(true)}
          icon={key}>
          Change passwords
        </SettingButton>
        <SettingButton onClick={() => {}} icon={mailUnread}>
          Reset password
        </SettingButton>
        <SettingButton onClick={logout} icon={logOut}>
          Sign out
        </SettingButton>
        <SettingButton
          onClick={() => {
            setDeactivateAccount(true);
          }}
          icon={skull}
          className="text-danger-default">
          Delete account
        </SettingButton>

        <Spacer />
        <Heading>Security</Heading>
        <SettingButton onClick={() => {}} icon={fingerPrint}>
          Your public key
        </SettingButton>
        <SettingButton onClick={() => {}} icon={cloud}>
          Enter security key
        </SettingButton>

        <Spacer />
        <Heading>Über</Heading>
        <SettingButton
          onClick={() => {
            updateValue("analytics");
          }}
          value={userSetting.analytics}>
          Allow analytics
        </SettingButton>
        <SettingButton onClick={() => updateValue("errorTracking")} value={userSetting.errorTracking}>
          Allow error tracking
        </SettingButton>
        <SettingButton
          onClick={() =>
            Browser.open({
              url: AppConfig.gitRepo,
            })
          }
          icon={helpCircle}>
          Help
        </SettingButton>
        <SettingButton
          onClick={() =>
            Browser.open({
              url: AppConfig.privacyURL,
            })
          }
          icon={shieldHalf}>
          Privacy
        </SettingButton>
        <SettingButton onClick={() => setAboutVisible(true)} icon={informationCircle}>
          About
        </SettingButton>
      </Base>
      <AboutAlert showAlert={aboutVisible} setShowAlert={setAboutVisible} />
      <IonAlert
        isOpen={changeDisplayname}
        onDidDismiss={() => setChangeDisplayname(false)}
        header={"Change displayname"}
        inputs={[
          {
            name: "displayname",
            type: "text",
            value: currentUser.displayName,
          },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
          },
          {
            text: "Ok",
            handler: setDisplayNameFnc,
          },
        ]}
      />

      <IonAlert
        isOpen={newPasswordAlertVisible}
        onDidDismiss={() => setNewPasswordAlertVisible(false)}
        header={"Change password"}
        inputs={[
          {
            name: "newPassword",
            type: "password",
          },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
          },
          {
            text: "Ok",
            handler: alertData => {
              setNewPassword(alertData.newPassword);
              setNewPasswordFlow(true);
              return true;
            },
          },
        ]}
      />
      <IonAlert
        isOpen={deactivateAccount}
        onDidDismiss={() => setDeactivateAccount(false)}
        header={"Warning!"}
        subHeader={`This disables your account! This action cannot be undone.
              After that, no one will be able to register with your username. Are you sure?`}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
          },
          {
            text: "Ok",
            handler: disableAccount,
          },
        ]}
      />
      <FlowControl asyncFunc={doNewPassword} isActive={newPasswordFlow} />
      <Loader isOpen={isLoading} />
    </>
  );
};

export default Chat;
