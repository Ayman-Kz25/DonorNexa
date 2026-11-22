import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  UserRound,
  FileText,
  ShieldCheck,
  Clock,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import HospitalLicense from "../../components/hospital/HospitalLicense";

const HospitalProfile = () => {
  const { request } = useApi();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await request({
          method: "GET",
          url: "/api/hospitals/profile",
        });

        setHospital(response.data.hospital || response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load hospital profile.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [request],
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const status = hospital?.verificationStatus;

  const statusStyles = {
    verified: "bg-[#F2E2DC] text-[#782B40] border-[#E8DDD4]",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  const details = [
    {
      label: "Hospital Name",
      value: hospital?.hospitalName,
      icon: Building2,
    },
    {
      label: "License Number",
      value: hospital?.licenseNumber,
      icon: FileText,
    },
    {
      label: "Contact Person",
      value: hospital?.contactPerson,
      icon: UserRound,
    },
    {
      label: "Address",
      value: hospital?.address,
      icon: MapPin,
    },
    {
      label: "City",
      value: hospital?.city,
      icon: MapPin,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#81756A]">
          <RefreshCw className="h-4 w-4 animate-spin text-[#963D54]" />
          Loading hospital profile...
        </div>
      </div>
    );
  }

  if (error && !hospital) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <AlertCircle className="mb-2 h-5 w-5" />
        <p>{error}</p>

        <button
          onClick={() => fetchProfile()}
          className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 font-medium transition hover:bg-red-100"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!hospital) return null;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#963D54]">Account</p>

          <h1 className="mt-1 font-serif text-3xl text-[#302923]">
            Hospital Profile
          </h1>

          <p className="mt-2 text-sm text-[#81756A]">
            View your hospital registration information and license details.
          </p>
        </div>

        <button
          onClick={() => fetchProfile(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-sm font-medium text-[#782B40] transition hover:border-[#963D54] hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {/* Hospital overview */}
      <section className="overflow-hidden rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8DDD4] p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F2E2DC] text-[#782B40]">
              <Building2 size={26} />
            </div>

            <div className="min-w-0">
              <h2 className="break-words font-serif text-xl text-[#302923]">
                {hospital.hospitalName}
              </h2>

              <p className="mt-1 flex items-center gap-1.5 text-sm text-[#81756A]">
                <MapPin size={14} />
                {hospital.city || "City not provided"}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
              statusStyles[status] ||
              "border-gray-200 bg-gray-100 text-gray-600"
            }`}
          >
            {status === "verified" ? (
              <ShieldCheck size={15} />
            ) : status === "rejected" ? (
              <AlertCircle size={15} />
            ) : (
              <Clock size={15} />
            )}

            {status || "Unknown"}
          </span>
        </div>

        {/* Verification message */}
        {status === "pending" && (
          <div className="mx-6 mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Clock className="mt-0.5 shrink-0 text-amber-700" size={18} />

            <div>
              <p className="text-sm font-semibold text-amber-800">
                Verification in progress
              </p>

              <p className="mt-1 text-sm text-amber-700">
                Your hospital registration is awaiting administrator
                verification.
              </p>
            </div>
          </div>
        )}

        {status === "verified" && (
          <div className="mx-6 mt-5 flex gap-3 rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] p-4">
            <CheckCircle2
              className="mt-0.5 shrink-0 text-[#782B40]"
              size={18}
            />

            <div>
              <p className="text-sm font-semibold text-[#782B40]">
                Hospital verified
              </p>

              <p className="mt-1 text-sm text-[#81756A]">
                Your hospital registration has been successfully verified.
              </p>
            </div>
          </div>
        )}

        {status === "rejected" && (
          <div className="mx-6 mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 shrink-0 text-red-700" size={18} />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Registration rejected
              </p>

              <p className="mt-1 text-sm text-red-700">
                Your hospital registration was rejected. Please contact the
                administrator for further information.
              </p>

              {hospital.rejectionReason && (
                <p className="mt-2 text-sm font-medium text-red-800">
                  Reason: {hospital.rejectionReason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Profile details */}
        <div className="p-6">
          <div className="mb-5">
            <h3 className="font-serif text-lg text-[#302923]">
              Registration Details
            </h3>

            <p className="mt-1 text-xs text-[#81756A]">
              Information submitted during hospital registration.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {details.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="group flex min-w-0 items-start gap-3 rounded-xl border border-[#F0E8E1] bg-[#FFFDF9] p-4 transition duration-200 hover:border-[#D8B8BE] hover:bg-[#F8F5EF]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#963D54] transition group-hover:bg-[#E8DDD4]">
                  <Icon size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#81756A]">{label}</p>

                  <p className="mt-1 break-words text-sm font-semibold text-[#302923]">
                    {value || "Not provided"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hospital License Component */}
      <HospitalLicense />
    </div>
  );
};

export default HospitalProfile;
