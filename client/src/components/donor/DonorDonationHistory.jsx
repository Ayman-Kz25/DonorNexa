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
    <div>
      {/* Donation Count */}
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#F8F1ED] px-4 py-3">
        <Droplet size={20} className="text-[#963D54]" />
        <p className="text-sm text-[#81756A]">
          Total donations:
          <span className="ml-2 font-semibold text-[#782B40]">
            {totalDonations}
          </span>
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12" role="status">
          <Loader2 className="animate-spin text-[#963D54]" size={28} />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex items-center justify-center gap-2 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] px-4 py-8 text-sm text-[#963D54]"
        >
          <AlertCircle size={18} />
          {error}
        </div>
      ) : donations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#DDCEC3] bg-[#F8F5EF] px-5 py-12 text-center">
          <Heart size={26} className="mx-auto text-[#963D54]" />

          <h3 className="mt-4 font-semibold text-[#302923]">
            No Donations Yet
          </h3>

          <p className="mt-2 text-sm text-[#81756A]">
            Your completed donations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {donations.map((donation) => (
            <article
              key={donation._id}
              className="rounded-xl border border-[#E8DDD4] bg-[#FDFCFA] p-4 transition hover:border-[#D7B9B5]"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#782B40]">
                    <Droplet size={21} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#302923]">
                      {donation.bloodGroup} Donation
                    </h3>
                    <p className="mt-1 text-sm text-[#81756A]">
                      {donation.units} unit(s) donated
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-[#81756A]">
                  <CalendarDays size={16} className="text-[#963D54]" />
                  {formatDate(donation.donatedOn)}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-[#E8DDD4] pt-3 text-sm text-[#81756A]">
                <MapPin size={16} className="shrink-0 text-[#963D54]" />
                <span>
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
