import { useCallback, useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import {
  Building2,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "../../utils/dateTime";

function Hospitals() {
  const { request } = useApi();

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHospitals = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/hospitals/verified",
      });

      setHospitals(response.data.hospitals || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load verified hospitals.",
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  return (
    <main className="mx-auto min-w-0 w-full max-w-full space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Page Heading */}
      <section className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A45B6D] sm:text-xs sm:tracking-[0.18em]">
          Donor Portal
        </p>

        <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-xl font-semibold leading-tight text-[#302923] sm:text-2xl lg:text-3xl">
              Hospitals
            </h1>

            <p className="mt-1.5 max-w-lg text-xs leading-5 text-[#81756A] sm:mt-2 sm:text-sm sm:leading-6">
              Explore verified hospitals registered on DonorNexa.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchHospitals}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-3 py-2 text-xs font-medium text-[#963D54] shadow-sm transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div
          role="status"
          className="flex min-w-0 items-center justify-center gap-2.5 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-3 py-10 text-xs text-[#927E70] sm:gap-3 sm:rounded-xl sm:py-14 sm:text-sm"
        >
          <Loader2 size={18} className="shrink-0 animate-spin text-[#963D54]" />
          <span>Loading verified hospitals...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          role="alert"
          className="flex min-w-0 items-start gap-2.5 rounded-lg border border-[#E8C9C9] bg-[#FBEEEE] p-3.5 text-xs leading-5 text-[#963D54] sm:gap-3 sm:rounded-xl sm:p-5 sm:text-sm"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && hospitals.length === 0 && (
        <div className="rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-10 text-center sm:rounded-xl sm:px-5 sm:py-14">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#963D54] sm:h-16 sm:w-16 sm:rounded-xl">
            <Building2 size={23} className="sm:hidden" />
            <Building2 size={30} className="hidden sm:block" />
          </div>

          <h2 className="mt-4 font-serif text-base font-semibold text-[#302923] sm:mt-5 sm:text-xl">
            No Verified Hospitals Yet
          </h2>

          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-[#927E70] sm:mt-2 sm:text-sm sm:leading-6">
            There are currently no verified hospitals available to display.
          </p>
        </div>
      )}

      {/* Hospital Cards */}
      {!loading && !error && hospitals.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-xs text-[#81756A] sm:text-sm">
            <Building2 size={16} className="shrink-0 text-[#963D54]" />
            <span>
              {hospitals.length} verified{" "}
              {hospitals.length === 1 ? "hospital" : "hospitals"}
            </span>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {hospitals.map((hospital) => (
              <article
                key={hospital._id}
                className="min-w-0 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 shadow-sm transition duration-200 hover:border-[#D7B9B5] hover:shadow-md sm:rounded-xl sm:p-4 lg:p-5"
              >
                {/* Hospital Icon and Verification */}
                <div className="flex min-w-0 items-start justify-between gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#963D54] sm:h-11 sm:w-11 sm:rounded-xl">
                    <Building2 size={19} className="sm:hidden" />
                    <Building2 size={23} className="hidden sm:block" />
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F2E2DC] px-2 py-1 text-[10px] font-semibold text-[#963D54] sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
                    <ShieldCheck size={12} className="sm:h-3.5 sm:w-3.5" />
                    Verified
                  </span>
                </div>

                {/* Hospital Name */}
                <h2 className="mt-3 break-words font-serif text-base font-semibold leading-snug text-[#302923] sm:mt-4 sm:text-lg lg:text-xl">
                  {hospital.hospitalName}
                </h2>

                {/* Hospital Address */}
                <div className="mt-2.5 flex min-w-0 items-start gap-2 text-xs leading-5 text-[#81756A] sm:mt-3 sm:gap-2.5 sm:text-sm sm:leading-6">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-[#A45B6D] sm:h-[17px] sm:w-[17px]"
                  />
                  <span className="min-w-0 break-words">
                    {hospital.address}, {hospital.city}
                  </span>
                </div>

                {/* Verification Date */}
                {hospital.verifiedAt && (
                  <p className="mt-3 border-t border-[#E8DDD4] pt-2.5 text-[11px] leading-5 text-[#927E70] sm:mt-4 sm:pt-3 sm:text-xs">
                    Verified on {formatDate(hospital.verifiedAt)}
                  </p>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

export default Hospitals;
