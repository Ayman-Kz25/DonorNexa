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
      <div className="flex min-h-[240px] items-center justify-center sm:min-h-[300px]">
        <div className="flex items-center gap-2.5 text-xs text-[#81756A] sm:gap-3 sm:text-sm">
          <RefreshCw className="h-4 w-4 animate-spin text-[#963D54]" />
          Loading hospital profile...
        </div>
      </div>
    );
  }

  if (error && !hospital) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 sm:rounded-2xl sm:p-5 sm:text-sm">
        <AlertCircle className="mb-2 h-5 w-5" />
        <p className="leading-relaxed">{error}</p>

        <button
          type="button"
          onClick={() => fetchProfile()}
          className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium transition hover:bg-red-100 sm:mt-4 sm:px-4 sm:text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!hospital) return null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-full space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Header */}
      <section className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#963D54] sm:text-sm">
            Account
          </p>

          <h1 className="mt-1 font-serif text-xl text-[#302923] sm:text-2xl lg:text-3xl">
            Hospital Profile
          </h1>

          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-[#81756A] sm:mt-2 sm:text-sm">
            View your hospital registration information and license details.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchProfile(true)}
          disabled={refreshing}
          className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-3 py-2 text-xs font-medium text-[#782B40] transition hover:border-[#963D54] hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:w-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {/* Page error */}
      {error && (
        <div className="flex min-w-0 items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700 sm:rounded-xl sm:p-4 sm:text-sm">
          <AlertCircle size={15} className="mt-0.5 shrink-0 sm:size-[17px]" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      )}

      {/* Hospital overview */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] shadow-sm sm:rounded-2xl">
        {/* Hospital header */}
        <div className="flex min-w-0 flex-col justify-between gap-3 border-b border-[#E8DDD4] p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-5 lg:p-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#782B40] sm:h-14 sm:w-14 sm:rounded-2xl">
              <Building2 size={20} className="sm:size-[26px]" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="break-words font-serif text-base text-[#302923] sm:text-xl">
                {hospital.hospitalName}
              </h2>

              <p className="mt-1 flex min-w-0 items-start gap-1 text-xs leading-relaxed text-[#81756A] sm:items-center sm:gap-1.5 sm:text-sm">
                <MapPin
                  size={13}
                  className="mt-0.5 shrink-0 sm:mt-0 sm:size-[14px]"
                />
                <span className="break-words">
                  {hospital.city || "City not provided"}
                </span>
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs ${
              statusStyles[status] ||
              "border-gray-200 bg-gray-100 text-gray-600"
            }`}
          >
            {status === "verified" ? (
              <ShieldCheck size={13} />
            ) : status === "rejected" ? (
              <AlertCircle size={13} />
            ) : (
              <Clock size={13} />
            )}

            {status || "Unknown"}
          </span>
        </div>

        {/* Verification message */}
        {status === "pending" && (
          <div className="mx-3 mt-3 flex min-w-0 gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:mx-5 sm:mt-5 sm:gap-3 sm:rounded-xl sm:p-4 lg:mx-6">
            <Clock className="mt-0.5 shrink-0 text-amber-700" size={16} />

            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-800 sm:text-sm">
                Verification in progress
              </p>

              <p className="mt-1 text-xs leading-relaxed text-amber-700 sm:text-sm">
                Your hospital registration is awaiting administrator
                verification.
              </p>
            </div>
          </div>
        )}

        {status === "verified" && (
          <div className="mx-3 mt-3 flex min-w-0 gap-2.5 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] p-3 sm:mx-5 sm:mt-5 sm:gap-3 sm:rounded-xl sm:p-4 lg:mx-6">
            <CheckCircle2
              className="mt-0.5 shrink-0 text-[#782B40]"
              size={16}
            />

            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#782B40] sm:text-sm">
                Hospital verified
              </p>

              <p className="mt-1 text-xs leading-relaxed text-[#81756A] sm:text-sm">
                Your hospital registration has been successfully verified.
              </p>
            </div>
          </div>
        )}

        {status === "rejected" && (
          <div className="mx-3 mt-3 flex min-w-0 gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 sm:mx-5 sm:mt-5 sm:gap-3 sm:rounded-xl sm:p-4 lg:mx-6">
            <AlertCircle className="mt-0.5 shrink-0 text-red-700" size={16} />

            <div className="min-w-0">
              <p className="text-xs font-semibold text-red-800 sm:text-sm">
                Registration rejected
              </p>

              <p className="mt-1 text-xs leading-relaxed text-red-700 sm:text-sm">
                Your hospital registration was rejected. Please contact the
                administrator for further information.
              </p>

              {hospital.rejectionReason && (
                <p className="mt-2 break-words text-xs font-medium leading-relaxed text-red-800 sm:text-sm">
                  Reason: {hospital.rejectionReason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Profile details */}
        <div className="p-3.5 sm:p-5 lg:p-6">
          <div className="mb-3 sm:mb-5">
            <h3 className="font-serif text-base text-[#302923] sm:text-lg">
              Registration Details
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-[#81756A]">
              Information submitted during hospital registration.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 sm:gap-3.5 lg:gap-4">
            {details.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="group flex min-w-0 items-start gap-2.5 rounded-lg border border-[#F0E8E1] bg-[#FFFDF9] p-3 transition duration-200 hover:border-[#D8B8BE] hover:bg-[#F8F5EF] sm:gap-3 sm:rounded-xl sm:p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F2E2DC] text-[#963D54] transition group-hover:bg-[#E8DDD4] sm:h-10 sm:w-10 sm:rounded-lg">
                  <Icon size={15} className="sm:size-[18px]" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[#81756A] sm:text-xs">
                    {label}
                  </p>

                  <p className="mt-1 break-words text-xs font-semibold leading-relaxed text-[#302923] sm:text-sm">
                    {value || "Not provided"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hospital License */}
      <div className="min-w-0">
        <HospitalLicense />
      </div>
    </div>
  );
};

export default HospitalProfile;
