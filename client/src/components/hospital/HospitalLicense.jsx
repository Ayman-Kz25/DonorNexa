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
      <section className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40]">
              <FileText size={21} />
            </div>

            <div>
              <h3 className="font-serif text-lg text-[#302923]">
                Hospital License
              </h3>
              <p className="mt-1 text-sm text-[#81756A]">
                View your submitted license document.
              </p>
            </div>
          </div>

          <button
            onClick={viewLicense}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Eye size={16} />
            {loading ? "Opening..." : "View License"}
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-[#F0E8E1] bg-[#F8F5EF] p-4">
          <p className="text-sm font-medium text-[#302923]">
            Read-only document
          </p>
          <p className="mt-1 text-xs text-[#81756A]">
            You can view your submitted license, but cannot edit or replace it.
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </section>

      {open && licenseUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#FFFDF9]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8DDD4] p-4">
              <div>
                <h3 className="font-serif text-lg text-[#302923]">
                  Hospital License
                </h3>
                <p className="text-xs text-[#81756A]">
                  Submitted registration document
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[#E8DDD4] p-2 text-[#782B40] hover:bg-[#F8F5EF]"
                  title="Open in new tab"
                >
                  <ExternalLink size={17} />
                </a>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-[#81756A] hover:bg-[#F2E2DC] hover:text-[#782B40]"
                  aria-label="Close license preview"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <iframe
              src={licenseUrl}
              title="Hospital license"
              className="min-h-0 flex-1 bg-[#E8DDD4]"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default HospitalLicense;
