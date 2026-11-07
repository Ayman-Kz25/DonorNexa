import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  Building2,
  MapPin,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Users,
  Heart,
  Activity,
  Ban,
  ClipboardList,
} from "lucide-react";

import { useApi } from "../hooks/useApi";
import UserManagement from "../components/admin/UserManagement";
import CitiesManagement from "../components/admin/CitiesManagement";
import AuditLogs from "../components/admin/AuditLogs.jsx";

function AdminDashboard() {
  const { request } = useApi();

  // Hospital verification states
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const [selectedHospital, setSelectedHospital] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Dashboard overview states
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalHospitals: 0,
    pendingHospitals: 0,
    verifiedHospitals: 0,
    activeRequests: 0,
    fulfilledRequests: 0,
    blockedUsers: 0,
  });

  const [overviewLoading, setOverviewLoading] = useState(true);

  // Dashboard statistics
  const stats = [
    {
      title: "Total Users",
      value: overview.totalUsers,
      icon: Users,
    },
    {
      title: "Total Donors",
      value: overview.totalDonors,
      icon: Heart,
    },
    {
      title: "Registered Hospitals",
      value: overview.totalHospitals,
      icon: Building2,
    },
    {
      title: "Pending Hospitals",
      value: overview.pendingHospitals,
      icon: Clock,
    },
    {
      title: "Verified Hospitals",
      value: overview.verifiedHospitals,
      icon: CheckCircle,
    },
    {
      title: "Active Requests",
      value: overview.activeRequests,
      icon: Activity,
    },
    {
      title: "Fulfilled Requests",
      value: overview.fulfilledRequests,
      icon: ClipboardList,
    },
    {
      title: "Blocked Users",
      value: overview.blockedUsers,
      icon: Ban,
    },
  ];

  const detailIconClass =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE7ED] text-[#BE4565]";

  // Fetch dashboard statistics
  const fetchOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);

      const response = await request({
        method: "GET",
        url: "/api/admin/overview",
      });

      setOverview(response.data.overview);
    } catch (err) {
      console.error("Unable to load admin overview:", err);
      setError(
        err.response?.data?.message || "Unable to load dashboard statistics.",
      );
    } finally {
      setOverviewLoading(false);
    }
  }, [request]);

  // Fetch pending hospital registrations
  const fetchHospitals = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/hospitals/pending",
      });

      setHospitals(
        response.data.hospitals || response.data.pendingHospitals || [],
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load pending hospital registrations.",
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  // Load dashboard data
  useEffect(() => {
    fetchHospitals();
    fetchOverview();
  }, [fetchHospitals, fetchOverview]);

  // Refresh all dashboard data
  const handleRefresh = () => {
    setError("");
    setSuccess("");
    fetchHospitals();
    fetchOverview();
  };

  // Approve hospital
  const handleApprove = async (hospitalId) => {
    setProcessingId(hospitalId);
    setError("");
    setSuccess("");

    try {
      const response = await request({
        method: "PATCH",
        url: `/api/hospitals/${hospitalId}/approve`,
      });

      setSuccess(response.data.message || "Hospital approved successfully.");

      setHospitals((previous) =>
        previous.filter((hospital) => hospital._id !== hospitalId),
      );

      fetchOverview();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to approve this hospital.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Reject hospital
  const handleReject = async (e) => {
    e.preventDefault();

    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }

    setProcessingId(selectedHospital._id);
    setError("");
    setSuccess("");

    try {
      const response = await request({
        method: "PATCH",
        url: `/api/hospitals/${selectedHospital._id}/reject`,
        data: {
          rejectionReason: rejectionReason.trim(),
        },
      });

      setSuccess(response.data.message || "Hospital rejected successfully.");

      setHospitals((previous) =>
        previous.filter((hospital) => hospital._id !== selectedHospital._id),
      );

      setSelectedHospital(null);
      setRejectionReason("");

      fetchOverview();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to reject this hospital.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8FA]">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-rose-100 bg-gradient-to-b from-[#FFF3F6] to-[#FFF8FA] px-6 pb-12 pt-32 md:pt-36">
        <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />

        <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-[#FCE7ED] blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold tracking-wide text-[#96334F] shadow-sm shadow-rose-200/40 ring-1 ring-rose-200/40 backdrop-blur-md">
            <ShieldCheck size={18} className="text-[#BE4565]" />
            ADMIN PORTAL
          </span>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#29232A] sm:text-4xl lg:text-5xl">
            Admin{" "}
            <span className="bg-gradient-to-r from-[#BE4565] to-[#96334F] bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Monitor platform activity, manage users, and review hospital
            registrations.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-[#96334F] shadow-sm"
          >
            <AlertCircle size={20} className="shrink-0 text-[#BE4565]" />
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-[#FCE7ED] p-4 text-sm font-medium text-[#96334F] shadow-sm"
          >
            <CheckCircle2 size={20} className="shrink-0 text-[#BE4565]" />
            {success}
          </div>
        )}

        {/* Dashboard Overview */}
        <section>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-[#29232A]">
                Platform Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Live statistics from your DonorNexa database.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading || overviewLoading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#96334F] shadow-sm transition hover:bg-[#FCE7ED] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading || overviewLoading ? "animate-spin" : ""}
              />
              Refresh Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="flex items-center gap-4 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-[#FCE7ED] text-[#BE4565]">
                    <Icon size={24} />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>

                    <h3 className="mt-1 text-2xl font-bold text-[#96334F]">
                      {overviewLoading ? "..." : stat.value}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Hospital Verification */}
        <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm shadow-rose-100/50 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-[#29232A]">
                Hospital Verification
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Review submitted hospital details before approval.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading || overviewLoading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#96334F] shadow-sm transition hover:border-[#BE4565] hover:bg-[#FCE7ED] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="mt-8 space-y-5">
            {loading ? (
              [1, 2].map((item) => (
                <div
                  key={item}
                  className="h-48 animate-pulse rounded-2xl border border-rose-100 bg-rose-50"
                />
              ))
            ) : hospitals.length === 0 ? (
              <div className="rounded-2xl border border-rose-100 bg-gradient-to-b from-[#FFF8FA] to-[#FFF3F6] px-5 py-14 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FCE7ED] ring-8 ring-white">
                  <CheckCircle size={38} className="text-[#BE4565]" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#29232A]">
                  All Caught Up!
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  There are no pending hospital registrations.
                </p>
              </div>
            ) : (
              hospitals.map((hospital) => (
                <div
                  key={hospital._id}
                  className="relative overflow-hidden rounded-2xl border border-rose-100 bg-white p-6 pl-7 transition duration-300 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-100/70"
                >
                  <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-300 to-amber-400" />

                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-[#BE4565] shadow-inner shadow-white/70 ring-1 ring-white/70">
                          <Building2 size={24} />
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-[#29232A]">
                            {hospital.hospitalName}
                          </h3>

                          <span className="text-xs font-medium text-[#96334F]">
                            Pending Verification
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-2 self-start rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                      <Clock size={14} />
                      Pending
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-rose-100 pt-5 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-2xl bg-[#FFF8FA] p-3.5">
                      <span className={detailIconClass}>
                        <FileText size={19} />
                      </span>

                      <div>
                        <p className="text-xs text-gray-500">License Number</p>
                        <p className="text-sm font-medium">
                          {hospital.licenseNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-[#FFF8FA] p-3.5">
                      <span className={detailIconClass}>
                        <User size={19} />
                      </span>

                      <div>
                        <p className="text-xs text-gray-500">Contact Person</p>
                        <p className="text-sm font-medium">
                          {hospital.contactPerson}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-[#FFF8FA] p-3.5">
                      <span className={detailIconClass}>
                        <MapPin size={19} />
                      </span>

                      <div>
                        <p className="text-xs text-gray-500">City</p>
                        <p className="text-sm font-medium">{hospital.city}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-[#FFF8FA] p-3.5">
                      <span className={detailIconClass}>
                        <Building2 size={19} />
                      </span>

                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-medium">
                          {hospital.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-rose-100 pt-5">
                    <button
                      onClick={() => handleApprove(hospital._id)}
                      disabled={processingId === hospital._id}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#BE4565] to-[#A83A58] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-400/30 transition hover:from-[#A83A58] hover:to-[#96334F] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingId === hospital._id ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <CheckCircle size={17} />
                      )}

                      {processingId === hospital._id
                        ? "Processing..."
                        : "Approve"}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedHospital(hospital);
                        setRejectionReason("");
                        setError("");
                      }}
                      disabled={processingId === hospital._id}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-6 py-2.5 text-sm font-semibold text-[#96334F] shadow-sm transition hover:border-[#BE4565] hover:bg-[#FCE7ED] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle size={17} />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <UserManagement />
        <CitiesManagement />
        <AuditLogs />
      </main>

      {/* Hospital Rejection Modal */}
      {selectedHospital && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#29232A]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white bg-white p-6 shadow-2xl shadow-rose-300/40 ring-1 ring-rose-200/40 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FCE7ED] text-[#BE4565]">
                  <XCircle size={22} />
                </span>

                <h2 className="text-xl font-bold text-[#29232A]">
                  Reject Registration
                </h2>
              </div>

              <button
                onClick={() => setSelectedHospital(null)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-rose-50 hover:text-[#96334F]"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-gray-600">
              Provide a reason for rejecting{" "}
              <strong className="text-[#96334F]">
                {selectedHospital.hospitalName}
              </strong>
              .
            </p>

            <form onSubmit={handleReject} className="mt-5 space-y-5">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
                placeholder="Enter rejection reason..."
                className="w-full rounded-xl border border-rose-200 bg-[#FFF8FA] px-4 py-3 text-sm text-[#29232A] outline-none transition placeholder:text-gray-400 hover:border-rose-300 focus:border-[#BE4565] focus:bg-white focus:ring-4 focus:ring-rose-100"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedHospital(null)}
                  className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    processingId === selectedHospital._id ||
                    !rejectionReason.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#BE4565] to-[#A83A58] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-400/30 transition hover:from-[#A83A58] hover:to-[#96334F] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingId === selectedHospital._id && (
                    <Loader2 size={16} className="animate-spin" />
                  )}

                  {processingId === selectedHospital._id
                    ? "Rejecting..."
                    : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
