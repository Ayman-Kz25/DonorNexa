import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Power,
  MapPin,
  Mail,
  ShieldCheck,
  FileText,
  ExternalLink,
  CalendarDays,
  Download,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

function HospitalManagement() {
  const { request } = useApi();

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [exporting, setExporting] = useState(false);

  const fetchHospitals = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/admin/users",
        params: {
          role: "hospital",
          page: 1,
          limit: 50,
        },
      });

      console.log("Hospital API response:", response.data.users);

      setHospitals((response.data.users || []).filter((user) => user.hospital));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load hospitals.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((user) => {
      const hospital = user.hospital;

      const matchesSearch = [
        hospital.hospitalName,
        hospital.licenseNumber,
        user.name,
        user.email,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search.toLowerCase()));

      const matchesFilter =
        filter === "all" ||
        hospital.verificationStatus === filter ||
        (filter === "inactive" && !hospital.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [hospitals, search, filter]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError("");

      const params = { search: search.trim() };

      if (filter === "inactive") {
        params.isActive = "false";
      } else if (filter !== "all") {
        params.verificationStatus = filter;
      }

      const response = await request({
        method: "GET",
        url: "/api/admin/hospitals/export",
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const fileUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = fileUrl;
      link.download = "donornexa-hospitals.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      setError("Unable to export hospital records.");
    } finally {
      setExporting(false);
    }
  };

  const handleViewLicense = async (hospitalId) => {
    // Open a blank tab immediately to avoid popup blocking.
    const newTab = window.open("", "_blank");

    if (!newTab) {
      setError("Please allow pop-ups to view the license document.");
      return;
    }

    try {
      setError("");

      const response = await request({
        method: "GET",
        url: `/api/hospitals/${hospitalId}/license`,
        responseType: "blob",
      });

      const fileUrl = URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );

      newTab.location.href = fileUrl;

      // Release the temporary URL after the PDF has had time to load.
      setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
    } catch (err) {
      newTab.close();
      setError(
        err.response?.data?.message || "Unable to open the license document.",
      );
    }
  };

  const handleApprove = async (hospitalId) => {
    try {
      setProcessingId(hospitalId);
      setError("");
      setMessage("");

      const response = await request({
        method: "PATCH",
        url: `/api/hospitals/${hospitalId}/approve`,
      });

      setMessage(response.data.message || "Hospital approved successfully.");
      await fetchHospitals();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to approve hospital.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (hospitalId) => {
    const reason = window.prompt(
      "Enter the reason for rejecting this hospital:",
    );

    if (!reason?.trim()) return;

    try {
      setProcessingId(hospitalId);
      setError("");
      setMessage("");

      const response = await request({
        method: "PATCH",
        url: `/api/hospitals/${hospitalId}/reject`,
        data: { reason: reason.trim() },
      });

      setMessage(response.data.message || "Hospital rejected successfully.");
      await fetchHospitals();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reject hospital.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatusChange = async (hospital) => {
    const isActive = !hospital.isActive;
    let reason = "";

    if (!isActive) {
      reason = window.prompt(
        "Enter the reason for deactivating this hospital:",
      );

      if (!reason?.trim()) return;
    }

    try {
      setProcessingId(hospital._id);
      setError("");
      setMessage("");

      const response = await request({
        method: "PATCH",
        url: `/api/admin/hospitals/${hospital._id}/status`,
        data: {
          isActive,
          ...(!isActive ? { reason: reason.trim() } : {}),
        },
      });

      setMessage(response.data.message || "Hospital status updated.");
      await fetchHospitals();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update hospital status.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const statusStyles = {
    pending: "bg-amber-50 text-amber-700",
    verified: "bg-[#F2E2DC] text-[#782B40]",
    rejected: "bg-red-50 text-red-700",
  };

  return (
    <section className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-[#302923]">
            <Building2 size={21} className="text-[#87364D]" />
            Hospital Management
          </h2>
          <p className="mt-1 text-sm text-[#81756A]">
            Review registrations and manage hospital accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting || hospitals.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={15} />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            onClick={fetchHospitals}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8DDD4] px-4 py-2.5 text-sm font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: hospitals.length },
          {
            label: "Pending",
            value: hospitals.filter(
              (h) => h.hospital.verificationStatus === "pending",
            ).length,
          },
          {
            label: "Verified",
            value: hospitals.filter(
              (h) => h.hospital.verificationStatus === "verified",
            ).length,
          },
          {
            label: "Rejected",
            value: hospitals.filter(
              (h) => h.hospital.verificationStatus === "rejected",
            ).length,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] p-4"
          >
            <p className="text-xs text-[#81756A]">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#302923]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

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
            placeholder="Search hospital, contact person, or email..."
            className="w-full rounded-xl border border-[#E8DDD4] bg-white py-2.5 pl-10 pr-3 text-sm text-[#302923] outline-none focus:border-[#A45B6D]"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-[#E8DDD4] bg-white px-4 py-2.5 text-sm text-[#302923] outline-none focus:border-[#A45B6D]"
        >
          <option value="all">All Hospitals</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-[#81756A]">
          Loading hospitals...
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="py-12 text-center">
          <Building2 size={35} className="mx-auto mb-3 text-[#C8BDB3]" />
          <p className="text-sm font-medium text-[#302923]">
            No hospitals found.
          </p>
          <p className="mt-1 text-xs text-[#81756A]">
            Try changing your search or filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHospitals.map((user) => {
            const hospital = user.hospital;
            const isProcessing = processingId === hospital._id;

            return (
              <div
                key={hospital._id}
                className="rounded-xl border border-[#E8DDD4] bg-white p-4 transition hover:border-[#D8B7BE] sm:p-5"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#302923]">
                        {hospital.hospitalName}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                          statusStyles[hospital.verificationStatus] ||
                          "bg-[#F0EAE3] text-[#81756A]"
                        }`}
                      >
                        {hospital.verificationStatus}
                      </span>

                      {hospital.verificationStatus === "verified" && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            hospital.isActive
                              ? "bg-[#F2E2DC] text-[#782B40]"
                              : "bg-[#F0EAE3] text-[#81756A]"
                          }`}
                        >
                          {hospital.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-[#81756A] sm:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <ShieldCheck size={15} />
                        {hospital.licenseNumber}
                      </p>

                      <p className="flex items-center gap-2">
                        <Mail size={15} />
                        {user.email}
                      </p>

                      <p className="flex items-center gap-2">
                        <MapPin size={15} />
                        {hospital.city}
                      </p>

                      <p className="flex items-center gap-2">
                        <Building2 size={15} />
                        {user.name || "Unknown contact"}
                      </p>
                    </div>

                    {/* License document and expiry date */}
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#F0EAE3] pt-3">
                      {hospital.licenseDocument?.fileUrl ? (
                        <button
                          type="button"
                          onClick={() => handleViewLicense(hospital._id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] px-3 py-2 text-xs font-semibold text-[#782B40] transition hover:border-[#CDA5A5] hover:bg-[#F2E2DC]"
                        >
                          <FileText size={15} />
                          View License PDF
                          <ExternalLink size={13} />
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-xs text-red-600">
                          <FileText size={15} />
                          License document unavailable
                        </span>
                      )}

                      {hospital.licenseExpiryDate && (
                        <span className="inline-flex items-center gap-2 text-xs text-[#81756A]">
                          <CalendarDays size={15} />
                          Expires:{" "}
                          {new Date(
                            hospital.licenseExpiryDate,
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {hospital.verificationStatus === "rejected" &&
                      hospital.rejectionReason && (
                        <p className="mt-3 text-xs text-red-700">
                          Rejection reason: {hospital.rejectionReason}
                        </p>
                      )}

                    {!hospital.isActive && hospital.deactivationReason && (
                      <p className="mt-2 text-xs text-[#81756A]">
                        Deactivation reason: {hospital.deactivationReason}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-start gap-2">
                    {hospital.verificationStatus === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(hospital._id)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#782B40] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#963D54] disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          Approve
                        </button>

                        <button
                          onClick={() => handleReject(hospital._id)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </>
                    )}

                    {hospital.verificationStatus === "verified" && (
                      <button
                        onClick={() => handleStatusChange(hospital)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8DDD4] px-3 py-2 text-xs font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50"
                      >
                        <Power size={14} />
                        {hospital.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}

                    {isProcessing && (
                      <span className="self-center text-xs text-[#81756A]">
                        Processing...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-5 text-xs text-[#81756A]">
        Hospitals displayed: {filteredHospitals.length}
      </p>
    </section>
  );
}

export default HospitalManagement;
