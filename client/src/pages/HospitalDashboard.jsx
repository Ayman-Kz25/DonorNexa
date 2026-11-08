import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  FileText,
  MapPin,
  User,
  Users,
  ShieldCheck,
  Clock,
  AlertCircle,
  Plus,
  Minus,
  Droplet,
  CalendarDays,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  ClipboardList,
  ChevronDown,
  HeartHandshake,
  Medal,
  Loader2,
} from "lucide-react";
import { useApi } from "../hooks/useApi";
import HospitalRegistrationForm from "../components/hospital/HospitalRegistrationForm";
import HospitalMatchResponses from "../components/hospital/HospitalMatchResponses";

const initialForm = {
  bloodGroup: "",
  unitsRequired: 1,
  urgency: "normal",
  requiredBy: "",
  hospitalNotes: "",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const URGENCY_OPTIONS = [
  {
    value: "normal",
    label: "Normal",
    active:
      "border-transparent bg-gradient-to-br from-rose-300 to-rose-400 text-white shadow-lg shadow-rose-200/60",
  },
  {
    value: "urgent",
    label: "Urgent",
    active:
      "border-transparent bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-200/60",
  },
  {
    value: "critical",
    label: "Critical",
    active:
      "border-transparent bg-gradient-to-br from-[#BE4565] to-[#96334F] text-white shadow-lg shadow-rose-300/60",
  },
];

function HospitalDashboard() {
  const { request } = useApi();

  const [hospital, setHospital] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notRegistered, setNotRegistered] = useState(false);
  const [filter, setFilter] = useState("all");

  const [matchingRequestId, setMatchingRequestId] = useState(null);
  const [matchingResults, setMatchingResults] = useState({});
  const [matchingLoading, setMatchingLoading] = useState({});
  const [matchingErrors, setMatchingErrors] = useState({});

  const inputClass =
    "w-full rounded-xl border border-rose-200 bg-[#FFF8FA] px-4 py-3 text-sm text-[#29232A] outline-none transition duration-200 placeholder:text-gray-400 hover:border-rose-300 focus:border-[#BE4565] focus:bg-white focus:ring-4 focus:ring-rose-100";

  const labelClass = "mb-2 block text-sm font-semibold text-[#29232A]";

  const primaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#BE4565] to-[#A83A58] px-7 py-3 font-semibold text-white shadow-lg shadow-rose-400/30 transition duration-200 hover:-translate-y-0.5 hover:from-[#A83A58] hover:to-[#96334F] hover:shadow-rose-400/50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";

  const secondaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#96334F] shadow-sm transition duration-200 hover:border-[#BE4565] hover:bg-[#FCE7ED]";

  const cardClass =
    "rounded-3xl border border-rose-100 bg-white p-6 shadow-sm shadow-rose-100/50 sm:p-8";

  const fetchRequests = useCallback(async () => {
    try {
      const response = await request({
        method: "GET",
        url: "/api/blood-requests/my-requests",
      });

      setRequests(response.data.requests || response.data.bloodRequests || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load blood requests.");
    }
  }, [request]);

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const response = await request({
          method: "GET",
          url: "/api/hospitals/profile",
        });

        const data = response.data.hospital || response.data;
        setHospital(data);

        if (data.verificationStatus === "verified") {
          await fetchRequests();
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setHospital(null);
          setNotRegistered(true);
          setError("");
          return;
        }

        setError(
          error.response?.data?.message || "Unable to load hospital data.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHospital();
  }, [request, fetchRequests]);

  const handleRequestChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await request({
        method: "POST",
        url: "/api/blood-requests",
        data: {
          ...formData,
          unitsRequired: Number(formData.unitsRequired),
          requiredBy: new Date(formData.requiredBy).toISOString(),
        },
      });

      setSuccess(
        response.data.message || "Blood request created successfully.",
      );
      setFormData(initialForm);
      setShowForm(false);
      await fetchRequests();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create blood request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this blood request?",
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await request({
        method: "PATCH",
        url: `/api/blood-requests/${id}/cancel`,
      });

      setSuccess(response.data.message || "Request cancelled.");
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to cancel this request.");
    }
  };

  const handleFulfillRequest = async (id) => {
    const confirmed = window.confirm(
      "Are you sure this blood request has been fulfilled?",
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await request({
        method: "PATCH",
        url: `/api/blood-requests/${id}/fulfill`,
      });

      setSuccess(response.data.message || "Blood request marked as fulfilled.");

      await fetchRequests();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to mark this request as fulfilled.",
      );
    }
  };

  const handleFindMatchingDonors = async (requestId) => {
    if (matchingRequestId === requestId) {
      setMatchingRequestId(null);
      return;
    }

    setMatchingRequestId(requestId);

    setMatchingLoading((prev) => ({
      ...prev,
      [requestId]: true,
    }));

    setMatchingErrors((prev) => ({
      ...prev,
      [requestId]: "",
    }));

    try {
      const response = await request({
        method: "GET",
        url: `/api/blood-requests/${requestId}/matches`,
      });

      setMatchingResults((prev) => ({
        ...prev,
        [requestId]: response.data.donors || [],
      }));
    } catch (error) {
      setMatchingErrors((prev) => ({
        ...prev,
        [requestId]:
          error.response?.data?.message || "Unable to find matching donors.",
      }));
    } finally {
      setMatchingLoading((prev) => ({
        ...prev,
        [requestId]: false,
      }));
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not specified";

    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Display-only helper: how much time is left for an open request
  const getTimeLeft = (item) => {
    if (item.status !== "open" || !item.requiredBy) return null;

    const diff = new Date(item.requiredBy).getTime() - Date.now();

    if (Number.isNaN(diff)) return null;
    if (diff < 0) return { label: "Overdue", tone: "late" };

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return { label: `Due in ${Math.max(minutes, 1)} min`, tone: "soon" };
    }
    if (hours < 24) return { label: `Due in ${hours} h`, tone: "soon" };

    return {
      label: `Due in ${days} ${days === 1 ? "day" : "days"}`,
      tone: "ok",
    };
  };

  // A request is expired when the server says so, or when it is still "open"
  // but its required-by time has already passed
  const isExpired = (item) =>
    item.status === "expired" ||
    (item.status === "open" &&
      Boolean(item.requiredBy) &&
      new Date(item.requiredBy).getTime() < Date.now());

  const getDisplayStatus = (item) =>
    isExpired(item) ? "expired" : item.status;

  const timeLeftStyle = (tone) => {
    switch (tone) {
      case "late":
        return "bg-red-50 text-red-700 ring-red-200";
      case "soon":
        return "bg-amber-50 text-amber-700 ring-amber-200";
      default:
        return "bg-[#FCE7ED] text-[#96334F] ring-rose-200";
    }
  };

  const statusStyle = (status) => {
    switch (status) {
      case "fulfilled":
        return "bg-rose-100 text-[#96334F] ring-rose-200";
      case "cancelled":
      case "expired":
        return "bg-gray-100 text-gray-600 ring-gray-200";
      default:
        return "bg-[#FCE7ED] text-[#96334F] ring-rose-200";
    }
  };

  const verificationStyle = (status) => {
    switch (status) {
      case "verified":
        return "bg-[#FCE7ED] text-[#96334F] ring-rose-200";
      case "rejected":
        return "bg-red-50 text-red-700 ring-red-200";
      default:
        return "bg-amber-50 text-amber-700 ring-amber-200";
    }
  };

  const urgencyAccent = (urgency) => {
    switch (urgency) {
      case "critical":
        return "from-[#BE4565] to-[#96334F]";
      case "urgent":
        return "from-orange-400 to-orange-500";
      default:
        return "from-rose-200 to-rose-300";
    }
  };

  // Display-only: rank badge colours (top donor stands out)
  const rankStyle = (rank) => {
    if (rank === 1) {
      return "bg-gradient-to-r from-[#BE4565] to-[#96334F] text-white shadow-md shadow-rose-300/50";
    }
    if (rank <= 3) {
      return "bg-[#FCE7ED] text-[#96334F] ring-1 ring-rose-200";
    }
    return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  };

  // Derived numbers for the summary cards and filter tabs
  const openCount = requests.filter(
    (item) => getDisplayStatus(item) === "open",
  ).length;
  const fulfilledCount = requests.filter(
    (item) => getDisplayStatus(item) === "fulfilled",
  ).length;
  const closedCount = requests.filter((item) => {
    const status = getDisplayStatus(item);
    return status === "cancelled" || status === "expired";
  }).length;

  const stats = [
    { icon: ClipboardList, label: "Total Requests", value: requests.length },
    { icon: Clock, label: "Open", value: openCount },
    { icon: CheckCircle2, label: "Fulfilled", value: fulfilledCount },
    { icon: XCircle, label: "Cancelled / Expired", value: closedCount },
  ];

  const filters = [
    { key: "all", label: "All", count: requests.length },
    { key: "open", label: "Open", count: openCount },
    { key: "fulfilled", label: "Fulfilled", count: fulfilledCount },
    { key: "closed", label: "Closed", count: closedCount },
  ];

  const filteredRequests = requests.filter((item) => {
    const status = getDisplayStatus(item);

    if (filter === "all") return true;
    if (filter === "closed") {
      return status === "cancelled" || status === "expired";
    }
    return status === filter;
  });

  if (loading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center gap-3 bg-[#FFF8FA] pt-24 text-[#96334F]"
        role="status"
      >
        <Loader2 size={22} className="animate-spin text-[#BE4565]" />
        <span className="font-medium">Loading hospital dashboard...</span>
      </div>
    );
  }

  // Verification progress for the stepper
  const verification = hospital?.verificationStatus;
  const isVerified = verification === "verified";
  const isRejected = verification === "rejected";

  const progressSteps = [
    { label: "Submitted", state: "done" },
    {
      label: isVerified || isRejected ? "Reviewed" : "Under Review",
      state: isVerified || isRejected ? "done" : "current",
    },
    {
      label: isRejected ? "Rejected" : "Verified",
      state: isVerified ? "done" : isRejected ? "rejected" : "upcoming",
    },
  ];

  const getLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-[#FFF8FA]">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-rose-100 bg-gradient-to-b from-[#FFF3F6] to-[#FFF8FA] px-6 pb-12 pt-32 md:pt-36">
        <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-[#FCE7ED] blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold tracking-wide text-[#96334F] shadow-sm shadow-rose-200/40 ring-1 ring-rose-200/40 backdrop-blur-md">
            <Building2 size={16} className="text-[#BE4565]" />
            HOSPITAL PORTAL
          </span>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#29232A] sm:text-4xl lg:text-5xl">
            Hospital{" "}
            <span className="bg-gradient-to-r from-[#BE4565] to-[#96334F] bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Manage your hospital registration and blood requests.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-[#96334F] shadow-sm"
          >
            <AlertCircle size={20} className="shrink-0 text-[#BE4565]" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss message"
              className="rounded-full p-1.5 text-[#BE4565] transition hover:bg-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-[#FCE7ED] p-4 text-sm font-medium text-[#96334F] shadow-sm"
          >
            <CheckCircle2 size={20} className="shrink-0 text-[#BE4565]" />
            <span className="flex-1">{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss message"
              className="rounded-full p-1.5 text-[#BE4565] transition hover:bg-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Registration */}
        {notRegistered ? (
          <HospitalRegistrationForm
            onRegistered={(registeredHospital) => {
              setHospital(registeredHospital);
              setNotRegistered(false);
            }}
          />
        ) : hospital ? (
          <>
            {/* Hospital Information */}
            <section className={cardClass}>
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-[#BE4565] shadow-inner shadow-white/70 ring-1 ring-white/70">
                    <Building2 size={28} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">
                      {hospital.hospitalName}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Hospital Registration
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold capitalize ring-1 sm:self-auto ${verificationStyle(hospital.verificationStatus)}`}
                >
                  {isVerified && <ShieldCheck size={16} />}
                  {hospital.verificationStatus}
                </span>
              </div>

              {/* Verification progress */}
              <div className="mt-7 rounded-2xl bg-[#FFF8FA] p-5 ring-1 ring-rose-100">
                <p className="mb-5 text-xs font-semibold tracking-wide text-gray-500">
                  VERIFICATION PROGRESS
                </p>

                <ol className="flex items-start">
                  {progressSteps.map((step, index) => (
                    <li
                      key={step.label}
                      className="relative flex flex-1 flex-col items-center text-center"
                    >
                      {index > 0 && (
                        <span
                          className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                            step.state === "upcoming"
                              ? "bg-rose-100"
                              : step.state === "rejected"
                                ? "bg-red-300"
                                : "bg-gradient-to-r from-[#BE4565] to-[#96334F]"
                          }`}
                        />
                      )}

                      <span
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          step.state === "done"
                            ? "bg-gradient-to-br from-[#BE4565] to-[#96334F] text-white shadow-md shadow-rose-300/50"
                            : step.state === "current"
                              ? "animate-pulse bg-amber-100 text-amber-700 ring-4 ring-amber-50"
                              : step.state === "rejected"
                                ? "bg-red-500 text-white shadow-md shadow-red-200"
                                : "bg-white text-gray-400 ring-2 ring-rose-100"
                        }`}
                      >
                        {step.state === "done" ? (
                          <CheckCircle2 size={18} />
                        ) : step.state === "current" ? (
                          <Clock size={16} />
                        ) : step.state === "rejected" ? (
                          <X size={16} />
                        ) : (
                          index + 1
                        )}
                      </span>

                      <span
                        className={`mt-2 text-xs font-semibold ${
                          step.state === "upcoming"
                            ? "text-gray-400"
                            : step.state === "rejected"
                              ? "text-red-600"
                              : "text-[#96334F]"
                        }`}
                      >
                        {step.label}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-6 grid gap-4 border-t border-rose-100 pt-6 sm:grid-cols-2">
                {[
                  {
                    icon: FileText,
                    label: "License Number",
                    value: hospital.licenseNumber,
                  },
                  {
                    icon: User,
                    label: "Contact Person",
                    value: hospital.contactPerson,
                  },
                  { icon: MapPin, label: "City", value: hospital.city },
                  {
                    icon: Building2,
                    label: "Address",
                    value: hospital.address,
                  },
                ].map((detail) => {
                  const Icon = detail.icon;

                  return (
                    <div
                      key={detail.label}
                      className="group flex items-center gap-4 rounded-2xl bg-[#FFF8FA] p-4 ring-1 ring-transparent transition duration-200 hover:bg-white hover:shadow-md hover:shadow-rose-100/60 hover:ring-rose-100"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE7ED] text-[#BE4565] transition duration-200 group-hover:bg-[#BE4565] group-hover:text-white">
                        <Icon size={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">{detail.label}</p>
                        <p className="break-words font-medium">
                          {detail.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Pending / Rejected */}
            {hospital.verificationStatus !== "verified" && (
              <section className="rounded-3xl border border-white/80 bg-gradient-to-r from-[#FCE7ED] via-rose-50 to-[#FCE7ED] p-7 shadow-xl shadow-rose-100/60 ring-1 ring-rose-200/50 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#96334F] shadow-md shadow-rose-200/60">
                    {hospital.verificationStatus === "rejected" ? (
                      <AlertCircle />
                    ) : (
                      <Clock />
                    )}
                  </span>

                  <h3 className="text-lg font-bold text-[#96334F]">
                    {hospital.verificationStatus === "rejected"
                      ? "Registration Rejected"
                      : "Registration Under Review"}
                  </h3>
                </div>

                <p className="mt-4 text-sm leading-7 text-gray-700">
                  {hospital.verificationStatus === "rejected"
                    ? hospital.rejectionReason ||
                      "Please contact the administrator for more information."
                    : "Your registration has been submitted. You can create blood requests once an administrator verifies your hospital."}
                </p>
              </section>
            )}

            {/* Verified Hospital Features */}
            {hospital.verificationStatus === "verified" && (
              <>
                {/* Summary cards */}
                <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                      <div
                        key={stat.label}
                        className="group flex items-center gap-4 rounded-3xl border border-white/80 bg-white/80 p-5 shadow-lg shadow-rose-100/50 ring-1 ring-rose-200/40 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-200/60"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-[#BE4565] shadow-inner shadow-white/70 ring-1 ring-white/70 transition duration-300 group-hover:from-[#BE4565] group-hover:to-[#96334F] group-hover:text-white">
                          <Icon size={22} />
                        </span>

                        <div>
                          <p className="text-2xl font-bold text-[#96334F]">
                            {stat.value}
                          </p>
                          <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </section>

                {/* Create Request */}
                <section className={cardClass}>
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-xl font-bold">
                        Blood Request Management
                      </h2>
                      <p className="mt-2 text-sm text-gray-500">
                        Create and manage your hospital's blood requests.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowForm(!showForm)}
                      className={primaryButtonClass}
                    >
                      {showForm ? <X size={18} /> : <Plus size={18} />}
                      {showForm ? "Close Form" : "Create Request"}
                    </button>
                  </div>

                  {showForm && (
                    <form
                      onSubmit={handleCreateRequest}
                      className="mt-8 space-y-6 border-t border-rose-100 pt-7"
                    >
                      {/* Blood group chips */}
                      <div className="relative">
                        <span className={labelClass}>Required Blood Group</span>

                        <div
                          role="radiogroup"
                          aria-label="Required blood group"
                          className="grid grid-cols-4 gap-2 sm:grid-cols-8"
                        >
                          {BLOOD_GROUPS.map((group) => {
                            const selected = formData.bloodGroup === group;

                            return (
                              <button
                                key={group}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    bloodGroup: group,
                                  })
                                }
                                className={`flex h-12 items-center justify-center gap-1 rounded-xl border text-sm font-bold transition duration-200 ${
                                  selected
                                    ? "scale-105 border-transparent bg-gradient-to-br from-[#BE4565] to-[#96334F] text-white shadow-lg shadow-rose-300/50"
                                    : "border-rose-200 bg-[#FFF8FA] text-[#96334F] hover:-translate-y-0.5 hover:border-[#BE4565] hover:bg-[#FCE7ED] hover:shadow-md"
                                }`}
                              >
                                {selected && (
                                  <Droplet size={13} className="fill-white" />
                                )}
                                {group}
                              </button>
                            );
                          })}
                        </div>

                        {/* Keeps native "required" validation for the chips */}
                        <input
                          tabIndex={-1}
                          aria-hidden="true"
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleRequestChange}
                          required
                          className="pointer-events-none absolute bottom-0 left-1/2 h-0 w-0 opacity-0"
                        />
                      </div>

                      {/* Urgency segmented control */}
                      <div>
                        <span className={labelClass}>Urgency</span>

                        <div
                          role="radiogroup"
                          aria-label="Urgency"
                          className="grid grid-cols-3 gap-2 rounded-2xl bg-[#FFF8FA] p-1.5 ring-1 ring-rose-100"
                        >
                          {URGENCY_OPTIONS.map((option) => {
                            const selected = formData.urgency === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    urgency: option.value,
                                  })
                                }
                                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                                  selected
                                    ? option.active
                                    : "border-transparent text-gray-600 hover:bg-white hover:text-[#96334F]"
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        {/* Units stepper */}
                        <div>
                          <label
                            htmlFor="req-unitsRequired"
                            className={labelClass}
                          >
                            Units Required
                          </label>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label="Decrease units"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  unitsRequired: Math.max(
                                    1,
                                    Number(formData.unitsRequired || 1) - 1,
                                  ),
                                })
                              }
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-[#96334F] transition duration-200 hover:border-[#BE4565] hover:bg-[#FCE7ED] active:scale-95"
                            >
                              <Minus size={18} />
                            </button>

                            <input
                              id="req-unitsRequired"
                              type="number"
                              name="unitsRequired"
                              min="1"
                              value={formData.unitsRequired}
                              onChange={handleRequestChange}
                              className={`${inputClass} text-center text-base font-bold`}
                              required
                            />

                            <button
                              type="button"
                              aria-label="Increase units"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  unitsRequired:
                                    Number(formData.unitsRequired || 0) + 1,
                                })
                              }
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-[#96334F] transition duration-200 hover:border-[#BE4565] hover:bg-[#FCE7ED] active:scale-95"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="req-requiredBy"
                            className={labelClass}
                          >
                            Required By
                          </label>
                          <input
                            id="req-requiredBy"
                            type="datetime-local"
                            name="requiredBy"
                            value={formData.requiredBy}
                            onChange={handleRequestChange}
                            min={getLocalDateTime()}
                            className={`${inputClass} h-12`}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="req-hospitalNotes"
                          className={labelClass}
                        >
                          Additional Notes (Optional)
                        </label>
                        <textarea
                          id="req-hospitalNotes"
                          name="hospitalNotes"
                          value={formData.hospitalNotes}
                          onChange={handleRequestChange}
                          className={inputClass}
                          rows={3}
                          placeholder="Add any relevant request information..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className={primaryButtonClass}
                      >
                        {submitting && (
                          <Loader2 size={18} className="animate-spin" />
                        )}
                        {submitting ? "Creating..." : "Create Blood Request"}
                      </button>
                    </form>
                  )}
                </section>

                {/* My Requests */}
                <section className={cardClass}>
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-xl font-bold">My Blood Requests</h2>
                      <p className="mt-2 text-sm text-gray-500">
                        View and manage requests submitted by your hospital.
                      </p>
                    </div>

                    <button
                      onClick={fetchRequests}
                      className={`${secondaryButtonClass} self-start`}
                    >
                      <RefreshCw size={16} />
                      Refresh
                    </button>
                  </div>

                  {/* Filter tabs */}
                  {requests.length > 0 && (
                    <div
                      role="tablist"
                      aria-label="Filter requests"
                      className="mt-6 flex flex-wrap gap-2"
                    >
                      {filters.map((tab) => {
                        const selected = filter === tab.key;

                        return (
                          <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setFilter(tab.key)}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition duration-200 ${
                              selected
                                ? "bg-gradient-to-r from-[#BE4565] to-[#96334F] text-white shadow-md shadow-rose-300/40"
                                : "border border-rose-200 bg-white text-[#96334F] hover:bg-[#FCE7ED]"
                            }`}
                          >
                            {tab.label}
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                selected
                                  ? "bg-white/25 text-white"
                                  : "bg-[#FCE7ED] text-[#96334F]"
                              }`}
                            >
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-7 space-y-4">
                    {requests.length === 0 ? (
                      <div className="rounded-2xl border border-rose-100 bg-gradient-to-b from-[#FFF8FA] to-[#FFF3F6] px-5 py-14 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FCE7ED] ring-8 ring-white">
                          <Droplet size={30} className="text-[#BE4565]" />
                        </div>
                        <h3 className="mt-5 font-bold">
                          No Blood Requests Yet
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Create your first blood request to get started.
                        </p>
                      </div>
                    ) : filteredRequests.length === 0 ? (
                      <div className="rounded-2xl border border-rose-100 bg-[#FFF8FA] px-5 py-12 text-center">
                        <p className="font-semibold text-[#96334F]">
                          No requests in this category
                        </p>
                        <button
                          type="button"
                          onClick={() => setFilter("all")}
                          className="mt-3 text-sm font-semibold text-[#BE4565] underline-offset-4 hover:underline"
                        >
                          Show all requests
                        </button>
                      </div>
                    ) : (
                      filteredRequests.map((item) => {
                        const expired = isExpired(item);
                        const displayStatus = getDisplayStatus(item);
                        const timeLeft = expired ? null : getTimeLeft(item);
                        const matchesOpen =
                          matchingRequestId === item._id && !expired;
                        const donorList = matchingResults[item._id] || [];

                        return (
                          <div
                            key={item._id}
                            className={`group relative overflow-hidden rounded-2xl border p-5 pl-6 transition duration-300 ${
                              expired
                                ? "border-gray-200 bg-gray-50/80"
                                : "border-rose-100 bg-white hover:border-rose-200 hover:shadow-xl hover:shadow-rose-100/70"
                            }`}
                          >
                            {/* Urgency accent bar */}
                            <div
                              className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${
                                expired
                                  ? "from-gray-200 to-gray-300"
                                  : urgencyAccent(item.urgency)
                              }`}
                            />

                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span
                                    className={`flex h-12 min-w-12 items-center justify-center rounded-2xl px-3 text-xl font-bold ring-1 ring-white/70 transition duration-300 ${
                                      expired
                                        ? "bg-gray-200 text-gray-500"
                                        : "bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-[#96334F] group-hover:from-[#BE4565] group-hover:to-[#96334F] group-hover:text-white"
                                    }`}
                                  >
                                    {item.bloodGroup}
                                  </span>

                                  <span
                                    className={`text-lg font-bold ${
                                      expired ? "text-gray-500" : ""
                                    }`}
                                  >
                                    {item.unitsRequired}{" "}
                                    {item.unitsRequired === 1
                                      ? "Unit"
                                      : "Units"}
                                  </span>

                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${statusStyle(displayStatus)}`}
                                  >
                                    {displayStatus}
                                  </span>

                                  {timeLeft && (
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${timeLeftStyle(timeLeft.tone)}`}
                                    >
                                      <Clock size={12} />
                                      {timeLeft.label}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-4 space-y-2 text-sm text-gray-600">
                                  <p>
                                    <span className="font-medium">
                                      Urgency:
                                    </span>{" "}
                                    <span className="capitalize">
                                      {item.urgency}
                                    </span>
                                  </p>

                                  <p className="flex items-center gap-2">
                                    <CalendarDays
                                      size={16}
                                      className="text-[#BE4565]"
                                    />
                                    {expired ? "Expired on" : "Required by"}:{" "}
                                    {formatDate(item.requiredBy)}
                                  </p>

                                  <p className="flex items-center gap-2">
                                    <MapPin
                                      size={16}
                                      className="text-[#BE4565]"
                                    />
                                    {item.city}
                                  </p>
                                </div>
                              </div>

                              {expired ? (
                                <span className="inline-flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-500">
                                  <Clock size={15} />
                                  Inactive
                                </span>
                              ) : (
                                item.status === "open" && (
                                  <div className="flex flex-col items-stretch gap-3 sm:min-w-52">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleFindMatchingDonors(item._id)
                                      }
                                      aria-expanded={matchesOpen}
                                      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 ${
                                        matchesOpen
                                          ? "bg-gradient-to-r from-[#BE4565] to-[#96334F] text-white shadow-lg shadow-rose-300/40"
                                          : "border border-rose-200 bg-[#FCE7ED] text-[#96334F] hover:-translate-y-0.5 hover:border-[#BE4565] hover:shadow-md hover:shadow-rose-200/60"
                                      }`}
                                    >
                                      {matchingLoading[item._id] ? (
                                        <Loader2
                                          size={16}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <Users size={16} />
                                      )}
                                      {matchesOpen
                                        ? "Hide Matching Donors"
                                        : "Find Matching Donors"}
                                      <ChevronDown
                                        size={16}
                                        className={`transition-transform duration-300 ${
                                          matchesOpen ? "rotate-180" : ""
                                        }`}
                                      />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleFulfillRequest(item._id)
                                      }
                                      className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-[#FCE7ED] px-5 py-2.5 text-sm font-semibold text-[#96334F] transition duration-200 hover:border-[#BE4565] hover:bg-rose-100"
                                    >
                                      <CheckCircle2 size={16} />
                                      Mark as Fulfilled
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleCancelRequest(item._id)
                                      }
                                      className="rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#96334F] transition duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                    >
                                      Cancel Request
                                    </button>
                                  </div>
                                )
                              )}
                            </div>

                            <HospitalMatchResponses requestId={item._id} />

                            {matchesOpen && (
                              <div className="mt-5 rounded-2xl border border-rose-100 bg-gradient-to-b from-[#FFF8FA] to-[#FFF3F6] p-5">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                  <h3 className="flex items-center gap-2 font-bold text-[#29232A]">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FCE7ED] text-[#BE4565]">
                                      <Users size={16} />
                                    </span>
                                    Matching Donors
                                  </h3>

                                  {!matchingLoading[item._id] &&
                                    !matchingErrors[item._id] &&
                                    donorList.length > 0 && (
                                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#96334F] ring-1 ring-rose-200">
                                        {donorList.length}{" "}
                                        {donorList.length === 1
                                          ? "donor"
                                          : "donors"}
                                      </span>
                                    )}
                                </div>

                                {matchingLoading[item._id] ? (
                                  <div
                                    className="space-y-3"
                                    role="status"
                                    aria-label="Finding compatible donors"
                                  >
                                    <p className="flex items-center gap-2 text-sm font-medium text-[#96334F]">
                                      <Loader2
                                        size={16}
                                        className="animate-spin text-[#BE4565]"
                                      />
                                      Finding compatible donors...
                                    </p>
                                    {[1, 2].map((placeholder) => (
                                      <div
                                        key={placeholder}
                                        className="h-20 animate-pulse rounded-2xl bg-white/80 ring-1 ring-rose-100"
                                      />
                                    ))}
                                  </div>
                                ) : matchingErrors[item._id] ? (
                                  <div
                                    role="alert"
                                    className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                                  >
                                    <AlertCircle
                                      size={18}
                                      className="shrink-0"
                                    />
                                    {matchingErrors[item._id]}
                                  </div>
                                ) : donorList.length > 0 ? (
                                  <div className="space-y-3">
                                    {donorList.map((donor) => (
                                      <div
                                        key={donor.donorId}
                                        className="group/donor flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white bg-white p-4 shadow-sm shadow-rose-100/60 ring-1 ring-rose-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-200/60 hover:ring-rose-200"
                                      >
                                        <div className="flex items-center gap-4">
                                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-lg font-bold uppercase text-[#96334F] ring-2 ring-white transition duration-200 group-hover/donor:from-[#BE4565] group-hover/donor:to-[#96334F] group-hover/donor:text-white">
                                            {donor.name?.charAt(0) || "?"}
                                          </span>

                                          <div>
                                            <p className="font-bold text-[#29232A]">
                                              {donor.name}
                                            </p>

                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FCE7ED] px-2.5 py-0.5 text-xs font-bold text-[#96334F]">
                                                <Droplet size={11} />
                                                {donor.bloodGroup}
                                              </span>

                                              <span className="inline-flex items-center gap-1">
                                                <MapPin
                                                  size={13}
                                                  className="text-[#BE4565]"
                                                />
                                                {donor.city}
                                              </span>
                                            </div>

                                            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-gray-500">
                                              <HeartHandshake
                                                size={13}
                                                className="text-[#BE4565]"
                                              />
                                              Previous donations:{" "}
                                              <span className="font-semibold text-[#96334F]">
                                                {donor.totalDonations}
                                              </span>
                                            </p>
                                          </div>
                                        </div>

                                        <span
                                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold ${rankStyle(donor.rank)}`}
                                        >
                                          {donor.rank <= 3 && (
                                            <Medal size={15} />
                                          )}
                                          Rank #{donor.rank}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-rose-200 bg-white/70 px-5 py-8 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FCE7ED] text-[#BE4565]">
                                      <Users size={22} />
                                    </div>
                                    <p className="mx-auto mt-3 max-w-sm text-sm text-gray-500">
                                      No eligible matching donors are currently
                                      available for this request.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-rose-100 bg-white p-10 text-center text-gray-600 shadow-sm">
            Hospital information could not be loaded.
          </div>
        )}
      </main>
    </div>
  );
}

export default HospitalDashboard;
