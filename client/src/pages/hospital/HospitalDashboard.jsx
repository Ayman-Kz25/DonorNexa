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
        className="flex min-h-[45vh] items-center justify-center gap-2.5 px-3 text-[#782B40] sm:min-h-[55vh] sm:gap-3"
        role="status"
      >
        <Loader2
          size={20}
          className="shrink-0 animate-spin sm:h-[22px] sm:w-[22px]"
        />
        <span className="text-xs font-medium sm:text-sm">
          Loading hospital dashboard...
        </span>
      </div>
    );
  }

  if (notRegistered) {
    return (
      <div className="w-full min-w-0 space-y-4 sm:space-y-6">
        <section className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A45B6D] sm:text-xs sm:tracking-[0.18em]">
            Hospital Portal
          </p>
          <h1 className="mt-1.5 font-serif text-2xl font-semibold text-[#302923] sm:mt-2 sm:text-3xl lg:text-4xl">
            Hospital Registration
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#81756A] sm:text-sm sm:leading-6">
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
      <div className="w-full min-w-0 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] p-3.5 sm:rounded-2xl sm:p-5">
        <p className="flex items-start gap-2 text-xs font-medium leading-5 text-[#963D54] sm:text-sm">
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0 sm:h-[18px] sm:w-[18px]"
          />
          <span className="min-w-0 break-words">{error}</span>
        </p>
        <button
          type="button"
          onClick={fetchDashboardData}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#782B40] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#612033] sm:mt-4 sm:w-auto sm:rounded-full sm:text-sm"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      </div>
    );
  }

  const verified = hospital?.verificationStatus === "verified";

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-7 lg:space-y-8">
      {/* Welcome */}
      <section className="relative min-w-0 overflow-hidden rounded-2xl bg-[#782B40] px-4 py-5 text-white sm:rounded-3xl sm:px-7 sm:py-8 lg:px-9 lg:py-10">
        <div className="relative z-10 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E8C8C8] sm:text-xs sm:tracking-[0.2em]">
            Hospital Portal
          </p>

          <h1 className="mt-2 break-words font-serif text-2xl font-semibold leading-tight sm:mt-3 sm:text-3xl lg:text-4xl">
            Welcome, {hospital?.hospitalName}
          </h1>

          <p className="mt-2.5 max-w-xl text-xs leading-5 text-[#F2DFDD] sm:mt-3 sm:text-sm sm:leading-7">
            Manage your hospital's blood requests and monitor your blood
            donation coordination activities.
          </p>

          <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-medium text-white sm:mt-5 sm:px-4 sm:text-sm">
            {verified ? (
              <ShieldCheck
                size={15}
                className="shrink-0 sm:h-[17px] sm:w-[17px]"
              />
            ) : (
              <Clock size={15} className="shrink-0 sm:h-[17px] sm:w-[17px]" />
            )}
            <span className="break-words capitalize">
              {hospital?.verificationStatus || "Pending verification"}
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/10 sm:-right-12 sm:-top-16 sm:h-64 sm:w-64" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full border border-white/10 sm:-right-2 sm:-top-6 sm:h-44 sm:w-44" />
        <Building2 className="pointer-events-none absolute bottom-5 right-6 hidden h-20 w-20 text-white/10 sm:bottom-7 sm:right-10 sm:block sm:h-24 sm:w-24" />
      </section>

      {error && (
        <div
          role="alert"
          className="flex min-w-0 items-start gap-2.5 rounded-lg border border-[#E8C9C9] bg-[#FBEEEE] px-3 py-3 text-xs leading-5 text-[#963D54] sm:gap-3 sm:rounded-xl sm:px-4 sm:text-sm"
        >
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0 sm:h-[19px] sm:w-[19px]"
          />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      )}

      {/* Verification status */}
      {!verified ? (
        <section className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-4 sm:rounded-2xl sm:p-6 lg:p-8">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#782B40] sm:h-11 sm:w-11 sm:rounded-xl">
              {hospital?.verificationStatus === "rejected" ? (
                <AlertCircle size={20} className="sm:h-[22px] sm:w-[22px]" />
              ) : (
                <Clock size={20} className="sm:h-[22px] sm:w-[22px]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="break-words font-serif text-lg font-semibold leading-snug text-[#302923] sm:text-xl">
                {hospital?.verificationStatus === "rejected"
                  ? "Registration Rejected"
                  : "Registration Under Review"}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#81756A] sm:text-sm sm:leading-6">
                {hospital?.verificationStatus === "rejected"
                  ? "Your registration needs attention."
                  : "Your registration is awaiting administrator verification."}
              </p>
            </div>
          </div>

          {hospital?.verificationStatus === "rejected" &&
            hospital?.rejectionReason && (
              <div className="mt-4 break-words rounded-lg bg-[#FBEEEE] p-3 text-xs leading-5 text-[#963D54] sm:mt-5 sm:rounded-xl sm:p-4 sm:text-sm">
                {hospital.rejectionReason}
              </div>
            )}

          {hospital?.verificationStatus !== "rejected" && (
            <p className="mt-4 text-xs leading-5 text-[#81756A] sm:mt-5 sm:text-sm sm:leading-6">
              Once your hospital is verified, you will be able to create blood
              requests and access the hospital management features.
            </p>
          )}
        </section>
      ) : (
        <>
          {/* Overview */}
          <section className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A45B6D] sm:text-xs sm:tracking-[0.16em]">
                  Overview
                </p>
                <h2 className="mt-1 font-serif text-xl font-semibold text-[#302923] sm:text-2xl">
                  Request Activity
                </h2>
              </div>

              <button
                type="button"
                onClick={fetchDashboardData}
                disabled={loading}
                aria-label="Refresh dashboard"
                title="Refresh dashboard"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8DDD4] bg-[#FFFDF9] text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50 sm:h-10 sm:w-10"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <article
                    key={stat.label}
                    className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 shadow-sm sm:rounded-2xl sm:p-4 lg:p-5"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#782B40] sm:h-11 sm:w-11 sm:rounded-xl">
                      <Icon size={18} className="sm:h-[21px] sm:w-[21px]" />
                    </div>

                    <p className="mt-3 min-h-8 break-words text-[11px] font-medium leading-4 text-[#81756A] sm:mt-5 sm:min-h-0 sm:text-sm sm:leading-5">
                      {stat.label}
                    </p>

                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[#302923] sm:text-3xl">
                      {stat.value}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Recent Requests */}
          <section className="min-w-0 rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 shadow-sm sm:rounded-3xl sm:p-5 lg:p-7">
            <div className="mb-4 flex min-w-0 flex-col justify-between gap-3 border-b border-[#E8DDD4] pb-4 sm:mb-6 sm:flex-row sm:items-center sm:pb-5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A45B6D] sm:text-xs sm:tracking-[0.16em]">
                  Activity
                </p>
                <h2 className="mt-1 font-serif text-lg font-semibold text-[#302923] sm:text-xl">
                  Your Blood Requests
                </h2>
                <p className="mt-1 text-xs leading-5 text-[#81756A] sm:text-sm">
                  A brief overview of your submitted requests.
                </p>
              </div>

              <Link
                to="/hospital/requests"
                className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-[#782B40] transition hover:text-[#A45B6D] sm:gap-2 sm:text-sm"
              >
                View All Requests
                <ArrowRight size={15} />
              </Link>
            </div>

            {requests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DDCEC3] bg-[#F8F5EF] px-3 py-8 text-center sm:rounded-2xl sm:px-5 sm:py-10">
                <ClipboardList
                  size={25}
                  className="mx-auto text-[#A45B6D] sm:h-7 sm:w-7"
                />
                <h3 className="mt-3 text-sm font-semibold text-[#302923] sm:text-base">
                  No Blood Requests Yet
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#81756A] sm:text-sm">
                  Your submitted blood requests will appear here.
                </p>
                <Link
                  to="/hospital/create-request"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#782B40] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#612033] sm:w-auto sm:rounded-full sm:px-5 sm:text-sm"
                >
                  Create a Request
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {requests.slice(0, 3).map((item) => {
                  const status = getDisplayStatus(item);

                  return (
                    <article
                      key={item._id}
                      className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border border-[#E8DDD4] p-3 sm:gap-4 sm:rounded-2xl sm:p-4 md:flex-row md:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] font-serif text-sm font-bold text-[#782B40] sm:h-12 sm:w-12 sm:rounded-xl sm:text-base">
                          {item.bloodGroup}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-xs font-semibold text-[#302923] sm:text-sm">
                            {item.bloodGroup} Blood Required
                          </h3>

                          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] leading-4 text-[#81756A] sm:gap-x-3 sm:text-xs">
                            <span>
                              {item.unitsRequired}{" "}
                              {item.unitsRequired === 1 ? "unit" : "units"}
                            </span>

                            <span className="inline-flex min-w-0 items-center gap-1">
                              <MapPin size={12} className="shrink-0" />
                              <span className="break-words">{item.city}</span>
                            </span>

                            <span className="inline-flex min-w-0 items-center gap-1">
                              <CalendarDays size={12} className="shrink-0" />
                              <span>{formatDate(item.requiredBy)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize sm:px-3 sm:py-1.5 sm:text-xs ${statusStyle(status)}`}
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
