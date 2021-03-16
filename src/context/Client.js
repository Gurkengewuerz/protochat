import * as React from "react";

export const DefaultClientConnection = {
  disconnect: () => {},
  client: null,
  isConnected: false,
  connect: data => {},
  currentUser: {},
  setCurrentUserData: (key, val) => {},
};

const ClientConnection = React.createContext(DefaultClientConnection);

export default ClientConnection;
