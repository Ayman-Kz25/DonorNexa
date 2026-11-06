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

    const connectSocket = async () => {
      try {
        const token = await getToken();

        socket.auth = { token };
        socket.connect();
      } catch (error) {
        console.error("Socket authentication error:", error);
      }
    };

    connectSocket();

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection failed:", error.message);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [isLoaded, isSignedIn, getToken]);
}
