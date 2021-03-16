import {arrowForwardSharp, arrowBackSharp, personCircleSharp, keySharp, logInOutline} from "ionicons/icons";
import React, {useState, useContext, MouseEvent, useEffect} from "react";
import {useAlert} from "react-alert";
import {Link, useHistory} from "react-router-dom";
import {animated} from "react-spring";
import {Transition} from "react-spring/renderprops-universal";

import {IonContent, IonPage, IonIcon, IonAlert} from "@ionic/react";

import {Plugins, Capacitor} from "@capacitor/core";

import AppConfig from "../AppConfig";
import logo from "../assets/logo.png";
import AboutAlert from "../components/AboutAlert";
import Button from "../components/Button";
import FlowControl from "../components/Flow";
import Input from "../components/Input";
import Loader from "../components/Loader";
import ClientConnection from "../context/Client";

const {Keyboard, Storage, Browser} = Plugins;

const LoginStep = {
  HOMESERVER: 0,
  USERNAME: 1,
  LOGIN: 2,
};

const Login = () => {
  const {connect, client, disconnect, currentUser, setCurrentUserData} = useContext(ClientConnection);
  const alert = useAlert();
  const history = useHistory();

  const [homeserver, setHomeserver] = useState("matrix.org");
  const [url, setURL] = useState("");
  const [step, setStep] = useState(LoginStep.HOMESERVER);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [username, setUsername] = useState(currentUser.username || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [keyboardShown, setKeyboardShown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  if (Capacitor.platform !== "web") {
    Keyboard.addListener("keyboardDidShow", info => {
      setKeyboardShown(true);
    });

    Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardShown(false);
    });
  }

  const saveSessionData = response => {
    Storage.set({
      key: "data",
      value: JSON.stringify(response),
    });
  };

  const validURL = str => {
    var pattern = new RegExp(
      "^(https?:\\/\\/)?" + // protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    return !!pattern.test(str);
  };

  const createConnection = e => {
    e.preventDefault();
    const httpsURL = `https://${homeserver}`;

    if (!validURL(httpsURL)) {
      alert.show("Invalid URL", {
        type: "error",
      });
      return;
    }

    console.log(`setting homeserver ${homeserver}`);
    connect(httpsURL);
  };

  useEffect(() => {
    const success = () => {
      console.log(`homeserver ${homeserver} availaible`);
      setURL(client.getHomeserverUrl());
      setStep(LoginStep.USERNAME);
    };

    if (client !== null && step == LoginStep.HOMESERVER) {
      setIsLoading(true);

      client
        .isUsernameAvailable("ping")
        .then(success)
        .catch(err => {
          console.log(err.name, err);

          if (err.name === "M_USER_IN_USE") {
            success();
            return;
          }
          disconnect();
          alert.show(err.message, {
            type: "error",
          });
        })
        .finally(() => setIsLoading(false));
    }
  }, [client, step]);

  const checkUsername = e => {
    e.preventDefault();
    setIsLoading(true);
    console.log(`testing if user ${username} exists`);
    client
      .isUsernameAvailable(username)
      .then(response => {
        setShowPassword(true);
      })
      .catch(err => {
        setUsernameError(err.message);
      })
      .finally(() => setIsLoading(false));
  };

  const doRegister = async data => {
    if (data === undefined) return;
    console.log(data);
    const {session, password, username, type} = data;
    try {
      await client.register(username, password, session, session ? {session, type} : {});
      console.log("registration successfull", data.user_id);
      setPassword("");
      setStep(LoginStep.LOGIN);
    } catch (error) {
      throw error;
    }
  };

  const register = e => {
    if (e !== null && e !== undefined) e.preventDefault();
    if (!password) {
      alert.show("Please specify a password!", {
        type: "error",
      });
      return;
    }
    console.log(`trying to register at ${homeserver}`);
    setIsRegistering(true);
  };

  const login = e => {
    e.preventDefault();
    setIsLoading(true);
    console.log(`trying to login to ${homeserver}`);
    client
      .login("m.login.password", {
        user: username,
        password: password,
      })
      .then(response => {
        console.log("got Access Token", response.access_token);
        setCurrentUserData("username", username);
        response.username = username;
        saveSessionData(response);
        client.initCrypto();
        client.startClient({pollTimeout: AppConfig.clientTimeout, initialSyncLimit: AppConfig.syncLimit});
        history.replace("/overview");
      })
      .catch(err => {
        setIsLoading(false);
        alert.show(err.message, {
          type: "error",
        });
      });
  };

  const pages = [
    style => (
      <animated.div style={{...style}}>
        <h3 className="mb-0">Serveradresse</h3>
        <label className="input-field inline-flex items-baseline border-b-2 mb-0 w-full">
          <span className="flex-none text-dusty-blue-darker select-none leading-none text-lg">https://</span>
          <div className="flex-1 leading-none">
            <form className="flex">
              <input
                className="w-full bg-transparent focus:border-none border-none text-lg py-0 px-1"
                type="text"
                value={homeserver}
                onChange={e => setHomeserver(e.target.value)}
              />
              <button type="submit" onClick={createConnection}>
                <IonIcon icon={arrowForwardSharp} className="text-white text-xl" />
              </button>
            </form>
          </div>
        </label>
      </animated.div>
    ),
    style => (
      <animated.div style={{...style}}>
        <Input
          value={username}
          onChange={e => {
            setUsername(e.target.value.toLowerCase());
            if (usernameError) setUsernameError("");
            if (isRegistering) setIsRegistering(false);
            if (showPassword) setShowPassword(false);
          }}
          placeholder="Username"
          error={usernameError}
          icon={personCircleSharp}
        />
        {showPassword && (
          <>
            <div className="mt-2"></div>
            <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="***" type="password" error={passwordError} icon={keySharp} />
          </>
        )}
        <Button extraClass="mt-8" text={"Register"} onClick={showPassword ? register : checkUsername} />
        <div className="w-full text-center">
          <Link
            className="mt-3 text-primary-default underline hover:no-underline"
            onClick={e => {
              e.preventDefault();
              if (isRegistering) setIsRegistering(false);
              setStep(LoginStep.LOGIN);
            }}
            to="#x">
            Already got an account?
          </Link>
        </div>
      </animated.div>
    ),
    style => (
      <animated.div style={{...style}}>
        <Input
          value={username}
          onChange={e => {
            setUsername(e.target.value.toLowerCase());
          }}
          placeholder="Username"
          error={usernameError}
          icon={personCircleSharp}
        />
        <div className="mt-2"></div>
        <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="***" type="password" error={passwordError} icon={keySharp} />
        <Button extraClass="mt-8" text={"Login"} onClick={login} icon={logInOutline} />
      </animated.div>
    ),
  ];

  const stepBack = () => {
    if (step - 1 === LoginStep.HOMESERVER) {
      disconnect();
    }
    if (step === LoginStep.USERNAME) setStep(LoginStep.HOMESERVER);
    if (step === LoginStep.LOGIN) setStep(LoginStep.USERNAME);
    setUsernameError("");
    setPasswordError("");
    if (showPassword) setShowPassword(false);
    if (isRegistering) setIsRegistering(false);
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="flex flex-col h-screen justify-between">
          <header className={step > LoginStep.HOMESERVER ? "block" : "hidden"}>
            <nav className="flex items-center justify-between flex-light bg-light-default p-6">
              <div className="flex items-center flex-no-shrink text-light-contrast mr-6">
                <button onClick={stepBack}>
                  <IonIcon icon={arrowBackSharp} className="text-xl" />
                </button>
                <span className="pl-5 font-semibold text-xl text-primary-contrast">{step === LoginStep.LOGIN ? `Login at ${url}` : `Register at ${url}`}</span>
              </div>
            </nav>
          </header>
          <main className="mb-auto h-10">
            <div className="mx-12">
              <img src={logo} className="object-contain h-80 w-full mt-16 select-none" alt="Logo" />
              <div className="reveals-main w-full">
                <Transition
                  reset
                  unique
                  items={step}
                  config={{duration: 500}}
                  from={{opacity: 0, transform: "translate3d(100%,0,0)"}}
                  enter={{opacity: 1, transform: "translate3d(0%,0,0)"}}
                  leave={{opacity: 0, transform: "translate3d(-50%,0,0)"}}>
                  {index => pages[index]}
                </Transition>
              </div>
            </div>
          </main>
          <footer className={"mx-5 mb-4 " + (!keyboardShown && step == LoginStep.HOMESERVER ? "block" : "hidden")}>
            <hr />
            <div className="flex justify-between mt-2 mx-16">
              <AboutAlert showAlert={showAlert} setShowAlert={setShowAlert} />
              <button onClick={() => setShowAlert(!showAlert)}>About</button>
              <button
                onClick={() => {
                  window.open(AppConfig.privacyURL, "_system", "location=yes");
                  return false;
                }}>
                Privacy
              </button>
            </div>
          </footer>
        </div>
        <FlowControl asyncFunc={doRegister} prePassword={password} preUsername={username} isActive={isRegistering} />
        <Loader isOpen={isLoading} />
      </IonContent>
    </IonPage>
  );
};

export default Login;
