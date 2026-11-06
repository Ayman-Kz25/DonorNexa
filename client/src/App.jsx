import {
  Show,
  SignInButton,
  SignUpButton,
  useAuth,
  UserButton,
} from "@clerk/react";
import { useApi } from "./hooks/useApi.js";
import { useEffect } from "react";

function App() {
  const { isLoaded, isSignedIn } = useAuth();
  const { request } = useApi();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const syncUser = async () => {
      try {
        const response = await request({
          method: "POST",
          url: "/api/users/sync",
        });

        console.log("User Sync:", response.data);
      } catch (error) {
        console.error(
          "User Sync Failed:",
          error.response?.data || error.message,
        );
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, request]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold text-green-800">DonorNexa</h1>

      <p className="text-gray-600">
        Connecting Donors. Bridging Lives. Saving Hope.
      </p>

      <Show when="signed-out">
        <div className="flex gap-4">
          <SignInButton mode="modal">
            <button className="rounded-lg bg-green-700 px-6 py-3 text-white">
              Sign In
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button className="rounded-lg border border-green-700 px-6 py-3 text-green-700">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="flex items-center gap-3">
          <p className="text-gray-700">Welcome to DonorNexa!</p>
          <UserButton />
        </div>
      </Show>
    </div>
  );
}

export default App;
