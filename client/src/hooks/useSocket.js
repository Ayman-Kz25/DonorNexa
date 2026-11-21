import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import socket from "../lib/socket";

export function useSocket() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      socket.disconnect();
      return;
    }

    let isMounted = true;

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleConnectError = (error) => {
      console.error("Socket connection failed:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);

    const connectSocket = async () => {
      try {
        const token = await getToken();

        if (!isMounted || !token) return;

        socket.auth = { token };
        socket.connect();
      } catch (error) {
        console.error("Socket authentication error:", error);
      }
    };

    connectSocket();

    return () => {
      isMounted = false;

      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);

      socket.disconnect();
    };
  }, [isLoaded, isSignedIn, getToken]);
}
