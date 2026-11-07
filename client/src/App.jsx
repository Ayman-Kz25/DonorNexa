import { useCallback, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/react";

import { useApi } from "./hooks/useApi";
import { useSocket } from "./hooks/useSocket";
import { UserProvider } from "./context/UserContext";

import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import FindDonors from "./pages/FindDonors";
import EmergencyRequests from "./pages/EmergencyRequests";
import About from "./pages/About";
import DonorDashboard from "./pages/DonorDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  useSocket();

  const { isLoaded, isSignedIn } = useAuth();
  const { request } = useApi();

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!isLoaded) return null;

    if (!isSignedIn) {
      setUser(null);
      setUserLoading(false);
      return null;
    }

    setUserLoading(true);

    try {
      const response = await request({
        method: "POST",
        url: "/api/users/sync",
      });

      const syncedUser = response.data.user;

      setUser(syncedUser);

      console.log("User Sync:", syncedUser);

      return syncedUser;
    } catch (error) {
      console.error("User Sync Failed:", error.response?.data || error.message);

      setUser(null);
      return null;
    } finally {
      setUserLoading(false);
    }
  }, [isLoaded, isSignedIn, request]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <UserProvider
      value={{
        user,
        setUser,
        userLoading,
        refreshUser,
      }}
    >
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/find-donors" element={<FindDonors />} />
          <Route path="/emergency-requests" element={<EmergencyRequests />} />
          <Route path="/about" element={<About />} />

          {/* Protected Dashboards */}
          <Route
            path="/donor/dashboard"
            element={
              <ProtectedRoute>
                <DonorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hospital/dashboard"
            element={
              <ProtectedRoute>
                <HospitalDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </UserProvider>
  );
}

export default App;
