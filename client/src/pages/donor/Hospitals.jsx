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
    <div className="space-y-8">
      {/* Page Heading */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
          Donor Portal
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-[#302923] sm:text-4xl">
              Hospitals
            </h1>

            <p className="mt-3 text-sm text-[#81756A]">
              Explore verified hospitals registered on DonorNexa.
            </p>
          </div>

          <button
            onClick={fetchHospitals}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-sm font-medium text-[#963D54] shadow-sm transition hover:bg-[#F2E2DC] disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] py-16 text-sm text-[#927E70]">
          <Loader2 size={20} className="animate-spin text-[#963D54]" />
          Loading verified hospitals...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          <AlertCircle size={20} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && hospitals.length === 0 && (
        <div className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] px-5 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#963D54]">
            <Building2 size={30} />
          </div>

          <h2 className="mt-5 font-serif text-xl font-semibold text-[#302923]">
            No Verified Hospitals Yet
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm text-[#927E70]">
            There are currently no verified hospitals available to display.
          </p>
        </div>
      )}

      {/* Hospital Cards */}
      {!loading && !error && hospitals.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-sm text-[#81756A]">
            <Building2 size={17} className="text-[#963D54]" />
            {hospitals.length} verified{" "}
            {hospitals.length === 1 ? "hospital" : "hospitals"}
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {hospitals.map((hospital) => (
              <article
                key={hospital._id}
                className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#963D54]">
                    <Building2 size={24} />
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2E2DC] px-3 py-1.5 text-xs font-semibold text-[#963D54]">
                    <ShieldCheck size={14} />
                    Verified
                  </span>
                </div>

                <h2 className="mt-5 font-serif text-xl font-semibold text-[#302923]">
                  {hospital.hospitalName}
                </h2>

                <div className="mt-4 flex items-start gap-2.5 text-sm leading-6 text-[#81756A]">
                  <MapPin size={17} className="mt-1 shrink-0 text-[#A45B6D]" />
                  <span>
                    {hospital.address}, {hospital.city}
                  </span>
                </div>

                {hospital.verifiedAt && (
                  <p className="mt-5 border-t border-[#E8DDD4] pt-4 text-xs text-[#927E70]">
                    Verified on{" "}
                    {new Date(hospital.verifiedAt).toLocaleDateString()}
                  </p>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Hospitals;
