import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/react";

import { useApi } from "./hooks/useApi";
import { useSocket } from "./hooks/useSocket";

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

        {/* Unknown URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
