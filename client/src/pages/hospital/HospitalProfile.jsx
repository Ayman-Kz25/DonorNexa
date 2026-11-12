import { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  UserRound,
  FileText,
  ShieldCheck,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

const HospitalProfile = () => {
  const { request } = useApi();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
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
      }
    };

    fetchProfile();
  }, [request]);

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

  const status = hospital?.verificationStatus;

  const statusStyles = {
    verified: "bg-rose-50 text-[#782B40]",
    pending: "bg-amber-50 text-amber-700",
    rejected: "bg-red-50 text-red-700",
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-[#81756A]">
        Loading hospital profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <AlertCircle className="mb-2 h-5 w-5" />
        {error}
      </div>
    );
  }

  if (!hospital) return null;

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-medium text-[#963D54]">Account</p>
        <h1 className="mt-1 font-serif text-3xl text-[#302923]">
          Hospital Profile
        </h1>
        <p className="mt-2 text-sm text-[#81756A]">
          View your hospital registration information.
        </p>
      </div>

      <section className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8DDD4] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40]">
              <Building2 size={23} />
            </div>

            <div>
              <h2 className="font-serif text-xl text-[#302923]">
                {hospital.hospitalName}
              </h2>
              <p className="text-sm text-[#81756A]">{hospital.city}</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
              statusStyles[status] || "bg-gray-100 text-gray-600"
            }`}
          >
            {status === "verified" ? (
              <ShieldCheck size={14} />
            ) : (
              <Clock size={14} />
            )}
            {status || "Unknown"}
          </span>
        </div>

        {status === "pending" && (
          <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Your hospital registration is awaiting verification.
          </p>
        )}

        {status === "rejected" && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Your hospital registration was rejected. Please contact the
            administrator for further information.
          </p>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {details.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F8F5EF] text-[#963D54]">
                <Icon size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-[#81756A]">{label}</p>
                <p className="mt-1 break-words text-sm font-medium text-[#302923]">
                  {value || "Not provided"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HospitalProfile;
