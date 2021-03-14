import React from "react";

import {IonIcon} from "@ionic/react";

const Button = ({extraClass, text, icon, onClick}) => {
  return (
    <>
      <button
        className={
          "w-full bg-dark-default text-light-default font-bold rounded border-b-2 border-dark-contrast hover:border-dark-default hover:bg-dark-contrast hover:text-light-contrast shadow-md py-2 px-6 grid-cols-8 grid justify-items-stretch " +
          (extraClass ? extraClass : "")
        }
        onClick={onClick}>
        <span className={"col-span-" + (icon ? "7" : "8") + " justify-self-center"}>{text}</span>
        {icon && <IonIcon className="justify-self-end text-2xl my-auto" icon={icon} />}
      </button>
    </>
  );
};

export default Button;
