import { useCallback, useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Search,
  RefreshCw,
  Power,
  Download,
  CalendarDays,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/dateTime";

function CitiesManagement() {
  const { request } = useApi();

  const [cities, setCities] = useState([]);
  const [cityName, setCityName] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const fetchCities = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/admin/cities",
        params: { search: search.trim(), status },
      });

      setCities(response.data.cities || []);
    } catch (err) {
      console.error("Fetch cities error:", err);
      setError(err.response?.data?.message || "Unable to load cities.");
    } finally {
      setLoading(false);
    }
  }, [request, search, status]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError("");
      setMessage("");

      const response = await request({
        method: "GET",
        url: "/api/admin/cities/export",
        params: {
          search: search.trim(),
          status,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const fileUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = fileUrl;
      link.download = "donornexa-cities.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error("Export cities error:", err);
      setError("Unable to export city records.");
    } finally {
      setExporting(false);
    }
  };

  const handleAddCity = async (e) => {
    e.preventDefault();

    if (!cityName.trim()) return;

    try {
      setAdding(true);
      setError("");
      setMessage("");

      const response = await request({
        method: "POST",
        url: "/api/admin/cities",
        data: { name: cityName.trim() },
      });

      setMessage(response.data.message || "City added successfully.");
      setCityName("");
      setSearch("");
      setStatus("all");

      // Fetch using the updated filters.
      const updatedResponse = await request({
        method: "GET",
        url: "/api/admin/cities",
        params: { search: "", status: "all" },
      });

      setCities(updatedResponse.data.cities || []);
    } catch (err) {
      console.error("Add city error:", err);
      setError(err.response?.data?.message || "Unable to add city.");
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (city) => {
    const newStatus = !city.isActive;

    try {
      setProcessingId(city._id);
      setError("");
      setMessage("");

      const response = await request({
        method: "PATCH",
        url: `/api/admin/cities/${city._id}/status`,
        data: { isActive: newStatus },
      });

      setMessage(response.data.message || "City status updated.");

      await fetchCities();
    } catch (err) {
      console.error("Update city status error:", err);
      setError(err.response?.data?.message || "Unable to update city status.");
    } finally {
      setProcessingId(null);
    }
  };

  const activeCount = cities.filter((city) => city.isActive).length;
  const inactiveCount = cities.length - activeCount;

  return (
    <section className="min-w-0 w-full space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:p-5 lg:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#87364D] sm:h-12 sm:w-12">
            <MapPin size={21} />
          </div>

          <div className="min-w-0">
            <h2 className="font-serif text-lg font-semibold text-[#302923] sm:text-xl lg:text-2xl">
              Cities Management
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#81756A] sm:text-sm">
              Add and manage the cities available on DonorNexa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting || cities.length === 0}
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg bg-[#782B40] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-xl sm:px-4 sm:text-sm"
          >
            {exporting ? (
              <Loader2 size={15} className="shrink-0 animate-spin" />
            ) : (
              <Download size={15} className="shrink-0" />
            )}
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            type="button"
            onClick={fetchCities}
            disabled={loading}
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-3 py-2.5 text-xs font-semibold text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50 sm:rounded-xl sm:px-4 sm:text-sm"
          >
            <RefreshCw
              size={15}
              className={`shrink-0 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <div className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 sm:p-4">
          <p className="text-[11px] font-medium text-[#81756A] sm:text-xs">
            Total cities
          </p>
          <p className="mt-2 text-xl font-semibold text-[#302923] sm:text-2xl">
            {loading ? "—" : cities.length}
          </p>
          <p className="mt-0.5 text-[10px] text-[#A3978C] sm:text-xs">
            Current results
          </p>
        </div>

        <div className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 sm:p-4">
          <p className="text-[11px] font-medium text-[#81756A] sm:text-xs">
            Active cities
          </p>
          <p className="mt-2 text-xl font-semibold text-[#87364D] sm:text-2xl">
            {loading ? "—" : activeCount}
          </p>
          <p className="mt-0.5 text-[10px] text-[#A3978C] sm:text-xs">
            Available for selection
          </p>
        </div>

        <div className="col-span-2 min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 sm:col-span-1 sm:p-4">
          <p className="text-[11px] font-medium text-[#81756A] sm:text-xs">
            Inactive cities
          </p>
          <p className="mt-2 text-xl font-semibold text-[#302923] sm:text-2xl">
            {loading ? "—" : inactiveCount}
          </p>
          <p className="mt-0.5 text-[10px] text-[#A3978C] sm:text-xs">
            Currently disabled
          </p>
        </div>
      </div>

      {/* Add city */}
      <div className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 sm:rounded-2xl sm:p-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[#302923] sm:text-base">
            Add New City
          </h3>
          <p className="mt-1 text-[11px] text-[#81756A] sm:text-xs">
            Add a city to make it available in DonorNexa.
          </p>
        </div>

        <form
          onSubmit={handleAddCity}
          className="flex min-w-0 flex-col gap-2 sm:flex-row"
        >
          <input
            type="text"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            placeholder="Enter city name..."
            maxLength={60}
            className="min-w-0 flex-1 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] px-3.5 py-2.5 text-xs text-[#302923] outline-none transition placeholder:text-[#A3978C] focus:border-[#A45B6D] focus:bg-white focus:ring-2 focus:ring-[#F2E2DC] sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
          />

          <button
            type="submit"
            disabled={adding || !cityName.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#782B40] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-xl sm:py-3 sm:text-sm"
          >
            {adding ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {adding ? "Adding..." : "Add City"}
          </button>
        </form>
      </div>

      {/* Messages */}
      {(error || message) && (
        <div
          role={error ? "alert" : "status"}
          className={`flex min-w-0 items-start gap-2.5 rounded-xl border px-3 py-3 text-xs sm:px-4 sm:text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[#E8DDD4] bg-[#F2E2DC] text-[#782B40]"
          }`}
        >
          {error && <AlertCircle size={17} className="mt-0.5 shrink-0" />}
          <span className="min-w-0 flex-1 break-words">{error || message}</span>
          <button
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
            }}
            aria-label="Dismiss message"
            className="shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Search and filters */}
      <div className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 sm:rounded-2xl sm:p-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[#302923] sm:text-base">
            Find Cities
          </h3>
          <p className="mt-1 text-[11px] text-[#81756A] sm:text-xs">
            Search by city name or filter by status.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-[minmax(0,1fr)_minmax(130px,0.45fr)]">
          <div className="relative min-w-0">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A45B6D]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cities..."
              aria-label="Search cities"
              className="w-full min-w-0 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] py-2.5 pl-10 pr-3 text-xs text-[#302923] outline-none transition placeholder:text-[#A3978C] focus:border-[#A45B6D] focus:bg-white focus:ring-2 focus:ring-[#F2E2DC] sm:rounded-xl sm:py-3 sm:text-sm"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter cities by status"
            className="w-full min-w-0 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] px-3 py-2.5 text-xs text-[#302923] outline-none focus:border-[#A45B6D] sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
          >
            <option value="all">All Cities</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* City records */}
      <div className="min-w-0 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[#302923] sm:text-base">
            City Records
          </h3>
          <p className="mt-1 text-[11px] text-[#81756A] sm:text-xs">
            {cities.length} cities displayed
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] py-12 text-xs font-medium text-[#87364D] sm:py-16 sm:text-sm">
            <Loader2 size={18} className="animate-spin" />
            Loading cities...
          </div>
        ) : cities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D8C3B5] bg-[#FFFDF9] px-3 py-10 text-center sm:py-14">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F2E2DC] text-[#87364D] sm:h-14 sm:w-14">
              <MapPin size={23} />
            </div>
            <h3 className="mt-3 font-serif text-lg font-semibold text-[#302923] sm:text-xl">
              No cities found
            </h3>
            <p className="mt-1.5 text-xs text-[#81756A] sm:text-sm">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:hidden">
              {cities.map((city) => (
                <article
                  key={city._id}
                  className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#87364D]">
                        <MapPin size={17} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="break-words text-sm font-semibold text-[#302923]">
                          {city.name}
                        </h4>
                        <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#81756A]">
                          <CalendarDays size={12} className="shrink-0" />
                          {formatDate(city.createdAt)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        city.isActive
                          ? "bg-[#F2E2DC] text-[#782B40]"
                          : "bg-[#F0EAE3] text-[#81756A]"
                      }`}
                    >
                      {city.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-3 border-t border-[#EAE2DB] pt-3">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(city)}
                      disabled={processingId === city._id}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#E8DDD4] px-3 py-2 text-xs font-semibold text-[#782B40] transition hover:border-[#D8B7BE] hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingId === city._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Power size={14} />
                      )}
                      {processingId === city._id
                        ? "Updating..."
                        : city.isActive
                          ? "Deactivate City"
                          : "Activate City"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Tablet and desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-[#E8DDD4] sm:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-[#E8DDD4] bg-[#F8F5EF] text-[#81756A]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">City Name</th>
                      <th className="px-4 py-3 font-semibold">Added On</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#F0EAE3]">
                    {cities.map((city) => (
                      <tr
                        key={city._id}
                        className="transition hover:bg-[#FAF6F1]"
                      >
                        <td className="px-4 py-4 font-medium text-[#302923]">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#87364D]">
                              <MapPin size={15} />
                            </div>
                            <span>{city.name}</span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-[#81756A]">
                          {formatDate(city.createdAt)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              city.isActive
                                ? "bg-[#F2E2DC] text-[#782B40]"
                                : "bg-[#F0EAE3] text-[#81756A]"
                            }`}
                          >
                            {city.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(city)}
                            disabled={processingId === city._id}
                            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#E8DDD4] px-3 py-2 text-xs font-medium text-[#782B40] transition hover:border-[#D8B7BE] hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {processingId === city._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Power size={14} />
                            )}
                            {processingId === city._id
                              ? "Updating..."
                              : city.isActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default CitiesManagement;
