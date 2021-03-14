import * as React from "react";

export const DefaultClientConnection = {
  disconnect: () => {},
  client: null,
  isConnected: false,
  connect: data => {},
  setUsername: name => {},
  username: "",
};

const ClientConnection = React.createContext(DefaultClientConnection);

export default ClientConnection;
