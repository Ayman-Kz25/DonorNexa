import { useEffect, useState } from "react";
import { Clock, MapPin, RefreshCw, Droplet } from "lucide-react";
import { useApi } from "../../hooks/useApi";

function getCountdown(date, now) {
  const difference = new Date(date).getTime() - now;

  if (Number.isNaN(difference) || difference <= 0) {
    return "Expired";
  }

  const days = Math.floor(difference / 86400000);
  const hours = Math.floor((difference % 86400000) / 3600000);
  const minutes = Math.floor((difference % 3600000) / 60000);
  const seconds = Math.floor((difference % 60000) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  return `${hours}h ${minutes}m ${seconds}s`;
}

function ActiveEmergencies() {
  const { request } = useApi();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(false);

      const response = await request({
        method: "GET",
        url: "/api/blood-requests/active",
      });

      const data = response.data;
      const activeRequests = Array.isArray(data)
        ? data
        : data?.bloodRequests || [];

      setRequests(activeRequests);
    } catch (err) {
      console.error("Unable to fetch active emergencies:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const urgencyStyles = {
    Critical: "bg-[#963D54] text-white",
    Urgent: "bg-[#F4E4D9] text-[#963D54]",
    Normal: "bg-[#EEE8DF] text-[#66594D]",
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#963D54]">
              Community Emergency Board
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-[#302923] sm:text-4xl">
              Active Emergencies
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#81756A]">
              View current blood requirements from hospitals and help connect
              patients with eligible donors.
            </p>
          </div>

          <button
            onClick={fetchRequests}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-[#D9C5B8] px-5 py-3 text-sm font-medium text-[#963D54] transition hover:bg-[#F0E7DF] disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-8 flex items-center gap-2 text-sm text-[#81756A]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#963D54]" />
          {requests.length} active{" "}
          {requests.length === 1 ? "request" : "requests"}
        </div>

        {loading ? (
          <div className="py-24 text-center text-sm text-[#81756A]">
            Loading active emergencies...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-10 text-center">
            <p className="text-sm text-[#963D54]">
              Unable to load emergency requests.
            </p>
            <button
              onClick={fetchRequests}
              className="mt-4 text-sm font-semibold text-[#963D54] underline"
            >
              Try again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] px-6 py-16 text-center">
            <Droplet size={30} className="mx-auto text-[#963D54]" />
            <h2 className="mt-4 font-serif text-xl text-[#302923]">
              No active emergencies
            </h2>
            <p className="mt-2 text-sm text-[#81756A]">
              There are no active blood requests at the moment.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((item) => {
              const countdown = getCountdown(item.requiredBy, currentTime);
              const expired = countdown === "Expired";

              return (
                <article
                  key={item._id}
                  className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#C99AA4] hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#81756A]">
                        Blood group
                      </p>
                      <h2 className="mt-1 font-serif text-4xl font-semibold text-[#963D54]">
                        {item.bloodGroup}
                      </h2>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        urgencyStyles[item.urgency] ||
                        "bg-[#EEE8DF] text-[#66594D]"
                      }`}
                    >
                      {item.urgency}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-sm text-[#66594D]">
                    <MapPin size={16} className="text-[#963D54]" />
                    {item.city || item.hospital?.city || "City unavailable"}
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-[#EEE5DD] pt-4 text-sm">
                    <Clock size={16} className="text-[#963D54]" />
                    <span className="text-[#81756A]">Time remaining:</span>
                    <span
                      className={`font-semibold ${
                        expired ? "text-[#963D54]" : "text-[#493D34]"
                      }`}
                    >
                      {countdown}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs leading-5 text-[#9A8D82]">
          For privacy, patient names, contact numbers, and donor details are
          never displayed on this public board.
        </p>
      </div>
    </div>
  );
}

export default ActiveEmergencies;
