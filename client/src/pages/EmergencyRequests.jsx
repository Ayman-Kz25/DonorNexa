import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Droplet,
  MapPin,
  CalendarDays,
  RefreshCw,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import api from "../lib/api";
import { useCurrentUser } from "../context/UserContext";
import { useApi } from "../hooks/useApi";

function EmergencyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user, userLoading } = useCurrentUser();
  const role = user?.role;

  const { request: authenticatedRequest } = useApi();

  const [verificationStatus, setVerificationStatus] = useState(null);
  const [hospitalLoading, setHospitalLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/blood-requests/active");

      const data = response.data;
      const activeRequests = Array.isArray(data)
        ? data
        : data.bloodRequests || [];

      setRequests(activeRequests);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load blood requests. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Not specified";

    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  useEffect(() => {
    if (userLoading || role !== "hospital") return;

    const fetchHospitalStatus = async () => {
      setHospitalLoading(true);

      try {
        const response = await authenticatedRequest({
          method: "GET",
          url: "/api/hospitals/profile",
        });

        const hospital = response.data.hospital || response.data;

        setVerificationStatus(hospital?.verificationStatus || "pending");
      } catch (err) {
        if (err.response?.status === 404) {
          setVerificationStatus("not-registered");
        } else {
          console.error("Hospital Profile Error:", err);
          setVerificationStatus("unknown");
        }
      } finally {
        setHospitalLoading(false);
      }
    };

    fetchHospitalStatus();
  }, [userLoading, role, authenticatedRequest]);

  const getUrgencyStyle = (urgency) => {
    switch (urgency) {
      case "critical":
        return "bg-rose-100 text-rose-800 ring-rose-200";
      case "urgent":
        return "bg-orange-100 text-orange-700 ring-orange-200";
      default:
        return "bg-gray-100 text-gray-700 ring-gray-200";
    }
  };

  const getUrgencyAccent = (urgency) => {
    switch (urgency) {
      case "critical":
        return "from-[#BE4565] to-[#96334F]";
      case "urgent":
        return "from-orange-400 to-orange-500";
      default:
        return "from-rose-200 to-rose-300";
    }
  };

  const roleMessage = () => {
    if (userLoading || hospitalLoading) return null;

    if (!user) {
      return "You can explore publicly available emergency blood requests.";
    }

    switch (role) {
      case "donor":
        return "Explore active blood requests and keep your donor profile and availability updated.";

      case "hospital":
        if (verificationStatus === "verified") {
          return "Your hospital is verified. Manage your blood requests through your hospital dashboard.";
        }

        if (verificationStatus === "pending") {
          return "Your hospital registration is awaiting verification. You can view public emergency requests while you wait.";
        }

        if (verificationStatus === "rejected") {
          return "Your hospital registration was rejected. Visit your dashboard to review its status.";
        }

        if (verificationStatus === "not-registered") {
          return "Your hospital profile is not registered yet. Register to access hospital features after verification.";
        }

        return "Visit your hospital dashboard to check your registration status.";

      case "admin":
        return "Monitor public emergency requests and use your admin dashboard for platform management.";

      default:
        return null;
    }
  };

  const getCTA = () => {
    if (userLoading || hospitalLoading) return null;

    if (!user) {
      return {
        heading: "Want to Help Someone in Need?",
        description: "Sign in to access your DonorNexa account.",
        text: null,
        link: null,
      };
    }

    if (role === "donor") {
      return {
        heading: "Your Donation Can Save a Life",
        description: "Manage your donor profile and update your availability.",
        text: "Donor Dashboard",
        link: "/donor/dashboard",
      };
    }

    if (role === "hospital") {
      return {
        heading: "Hospital Request Management",
        description:
          verificationStatus === "verified"
            ? "Manage your hospital's blood requests and find compatible donors."
            : "Visit your hospital dashboard to manage your registration and verification status.",
        text: "Hospital Dashboard",
        link: "/hospital/dashboard",
      };
    }

    if (role === "admin") {
      return {
        heading: "Platform Administration",
        description:
          "Monitor and manage DonorNexa through your admin dashboard.",
        text: "Admin Dashboard",
        link: "/admin/dashboard",
      };
    }

    return null;
  };

  const cta = getCTA();

  return (
    <div className="min-h-screen bg-[#FFF8FA]">
      {/* Page Header */}
      <section className="relative overflow-hidden border-b border-rose-100 bg-gradient-to-b from-[#FFF3F6] to-[#FFF8FA] px-6 pb-14 pt-32 md:pt-40">
        <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-full bg-[#FCE7ED] blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold tracking-wide text-[#96334F] shadow-sm shadow-rose-200/40 ring-1 ring-rose-200/40 backdrop-blur-md">
            <AlertCircle size={18} className="text-[#BE4565]" />
            BLOOD REQUESTS
          </span>

          <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#29232A] sm:text-5xl">
                Emergency
                <span className="block bg-gradient-to-r from-[#BE4565] to-[#96334F] bg-clip-text text-transparent mt-3">
                  Blood Requests
                </span>
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-gray-600">
                Explore active blood requests submitted by hospitals. Your
                availability may help someone in need.
              </p>
            </div>

            <button
              onClick={fetchRequests}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-white bg-white/80 px-6 py-3 font-semibold text-[#96334F] shadow-md shadow-rose-200/50 ring-1 ring-rose-200/40 backdrop-blur-md transition duration-200 hover:bg-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:self-auto"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Requests */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        {roleMessage() && (
          <div className="mb-8 rounded-2xl border border-rose-200 bg-gradient-to-r from-white to-[#FFF3F6] p-5 shadow-sm">
            <p className="leading-7 text-gray-700">{roleMessage()}</p>

            {role === "hospital" && (
              <Link
                to="/hospital/dashboard"
                className="mt-3 inline-flex items-center gap-2 font-semibold text-[#BE4565] hover:text-[#96334F]"
              >
                Visit Hospital Dashboard
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        )}

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#29232A]">Active Requests</h2>

          <span className="rounded-full border border-white bg-[#FCE7ED] px-4 py-2 text-sm font-semibold text-[#96334F] shadow-sm ring-1 ring-rose-200/50">
            {requests.length} {requests.length === 1 ? "Request" : "Requests"}
          </span>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-3xl border border-rose-100 bg-white p-6 shadow-sm"
              >
                <div className="flex justify-between">
                  <div className="h-14 w-14 rounded-2xl bg-rose-100" />
                  <div className="h-7 w-20 rounded-full bg-rose-50" />
                </div>
                <div className="mt-6 h-5 w-2/3 rounded bg-gray-100" />
                <div className="mt-6 h-4 w-full rounded bg-gray-100" />
                <div className="mt-3 h-4 w-3/4 rounded bg-gray-100" />
                <div className="mt-3 h-4 w-1/2 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-gradient-to-b from-white to-[#FFF3F6] px-6 py-14 text-center shadow-lg shadow-rose-100/60">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FCE7ED] text-[#BE4565]">
              <AlertCircle size={34} />
            </div>
            <p className="mx-auto mt-5 max-w-md font-medium text-gray-700">
              {error}
            </p>

            <button
              onClick={fetchRequests}
              className="mt-6 rounded-full bg-gradient-to-r from-[#BE4565] to-[#A83A58] px-7 py-3 font-semibold text-white shadow-lg shadow-rose-400/30 transition duration-200 hover:from-[#A83A58] hover:to-[#96334F] hover:shadow-rose-400/50"
            >
              Try Again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl border border-rose-100 bg-gradient-to-b from-white to-[#FFF3F6] px-6 py-16 text-center shadow-lg shadow-rose-100/50">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FCE7ED] ring-8 ring-white">
              <Droplet size={38} className="text-[#BE4565]" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-[#29232A]">
              No Active Requests
            </h3>
            <p className="mx-auto mt-2 max-w-md text-gray-600">
              There are currently no active blood requests. Please check again
              later.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <div
                key={request._id}
                className="group relative overflow-hidden rounded-3xl border border-rose-100 bg-white p-6 pt-7 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-rose-200 hover:shadow-2xl hover:shadow-rose-200/60"
              >
                {/* Urgency accent bar */}
                <div
                  className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${getUrgencyAccent(request.urgency)}`}
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 shadow-inner shadow-white/70 ring-1 ring-white/70 transition duration-300 group-hover:from-[#BE4565] group-hover:to-[#96334F]">
                    <span className="text-2xl font-bold text-[#96334F] transition group-hover:text-white">
                      {request.bloodGroup}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ${getUrgencyStyle(request.urgency)}`}
                  >
                    {request.urgency || "Normal"}
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-bold text-[#29232A]">
                  {request.hospital?.hospitalName || "Hospital Request"}
                </h3>

                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FCE7ED]">
                      <Droplet size={16} className="text-[#BE4565]" />
                    </span>
                    <span>
                      {request.unitsRequired}{" "}
                      {request.unitsRequired === 1 ? "unit" : "units"} required
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FCE7ED]">
                      <MapPin size={16} className="text-[#BE4565]" />
                    </span>
                    <span>{request.city}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FCE7ED]">
                      <CalendarDays size={16} className="text-[#BE4565]" />
                    </span>
                    <span>Required by: {formatDate(request.requiredBy)}</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-rose-100 pt-4">
                  <p className="truncate text-xs text-gray-400">
                    Request ID: {request._id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Role-Based CTA */}
      {cta && (
        <section className="px-6 pb-8">
          <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#96334F] to-[#7A2840] px-8 py-12 text-center text-white shadow-2xl shadow-rose-300/40 md:flex-row md:px-12 md:text-left">
            <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-rose-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#BE4565]/40 blur-3xl" />

            <div className="relative flex flex-col items-center gap-4 md:flex-row">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                <HeartHandshake size={34} />
              </span>

              <div>
                <h2 className="text-2xl font-bold">{cta.heading}</h2>
                <p className="mt-2 text-rose-100">{cta.description}</p>
              </div>
            </div>

            {cta.link && (
              <Link
                to={cta.link}
                className="relative inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-[#96334F] shadow-lg shadow-black/10 transition duration-200 hover:bg-rose-50 hover:shadow-xl"
              >
                {cta.text}
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default EmergencyRequests;
