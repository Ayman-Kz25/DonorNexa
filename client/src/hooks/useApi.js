import { useAuth } from "@clerk/react";
import api from "../lib/api";
import { useCallback } from "react";

export function useApi() {
  const { getToken } = useAuth();

  const request = useCallback(
    async (config) => {
      const token = await getToken();

      return api({
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [getToken],
  );

  return { request };
}
