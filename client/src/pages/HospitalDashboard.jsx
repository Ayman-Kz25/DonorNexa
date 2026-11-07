import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  FileText,
  MapPin,
  User,
  ShieldCheck,
  Clock,
  AlertCircle,
  Plus,
  Droplet,
  CalendarDays,
  RefreshCw,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useApi } from "../hooks/useApi";
import HospitalRegistrationForm from "../components/hospital/HospitalRegistrationForm";

const initialForm = {
  bloodGroup: "",
  unitsRequired: 1,
  urgency: "normal",
  requiredBy: "",
  hospitalNotes: "",
};

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

  const [registrationData, setRegistrationData] = useState({
    hospitalName: "",
    licenseNumber: "",
    contactPerson: "",
    address: "",
    city: "",
  });

  const inputClass =
    "w-full rounded-xl border border-rose-200 bg-[#FFF8FA] px-4 py-3 text-sm text-[#29232A] outline-none transition duration-200 placeholder:text-gray-400 hover:border-rose-300 focus:border-[#BE4565] focus:bg-white focus:ring-4 focus:ring-rose-100";

  const primaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#BE4565] to-[#A83A58] px-7 py-3 font-semibold text-white shadow-lg shadow-rose-400/30 transition duration-200 hover:from-[#A83A58] hover:to-[#96334F] hover:shadow-rose-400/50 disabled:cursor-not-allowed disabled:opacity-60";

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

  const handleRegistrationChange = (e) => {
    setRegistrationData({
      ...registrationData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await request({
        method: "POST",
        url: "/api/hospitals/register",
        data: registrationData,
      });

      setHospital(response.data.hospital || response.data);
      setNotRegistered(false);
      setSuccess("Hospital registration submitted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Hospital registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

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

  const formatDate = (date) => {
    if (!date) return "Not specified";

    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
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
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-[#FCE7ED] p-4 text-sm font-medium text-[#96334F] shadow-sm"
          >
            <CheckCircle2 size={20} className="shrink-0 text-[#BE4565]" />
            {success}
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
                  {hospital.verificationStatus === "verified" && (
                    <ShieldCheck size={16} />
                  )}
                  {hospital.verificationStatus}
                </span>
              </div>

              <div className="mt-7 grid gap-4 border-t border-rose-100 pt-6 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-2xl bg-[#FFF8FA] p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE7ED]">
                    <FileText className="text-[#BE4565]" size={20} />
                  </span>
                  <div>
                    <p className="text-xs text-gray-500">License Number</p>
                    <p className="font-medium">{hospital.licenseNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-[#FFF8FA] p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE7ED]">
                    <User className="text-[#BE4565]" size={20} />
                  </span>
                  <div>
                    <p className="text-xs text-gray-500">Contact Person</p>
                    <p className="font-medium">{hospital.contactPerson}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-[#FFF8FA] p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE7ED]">
                    <MapPin className="text-[#BE4565]" size={20} />
                  </span>
                  <div>
                    <p className="text-xs text-gray-500">City</p>
                    <p className="font-medium">{hospital.city}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-[#FFF8FA] p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE7ED]">
                    <Building2 className="text-[#BE4565]" size={20} />
                  </span>
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="font-medium">{hospital.address}</p>
                  </div>
                </div>
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
                      className="mt-8 space-y-5 border-t border-rose-100 pt-7"
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="req-bloodGroup"
                            className="mb-2 block text-sm font-semibold text-[#29232A]"
                          >
                            Required Blood Group
                          </label>
                          <select
                            id="req-bloodGroup"
                            name="bloodGroup"
                            value={formData.bloodGroup}
                            onChange={handleRequestChange}
                            className={inputClass}
                            required
                          >
                            <option value="">Select blood group</option>
                            {[
                              "A+",
                              "A-",
                              "B+",
                              "B-",
                              "AB+",
                              "AB-",
                              "O+",
                              "O-",
                            ].map((group) => (
                              <option key={group} value={group}>
                                {group}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="req-unitsRequired"
                            className="mb-2 block text-sm font-semibold text-[#29232A]"
                          >
                            Units Required
                          </label>
                          <input
                            id="req-unitsRequired"
                            type="number"
                            name="unitsRequired"
                            min="1"
                            value={formData.unitsRequired}
                            onChange={handleRequestChange}
                            className={inputClass}
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="req-urgency"
                            className="mb-2 block text-sm font-semibold text-[#29232A]"
                          >
                            Urgency
                          </label>
                          <select
                            id="req-urgency"
                            name="urgency"
                            value={formData.urgency}
                            onChange={handleRequestChange}
                            className={inputClass}
                          >
                            <option value="normal">Normal</option>
                            <option value="urgent">Urgent</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="req-requiredBy"
                            className="mb-2 block text-sm font-semibold text-[#29232A]"
                          >
                            Required By
                          </label>
                          <input
                            id="req-requiredBy"
                            type="datetime-local"
                            name="requiredBy"
                            value={formData.requiredBy}
                            onChange={handleRequestChange}
                            min={new Date().toISOString().slice(0, 16)}
                            className={inputClass}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="req-hospitalNotes"
                          className="mb-2 block text-sm font-semibold text-[#29232A]"
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
                    ) : (
                      requests.map((item) => (
                        <div
                          key={item._id}
                          className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-white p-5 pl-6 transition duration-300 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-100/70"
                        >
                          {/* Urgency accent bar */}
                          <div
                            className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${urgencyAccent(item.urgency)}`}
                          />

                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-xl font-bold text-[#96334F] ring-1 ring-white/70">
                                  {item.bloodGroup}
                                </span>

                                <span className="text-lg font-bold">
                                  {item.unitsRequired}{" "}
                                  {item.unitsRequired === 1 ? "Unit" : "Units"}
                                </span>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${statusStyle(item.status)}`}
                                >
                                  {item.status}
                                </span>
                              </div>

                              <div className="mt-4 space-y-2 text-sm text-gray-600">
                                <p>
                                  <span className="font-medium">Urgency:</span>{" "}
                                  <span className="capitalize">
                                    {item.urgency}
                                  </span>
                                </p>

                                <p className="flex items-center gap-2">
                                  <CalendarDays
                                    size={16}
                                    className="text-[#BE4565]"
                                  />
                                  Required by: {formatDate(item.requiredBy)}
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

                            {item.status === "open" && (
                              <button
                                onClick={() => handleCancelRequest(item._id)}
                                className="rounded-full border border-rose-200 bg-white px-5 py-2 text-sm font-semibold text-[#96334F] transition duration-200 hover:border-[#BE4565] hover:bg-[#FCE7ED]"
                              >
                                Cancel Request
                              </button>
                            )}
                          </div>
                        </div>
                      ))
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
