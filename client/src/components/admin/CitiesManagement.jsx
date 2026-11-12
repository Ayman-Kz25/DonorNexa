import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Search, RefreshCw, Power, Download } from "lucide-react";
import { useApi } from "../../hooks/useApi";

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

  const fetchCities = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/admin/cities",
        params: { search, status },
      });

      setCities(response.data.cities || []);
    } catch (err) {
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
      await fetchCities();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add city.");
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (city) => {
    const newStatus = !city.isActive;

    try {
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
      setError(err.response?.data?.message || "Unable to update city status.");
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-[#302923]">
            <MapPin size={21} className="text-[#87364D]" />
            Cities Management
          </h2>
          <p className="mt-1 text-sm text-[#81756A]">
            Add and manage the cities available on DonorNexa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting || cities.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={15} />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            onClick={fetchCities}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8DDD4] px-4 py-2.5 text-sm font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <form
        onSubmit={handleAddCity}
        className="mb-6 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="text"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          placeholder="Enter city name..."
          className="min-w-0 flex-1 rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none transition placeholder:text-[#A99D93] focus:border-[#A45B6D] focus:ring-2 focus:ring-[#F2E2DC]"
        />

        <button
          type="submit"
          disabled={adding || !cityName.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#782B40] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={17} />
          {adding ? "Adding..." : "Add City"}
        </button>
      </form>

      {(error || message) && (
        <div
          className={`mb-5 rounded-xl border p-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[#E8DDD4] bg-[#F2E2DC] text-[#782B40]"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A99D93]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities..."
            className="w-full rounded-xl border border-[#E8DDD4] bg-white py-2.5 pl-10 pr-3 text-sm text-[#302923] outline-none transition placeholder:text-[#A99D93] focus:border-[#A45B6D] focus:ring-2 focus:ring-[#F2E2DC]"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-[#E8DDD4] bg-white px-4 py-2.5 text-sm text-[#302923] outline-none focus:border-[#A45B6D]"
        >
          <option value="all">All Cities</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E8DDD4]">
        <table className="w-full min-w-[550px] text-left text-sm">
          <thead className="border-b border-[#E8DDD4] bg-[#F8F5EF] text-[#81756A]">
            <tr>
              <th className="px-4 py-3 font-semibold">City Name</th>
              <th className="px-4 py-3 font-semibold">Added On</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0EAE3]">
            {loading ? (
              <tr>
                <td colSpan="4" className="py-10 text-center text-[#81756A]">
                  Loading cities...
                </td>
              </tr>
            ) : cities.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-10 text-center text-[#81756A]">
                  No cities found.
                </td>
              </tr>
            ) : (
              cities.map((city) => (
                <tr key={city._id} className="transition hover:bg-[#FAF6F1]">
                  <td className="px-4 py-4 font-medium text-[#302923]">
                    {city.name}
                  </td>

                  <td className="px-4 py-4 text-[#81756A]">
                    {new Date(city.createdAt).toLocaleDateString()}
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
                      onClick={() => handleStatusChange(city)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8DDD4] px-3 py-2 text-xs font-medium text-[#782B40] transition hover:border-[#D8B7BE] hover:bg-[#F2E2DC]"
                    >
                      <Power size={14} />
                      {city.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[#81756A]">
        Total cities displayed: {cities.length}
      </p>
    </section>
  );
}

export default CitiesManagement;
