import { useCallback, useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "@clerk/react";

import { useApi } from "./hooks/useApi";
import { useSocket } from "./hooks/useSocket";
import { UserProvider, useCurrentUser } from "./context/UserContext";

// Loading Components
import LoadingScreen from "./components/common/LoadingScreen";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import DonorLayout from "./layouts/DonorLayout";
import HospitalLayout from "./layouts/HospitalLayout";
import AdminLayout from "./layouts/AdminLayout";

// Public Pages
import Home from "./pages/public/Home";
import ActiveEmergencies from "./pages/public/ActiveEmergencies";

// Donor Pages
import DonorDashboard from "./pages/donor/DonorDashboard";
import DonorProfile from "./pages/donor/DonorProfile";
import DonorRequests from "./pages/donor/DonorRequests";
import MyDonations from "./pages/donor/MyDonations";
import Hospitals from "./pages/donor/Hospitals";
import DonorProfileForm from "./components/donor/DonorProfileForm";

// Hospital Pages
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import BloodRequests from "./pages/hospital/BloodRequests";
import CreateRequest from "./pages/hospital/CreateRequest";
import BloodInventory from "./pages/hospital/BloodInventory";
import FindDonors from "./pages/hospital/FindDonors";
import HospitalProfile from "./pages/hospital/HospitalProfile";
import HospitalRegistrationForm from "./components/hospital/HospitalRegistrationForm";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import DonorManagement from "./pages/admin/DonorManagement";
import HospitalManagement from "./pages/admin/HospitalManagement";
import CityManagement from "./pages/admin/CityManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import AdminBloodRequests from "./pages/admin/BloodRequests";
import AdminSettings from "./pages/admin/AdminSettings";

// Dashboard routes by role
const dashboardPaths = {
  donor: "/donor/dashboard",
  hospital: "/hospital/dashboard",
  admin: "/admin/dashboard",
};

// Guest routes
function GuestRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, userLoading } = useCurrentUser();

  if (!isLoaded || (isSignedIn && userLoading)) {
    return <LoadingScreen message="Preparing your DonorNexa experience..." />;
  }

  if (isSignedIn && dashboardPaths[user?.role]) {
    return <Navigate to={dashboardPaths[user.role]} replace />;
  }

  return children;
}

// Protected role-specific routes
function ProtectedRoute({ children, allowedRole }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, userLoading } = useCurrentUser();

  if (!isLoaded || userLoading) {
    return <LoadingScreen message="Verifying your account..." />;
  }

  if (!isSignedIn || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={dashboardPaths[user.role] || "/"} replace />;
  }

  return children;
}

// Onboarding routes
function OnboardingRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  const { user, userLoading, refreshUser, syncError } = useCurrentUser();

  if (!isLoaded || (isSignedIn && userLoading)) {
    return <LoadingScreen message="Setting up your account..." />;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (!user) {
    if (syncError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F5EF] px-4">
          <p className="text-center text-sm font-medium text-[#59483F]">
            Unable to load your account. Please try again.
          </p>

          <button
            type="button"
            onClick={refreshUser}
            className="rounded-xl bg-[#963D54] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#782B40]"
          >
            Retry
          </button>
        </div>
      );
    }

    return <LoadingScreen message="Preparing your registration..." />;
  }

  if (dashboardPaths[user.role]) {
    return <Navigate to={dashboardPaths[user.role]} replace />;
  }

  if (user.role !== "unassigned") {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Donor onboarding
function DonorOnboarding() {
  const navigate = useNavigate();
  const { refreshUser } = useCurrentUser();

  const handleRegistered = async () => {
    const updatedUser = await refreshUser();

    if (updatedUser?.role === "donor") {
      navigate("/donor/dashboard", { replace: true });
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#963D54]">
            DonorNexa
          </p>

          <h1 className="mt-3 font-serif text-3xl font-semibold text-[#302923]">
            Complete your donor profile
          </h1>

          <p className="mt-2 text-sm text-[#59483F]">
            Provide your details to get started as a blood donor.
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8DDD4] bg-[#FFFDF9] p-6 sm:p-8">
          <DonorProfileForm onRegistered={handleRegistered} />
        </div>
      </div>
    </main>
  );
}

// Hospital onboarding
function HospitalOnboarding() {
  const navigate = useNavigate();
  const { refreshUser } = useCurrentUser();

  const handleRegistered = async () => {
    const updatedUser = await refreshUser();

    if (updatedUser?.role === "hospital") {
      navigate("/hospital/dashboard", { replace: true });
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#963D54]">
            DonorNexa
          </p>

          <h1 className="mt-3 font-serif text-3xl font-semibold text-[#302923]">
            Register your hospital
          </h1>

          <p className="mt-2 text-sm text-[#59483F]">
            Submit your hospital information for administrator verification.
          </p>
        </div>

        <HospitalRegistrationForm onRegistered={handleRegistered} />
      </div>
    </main>
  );
}

// Scroll to top when navigating
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const sectionId = hash.substring(1);

      const timer = setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);

      return () => clearTimeout(timer);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [pathname, hash]);

  return null;
}

