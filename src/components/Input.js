import React from "react";

import {IonIcon} from "@ionic/react";

const Input = ({extraClass, type, icon, placeholder, value, onChange, error}) => {
  return (
    <div className="relative">
      <input
        type={type ? type : "text"}
        className={"w-full focus:ring-0 border-none text-xl py-2 px-12 text-light-contrast bg-light-default rounded-xl " + extraClass}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {error && <span className="text-xs text-danger-default ml-12">{error}</span>}
      {icon && (
        <div className="absolute left-3 top-2">
          <IonIcon icon={icon} className="text-2xl" />
        </div>
      )}
    </div>
  );
};

export default Input;
