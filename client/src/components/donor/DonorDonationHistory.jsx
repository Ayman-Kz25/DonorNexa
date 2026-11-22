import { useCallback, useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import {
  Heart,
  CalendarDays,
  MapPin,
  Droplet,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "../../utils/dateTime";

const DonorDonationHistory = () => {
  const { request } = useApi();

  const [donations, setDonations] = useState([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDonationHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/donors/donation-history",
      });

      setDonations(response.data.donations || []);
      setTotalDonations(response.data.totalDonations || 0);
    } catch (err) {
      console.error("Donation history error:", err);
      setError("Unable to load donation history.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchDonationHistory();
  }, [fetchDonationHistory]);

  return (
    <div className="min-w-0 w-full">
      {/* Donation Count */}
      <div className="mb-4 flex min-w-0 items-center gap-2.5 rounded-lg bg-[#F8F1ED] px-3 py-2.5 sm:mb-5 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3">
        <Droplet size={18} className="shrink-0 text-[#963D54] sm:h-5 sm:w-5" />

        <p className="min-w-0 text-xs text-[#81756A] sm:text-sm">
          Total donations:
          <span className="ml-1.5 font-semibold tabular-nums text-[#782B40] sm:ml-2">
            {totalDonations}
          </span>
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-10 sm:py-12" role="status">
          <Loader2 className="animate-spin text-[#963D54]" size={24} />
          <span className="sr-only">Loading donation history...</span>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex min-w-0 items-center justify-center gap-2 rounded-lg border border-[#E8C9C9] bg-[#FBEEEE] px-3 py-6 text-center text-xs leading-5 text-[#963D54] sm:rounded-xl sm:px-4 sm:py-8 sm:text-sm"
        >
          <AlertCircle size={17} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : donations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#DDCEC3] bg-[#F8F5EF] px-3 py-9 text-center sm:rounded-xl sm:px-5 sm:py-12">
          <Heart size={23} className="mx-auto text-[#963D54] sm:h-7 sm:w-7" />

          <h3 className="mt-3 text-sm font-semibold text-[#302923] sm:mt-4 sm:text-base">
            No Donations Yet
          </h3>

          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-[#81756A] sm:mt-2 sm:text-sm">
            Your completed donations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {donations.map((donation) => (
            <article
              key={donation._id}
              className="min-w-0 rounded-lg border border-[#E8DDD4] bg-[#FDFCFA] p-3 transition-colors hover:border-[#D7B9B5] sm:rounded-xl sm:p-4"
            >
              {/* Donation Information */}
              <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#782B40] sm:h-10 sm:w-10">
                    <Droplet size={19} className="sm:hidden" />
                    <Droplet size={21} className="hidden sm:block" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold leading-5 text-[#302923] sm:text-base">
                      {donation.bloodGroup} Donation
                    </h3>

                    <p className="mt-0.5 text-xs text-[#81756A] sm:mt-1 sm:text-sm">
                      {donation.units} unit(s) donated
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-2 pl-0.5 text-xs text-[#81756A] sm:justify-end sm:text-sm">
                  <CalendarDays
                    size={15}
                    className="shrink-0 text-[#963D54] sm:h-4 sm:w-4"
                  />
                  <span>{formatDate(donation.donatedOn)}</span>
                </div>
              </div>

              {/* Hospital Information */}
              <div className="mt-3 flex min-w-0 items-start gap-2 border-t border-[#E8DDD4] pt-3 text-xs leading-5 text-[#81756A] sm:text-sm">
                <MapPin
                  size={15}
                  className="mt-0.5 shrink-0 text-[#963D54] sm:h-4 sm:w-4"
                />

                <span className="min-w-0 break-words">
                  {donation.hospital?.hospitalName || "Hospital"}
                  {donation.hospital?.city ? `, ${donation.hospital.city}` : ""}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonorDonationHistory;