// Application routes
function AppRoutes() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* Public Website */}
        <Route element={<PublicLayout />}>
          <Route
            path="/"
            element={
              <GuestRoute>
                <Home />
              </GuestRoute>
            }
          />

          <Route path="/emergencies" element={<ActiveEmergencies />} />
        </Route>

        {/* Onboarding */}
        <Route
          path="/onboarding/donor"
          element={
            <OnboardingRoute>
              <DonorOnboarding />
            </OnboardingRoute>
          }
        />

        <Route
          path="/onboarding/hospital"
          element={
            <OnboardingRoute>
              <HospitalOnboarding />
            </OnboardingRoute>
          }
        />

        {/* Donor Routes */}
        <Route
          element={
            <ProtectedRoute allowedRole="donor">
              <DonorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/donor/dashboard" element={<DonorDashboard />} />

          <Route path="/donor/requests" element={<DonorRequests />} />

          <Route path="/donor/donations" element={<MyDonations />} />

          <Route path="/donor/hospitals" element={<Hospitals />} />

          <Route path="/donor/profile" element={<DonorProfile />} />
        </Route>

        {/* Hospital Routes */}
        <Route
          element={
            <ProtectedRoute allowedRole="hospital">
              <HospitalLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/hospital/dashboard" element={<HospitalDashboard />} />

          <Route path="/hospital/requests" element={<BloodRequests />} />

          <Route path="/hospital/create-request" element={<CreateRequest />} />

          <Route path="/hospital/inventory" element={<BloodInventory />} />

          <Route path="/hospital/find-donors" element={<FindDonors />} />

          <Route path="/hospital/profile" element={<HospitalProfile />} />
        </Route>

        {/* Admin Routes */}
        <Route
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/admin/users" element={<UserManagement />} />

          <Route path="/admin/donors" element={<DonorManagement />} />

          <Route path="/admin/hospitals" element={<HospitalManagement />} />

          <Route path="/admin/cities" element={<CityManagement />} />

          <Route
            path="/admin/blood-requests"
            element={<AdminBloodRequests />}
          />

          <Route path="/admin/audit-logs" element={<AuditLogs />} />

          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        {/* Unknown Routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// Main App
function App() {
  useSocket();

  const { isLoaded, isSignedIn } = useAuth();
  const { request } = useApi();

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [syncError, setSyncError] = useState(false);

  // Synchronize authenticated user with backend
  const refreshUser = useCallback(async () => {
    if (!isLoaded) return null;

    if (!isSignedIn) {
      setUser(null);
      setUserLoading(false);
      setSyncError(false);
      return null;
    }

    setUserLoading(true);
    setSyncError(false);

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
      setSyncError(true);

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
        syncError,
      }}
    >
      <AppRoutes />
    </UserProvider>
  );
}

export default App;
