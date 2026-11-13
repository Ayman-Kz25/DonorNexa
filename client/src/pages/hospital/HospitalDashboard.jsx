import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  MapPin,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import HospitalRegistrationForm from "../../components/hospital/HospitalRegistrationForm";
import { formatDate } from "../../utils/dateTime";

function HospitalDashboard() {
  const { request } = useApi();

  const [hospital, setHospital] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notRegistered, setNotRegistered] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const hospitalResponse = await request({
        method: "GET",
        url: "/api/hospitals/profile",
      });

      const hospitalData =
        hospitalResponse.data.hospital || hospitalResponse.data;

      setHospital(hospitalData);
      setNotRegistered(false);

      if (hospitalData.verificationStatus === "verified") {
        const requestsResponse = await request({
          method: "GET",
          url: "/api/blood-requests/my-requests",
        });

        setRequests(
          requestsResponse.data.requests ||
            requestsResponse.data.bloodRequests ||
            [],
        );
      } else {
        setRequests([]);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setHospital(null);
        setRequests([]);
        setNotRegistered(true);
        setError("");
      } else {
        setError(
          err.response?.data?.message || "Unable to load hospital dashboard.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const isExpired = (item) =>
    item.status === "expired" ||
    (item.status === "open" &&
      item.requiredBy &&
      new Date(item.requiredBy).getTime() < Date.now());

  const getDisplayStatus = (item) =>
    isExpired(item) ? "expired" : item.status;

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
    {
      label: "Total Requests",
      value: requests.length,
      icon: ClipboardList,
    },
    {
      label: "Open Requests",
      value: openCount,
      icon: Clock,
    },
    {
      label: "Fulfilled",
      value: fulfilledCount,
      icon: CheckCircle2,
    },
    {
      label: "Cancelled / Expired",
      value: closedCount,
      icon: XCircle,
    },
  ];

  const statusStyle = (status) => {
    switch (status) {
      case "fulfilled":
        return "bg-[#F2E2DC] text-[#782B40]";
      case "cancelled":
      case "expired":
        return "bg-[#F1EFEC] text-[#81756A]";
      default:
        return "bg-[#F8F1DF] text-[#92702F]";
    }
  };

  if (loading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center gap-3 text-[#782B40]"
        role="status"
      >
        <Loader2 size={22} className="animate-spin" />
        <span className="font-medium">Loading hospital dashboard...</span>
      </div>
    );
  }

  if (notRegistered) {
    return (
      <div className="space-y-6">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
            Hospital Portal
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#302923]">
            Hospital Registration
          </h1>
          <p className="mt-2 text-sm text-[#81756A]">
            Register your hospital to access DonorNexa services.
          </p>
        </section>

        <HospitalRegistrationForm
          onRegistered={(registeredHospital) => {
            setHospital(registeredHospital);
            setNotRegistered(false);
            fetchDashboardData();
          }}
        />
      </div>
    );
  }

  if (!hospital && error) {
    return (
      <div className="rounded-2xl border border-[#E8C9C9] bg-[#FBEEEE] p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-[#963D54]">
          <AlertCircle size={18} />
          {error}
        </p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#782B40] px-4 py-2 text-sm font-semibold text-white"
        >
          <RefreshCw size={15} />
          Try Again
        </button>
      </div>
    );
  }

  const verified = hospital?.verificationStatus === "verified";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-3xl bg-[#782B40] px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8C8C8]">
            Hospital Portal
          </p>

          <h1 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
            Welcome, {hospital?.hospitalName}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#F2DFDD]">
            Manage your hospital's blood requests and monitor your blood
            donation coordination activities.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white">
            {verified ? <ShieldCheck size={17} /> : <Clock size={17} />}
            <span className="capitalize">
              {hospital?.verificationStatus || "Pending verification"}
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-6 h-44 w-44 rounded-full border border-white/10" />
        <Building2 className="pointer-events-none absolute bottom-7 right-10 hidden h-24 w-24 text-white/10 sm:block" />
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] px-4 py-3 text-sm text-[#963D54]"
        >
          <AlertCircle size={19} />
          {error}
        </div>
      )}

      {/* Verification status */}
      {!verified ? (
        <section className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40]">
              {hospital?.verificationStatus === "rejected" ? (
                <AlertCircle size={22} />
              ) : (
                <Clock size={22} />
              )}
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold text-[#302923]">
                {hospital?.verificationStatus === "rejected"
                  ? "Registration Rejected"
                  : "Registration Under Review"}
              </h2>
              <p className="mt-1 text-sm text-[#81756A]">
                {hospital?.verificationStatus === "rejected"
                  ? "Your registration needs attention."
                  : "Your registration is awaiting administrator verification."}
              </p>
            </div>
          </div>

          {hospital?.verificationStatus === "rejected" &&
            hospital?.rejectionReason && (
              <div className="mt-5 rounded-xl bg-[#FBEEEE] p-4 text-sm text-[#963D54]">
                {hospital.rejectionReason}
              </div>
            )}

          {hospital?.verificationStatus !== "rejected" && (
            <p className="mt-5 text-sm leading-6 text-[#81756A]">
              Once your hospital is verified, you will be able to create blood
              requests and access the hospital management features.
            </p>
          )}
        </section>
      ) : (
        <>
          {/* Overview */}
          <section>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A45B6D]">
                  Overview
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[#302923]">
                  Request Activity
                </h2>
              </div>

              <button
                onClick={fetchDashboardData}
                disabled={loading}
                aria-label="Refresh dashboard"
                title="Refresh dashboard"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8DDD4] bg-[#FFFDF9] text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50"
              >
                <RefreshCw size={17} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <article
                    key={stat.label}
                    className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 shadow-sm"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40]">
                      <Icon size={21} />
                    </div>

                    <p className="mt-5 text-sm font-medium text-[#81756A]">
                      {stat.label}
                    </p>

                    <p className="mt-1 text-3xl font-semibold tabular-nums text-[#302923]">
                      {stat.value}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Recent Requests */}
          <section className="rounded-3xl border border-[#E8DDD4] bg-[#FFFDF9] p-6 shadow-sm sm:p-7">
            <div className="mb-6 flex flex-col justify-between gap-3 border-b border-[#E8DDD4] pb-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A45B6D]">
                  Activity
                </p>
                <h2 className="mt-1 font-serif text-xl font-semibold text-[#302923]">
                  Your Blood Requests
                </h2>
                <p className="mt-1 text-sm text-[#81756A]">
                  A brief overview of your submitted requests.
                </p>
              </div>

              <Link
                to="/hospital/requests"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#782B40] transition hover:text-[#A45B6D]"
              >
                View All Requests
                <ArrowRight size={16} />
              </Link>
            </div>

            {requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#DDCEC3] bg-[#F8F5EF] px-5 py-10 text-center">
                <ClipboardList size={28} className="mx-auto text-[#A45B6D]" />
                <h3 className="mt-3 font-semibold text-[#302923]">
                  No Blood Requests Yet
                </h3>
                <p className="mt-1 text-sm text-[#81756A]">
                  Your submitted blood requests will appear here.
                </p>
                <Link
                  to="/hospital/create-request"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#782B40] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#612033]"
                >
                  Create a Request
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 3).map((item) => {
                  const status = getDisplayStatus(item);

                  return (
                    <article
                      key={item._id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E8DDD4] p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] font-serif font-bold text-[#782B40]">
                          {item.bloodGroup}
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#302923]">
                            {item.bloodGroup} Blood Required
                          </h3>

                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#81756A]">
                            <span>
                              {item.unitsRequired}{" "}
                              {item.unitsRequired === 1 ? "unit" : "units"}
                            </span>

                            <span className="flex items-center gap-1">
                              <MapPin size={13} />
                              {item.city}
                            </span>

                            <span className="flex items-center gap-1">
                              <CalendarDays size={13} />
                              {formatDate(item.requiredBy)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusStyle(status)}`}
                      >
                        {status}
                      </span>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default HospitalDashboard;
