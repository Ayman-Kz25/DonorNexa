import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Search, RefreshCw, Power } from "lucide-react";
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
    <section className="mt-8 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#29232A]">
            <MapPin size={22} className="text-[#BE4565]" />
            Cities Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Add and manage the cities available on DonorNexa.
          </p>
        </div>

        <button
          onClick={fetchCities}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm text-[#96334F] hover:bg-rose-50 disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Add City */}
      <form
        onSubmit={handleAddCity}
        className="mb-6 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="text"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          placeholder="Enter city name..."
          className="flex-1 rounded-lg border border-rose-100 px-4 py-2.5 text-sm outline-none focus:border-[#BE4565]"
        />

        <button
          type="submit"
          disabled={adding || !cityName.trim()}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#BE4565] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#96334F] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={17} />
          {adding ? "Adding..." : "Add City"}
        </button>
      </form>

      {/* Feedback */}
      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-[#96334F]">
          {error}
        </p>
      )}

      {message && (
        <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-[#96334F]">
          {message}
        </p>
      )}

      {/* Search and Filter */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities..."
            className="w-full rounded-lg border border-rose-100 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#BE4565]"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-rose-100 bg-white px-4 py-2 text-sm outline-none focus:border-[#BE4565]"
        >
          <option value="all">All Cities</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Cities Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[550px] text-left text-sm">
          <thead className="border-b border-rose-100 bg-rose-50/60 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">City Name</th>
              <th className="px-4 py-3 font-semibold">Added On</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-rose-50">
            {loading ? (
              <tr>
                <td colSpan="4" className="py-10 text-center text-gray-500">
                  Loading cities...
                </td>
              </tr>
            ) : cities.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-10 text-center text-gray-500">
                  No cities found.
                </td>
              </tr>
            ) : (
              cities.map((city) => (
                <tr key={city._id} className="hover:bg-rose-50/40">
                  <td className="px-4 py-4 font-medium text-[#29232A]">
                    {city.name}
                  </td>

                  <td className="px-4 py-4 text-gray-600">
                    {new Date(city.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        city.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {city.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => handleStatusChange(city)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-[#96334F] hover:bg-rose-100"
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

      <p className="mt-4 text-xs text-gray-500">
        Total cities displayed: {cities.length}
      </p>
    </section>
  );
}

export default CitiesManagement;
