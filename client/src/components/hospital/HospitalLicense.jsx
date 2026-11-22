import { useEffect, useState } from "react";
import { FileText, Eye, X, ExternalLink, AlertCircle } from "lucide-react";
import { useApi } from "../../hooks/useApi";

const HospitalLicense = () => {
  const { request } = useApi();

  const [licenseUrl, setLicenseUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const viewLicense = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/hospitals/my-license",
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      setLicenseUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return url;
      });

      setOpen(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to open your hospital license.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (licenseUrl) URL.revokeObjectURL(licenseUrl);
    };
  }, [licenseUrl]);

  return (
    <>
      <section className="w-full min-w-0 rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 shadow-sm sm:p-5">
        {/* Header */}
        <div className="flex min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40] sm:h-11 sm:w-11">
              <FileText size={19} />
            </div>

            <div className="min-w-0">
              <h3 className="font-serif text-base font-semibold text-[#302923] sm:text-lg">
                Hospital License
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-[#81756A] sm:text-sm">
                View your submitted license document.
              </p>
            </div>
          </div>

          <button
            onClick={viewLicense}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#782B40] px-3.5 py-2.5 text-xs font-medium text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-60 min-[480px]:w-auto sm:text-sm"
          >
            <Eye size={15} />
            {loading ? "Opening..." : "View License"}
          </button>
        </div>

        {/* Read-only notice */}
        <div className="mt-4 flex min-w-0 gap-3 rounded-xl border border-[#F0E8E1] bg-[#F8F5EF] p-3 sm:mt-5 sm:p-4">
          <FileText size={16} className="mt-0.5 shrink-0 text-[#782B40]" />

          <div className="min-w-0">
            <p className="text-xs font-medium text-[#302923] sm:text-sm">
              Read-only document
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#81756A] sm:text-xs">
              You can view your submitted license, but cannot edit or replace
              it.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 flex min-w-0 items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700 sm:text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p className="min-w-0 break-words">{error}</p>
          </div>
        )}
      </section>

      {/* License Preview */}
      {open && licenseUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-[95dvh] w-full min-w-0 max-w-5xl flex-col overflow-hidden rounded-xl bg-[#FFFDF9] sm:h-[90dvh] sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#E8DDD4] px-3 py-3 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h3 className="font-serif text-base font-semibold text-[#302923] sm:text-lg">
                  Hospital License
                </h3>
                <p className="mt-0.5 text-[10px] text-[#81756A] sm:text-xs">
                  Submitted registration document
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <a
                  href={licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[#E8DDD4] p-2 text-[#782B40] transition hover:bg-[#F8F5EF]"
                  title="Open in new tab"
                >
                  <ExternalLink size={16} />
                </a>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-[#81756A] transition hover:bg-[#F2E2DC] hover:text-[#782B40]"
                  aria-label="Close license preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* PDF */}
            <iframe
              src={licenseUrl}
              title="Hospital license"
              className="min-h-0 w-full flex-1 bg-[#E8DDD4]"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default HospitalLicense;
