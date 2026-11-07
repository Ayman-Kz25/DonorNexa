import { createContext, useContext } from "react";

const UserContext = createContext(null);

export function UserProvider({ children, value }) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useCurrentUser must be used inside UserProvider");
  }

  return context;
}
