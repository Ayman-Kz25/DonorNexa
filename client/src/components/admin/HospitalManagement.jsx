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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/dateTime";

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
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  const fetchHospitals = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const firstResponse = await request({
        method: "GET",
        url: "/api/admin/users",
        params: {
          role: "hospital",
          page: 1,
          limit: 50,
        },
      });

      const firstPageUsers = firstResponse.data.users || [];
      const totalPages = firstResponse.data.pagination?.totalPages || 1;

      let allUsers = [...firstPageUsers];

      if (totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            request({
              method: "GET",
              url: "/api/admin/users",
              params: {
                role: "hospital",
                page: index + 2,
                limit: 50,
              },
            }),
          ),
        );

        remainingPages.forEach((response) => {
          allUsers.push(...(response.data.users || []));
        });
      }

      setHospitals(allUsers.filter((user) => user.hospital));
      setCurrentPage(1);
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
      const searchTerm = search.trim().toLowerCase();

      const matchesSearch = [
        hospital.hospitalName,
        hospital.licenseNumber,
        hospital.contactPerson,
        hospital.city,
        user.name,
        user.email,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm));

      const matchesFilter =
        filter === "all" ||
        hospital.verificationStatus === filter ||
        (filter === "inactive" &&
          hospital.verificationStatus === "verified" &&
          !hospital.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [hospitals, search, filter]);

  const totalPages = Math.ceil(filteredHospitals.length / pageSize);

  const paginatedHospitals = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;

    return filteredHospitals.slice(startIndex, startIndex + pageSize);
  }, [filteredHospitals, currentPage]);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);

    return Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, index) => start + index,
    );
  }, [currentPage, totalPages]);

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

      setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
    } catch (err) {
      newTab.close();

      let errorMessage = "Unable to open the license document.";

      if (err.response?.data instanceof Blob) {
        try {
          const errorData = JSON.parse(await err.response.data.text());
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `Server error (${err.response.status}).`;
        }
      } else {
        errorMessage =
          err.response?.data?.message || err.message || errorMessage;
      }

      console.error("License viewing error:", {
        status: err.response?.status,
        data: err.response?.data,
        error: err,
      });

      setError(errorMessage);
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

  const stats = [
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
  ];

  return (
    <section className="min-w-0 w-full rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 shadow-sm min-[400px]:p-3.5 sm:rounded-2xl sm:p-5 lg:p-6">
      {/* Header */}
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-[#E8DDD4] pb-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#87364D] sm:h-11 sm:w-11 sm:rounded-xl">
            <Building2 size={18} className="sm:size-[21px]" />
          </div>

          <div className="min-w-0">
            <h2 className="font-serif text-base font-semibold text-[#302923] min-[400px]:text-lg sm:text-xl">
              Hospital Management
            </h2>

            <p className="mt-0.5 text-[10px] leading-4 text-[#81756A] min-[400px]:text-[11px] sm:mt-1 sm:text-sm">
              Review registrations and manage hospital accounts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={exporting || hospitals.length === 0}
            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg bg-[#782B40] px-2.5 py-2 text-[10px] font-semibold text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
          >
            {exporting ? (
              <Loader2 size={13} className="shrink-0 animate-spin" />
            ) : (
              <Download size={13} className="shrink-0" />
            )}
            <span className="truncate">
              {exporting ? "Exporting..." : "Export CSV"}
            </span>
          </button>

          <button
            onClick={fetchHospitals}
            disabled={loading}
            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[#E8DDD4] px-2.5 py-2 text-[10px] font-semibold text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <RefreshCw
              size={13}
              className={`shrink-0 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-4 grid grid-cols-2 gap-2 min-[480px]:gap-3 sm:mb-5 sm:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="min-w-0 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] p-2.5 min-[400px]:p-3 sm:rounded-xl sm:p-4"
          >
            <p className="text-[10px] text-[#81756A] min-[400px]:text-xs">
              {item.label}
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#302923] min-[400px]:text-xl sm:mt-1 sm:text-2xl">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {(error || message) && (
        <div
          role={error ? "alert" : "status"}
          className={`mb-4 flex min-w-0 items-start gap-2 rounded-lg border p-2.5 text-[11px] sm:mb-5 sm:gap-3 sm:rounded-xl sm:p-3 sm:text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[#E8DDD4] bg-[#F2E2DC] text-[#782B40]"
          }`}
        >
          {error && <AlertCircle size={15} className="mt-0.5 shrink-0" />}
          <span className="min-w-0 flex-1 break-words">{error || message}</span>
        </div>
      )}

      {/* Search and filter */}
      <div className="mb-4 flex min-w-0 flex-col gap-2.5 sm:mb-5 sm:flex-row sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A99D93] sm:size-[17px]"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search hospital, contact person, or email..."
            className="w-full min-w-0 rounded-lg border border-[#E8DDD4] bg-white py-2.5 pl-9 pr-3 text-xs text-[#302923] outline-none focus:border-[#A45B6D] sm:rounded-xl sm:py-2.5 sm:pl-10 sm:pr-3 sm:text-sm"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full min-w-0 rounded-lg border border-[#E8DDD4] bg-white px-3 py-2.5 text-xs text-[#302923] outline-none focus:border-[#A45B6D] sm:w-auto sm:min-w-[155px] sm:rounded-xl sm:px-4 sm:text-sm"
        >
          <option value="all">All Hospitals</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Hospital list */}
      {loading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-2 py-10 text-xs text-[#81756A] sm:py-12 sm:text-sm"
        >
          <Loader2 size={16} className="animate-spin text-[#87364D]" />
          Loading hospitals...
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="py-9 text-center sm:py-12">
          <Building2
            size={28}
            className="mx-auto mb-3 text-[#C8BDB3] sm:size-[35px]"
          />
          <p className="text-xs font-medium text-[#302923] sm:text-sm">
            No hospitals found.
          </p>
          <p className="mt-1 text-[10px] text-[#81756A] sm:text-xs">
            Try changing your search or filter.
          </p>
        </div>
      ) : (
        <div className="min-w-0 space-y-3 sm:space-y-4">
          {paginatedHospitals.map((user) => {
            const hospital = user.hospital;
            const isProcessing = processingId === hospital._id;

            return (
              <article
                key={hospital._id}
                className="min-w-0 rounded-lg border border-[#E8DDD4] bg-white p-3 transition hover:border-[#D8B7BE] min-[400px]:p-3.5 sm:rounded-xl sm:p-5"
              >
                <div className="flex min-w-0 flex-col justify-between gap-3 sm:gap-4 lg:flex-row">
                  <div className="min-w-0 flex-1">
                    {/* Hospital name and status */}
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="max-w-full break-words text-xs font-semibold text-[#302923] min-[400px]:text-sm sm:text-base">
                        {hospital.hospitalName}
                      </h3>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize sm:px-3 sm:py-1 sm:text-xs ${
                          statusStyles[hospital.verificationStatus] ||
                          "bg-[#F0EAE3] text-[#81756A]"
                        }`}
                      >
                        {hospital.verificationStatus}
                      </span>

                      {hospital.verificationStatus === "verified" && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium sm:px-3 sm:py-1 sm:text-xs ${
                            hospital.isActive
                              ? "bg-[#F2E2DC] text-[#782B40]"
                              : "bg-[#F0EAE3] text-[#81756A]"
                          }`}
                        >
                          {hospital.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="mt-2.5 grid min-w-0 grid-cols-1 gap-2 text-[10px] text-[#81756A] min-[480px]:grid-cols-2 sm:mt-3 sm:gap-2.5 sm:text-sm">
                      <p className="flex min-w-0 items-start gap-1.5">
                        <ShieldCheck
                          size={13}
                          className="mt-0.5 shrink-0 text-[#A45B6D] sm:size-[15px]"
                        />
                        <span className="min-w-0 break-all">
                          {hospital.licenseNumber}
                        </span>
                      </p>

                      <p className="flex min-w-0 items-start gap-1.5">
                        <Mail
                          size={13}
                          className="mt-0.5 shrink-0 text-[#A45B6D] sm:size-[15px]"
                        />
                        <span className="min-w-0 break-all">{user.email}</span>
                      </p>

                      <p className="flex min-w-0 items-start gap-1.5">
                        <MapPin
                          size={13}
                          className="mt-0.5 shrink-0 text-[#A45B6D] sm:size-[15px]"
                        />
                        <span className="min-w-0 break-words">
                          {hospital.city}
                        </span>
                      </p>

                      <p className="flex min-w-0 items-start gap-1.5">
                        <Building2
                          size={13}
                          className="mt-0.5 shrink-0 text-[#A45B6D] sm:size-[15px]"
                        />
                        <span className="min-w-0 break-words">
                          {user.name || "Unknown contact"}
                        </span>
                      </p>
                    </div>

                    {/* License document and expiry date */}
                    <div className="mt-3 flex min-w-0 flex-col items-start gap-2 border-t border-[#F0EAE3] pt-3 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:items-center sm:mt-4 sm:gap-3">
                      {hospital.licenseDocument?.fileUrl ? (
                        <button
                          type="button"
                          onClick={() => handleViewLicense(hospital._id)}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] px-2.5 py-1.5 text-[10px] font-semibold text-[#782B40] transition hover:border-[#CDA5A5] hover:bg-[#F2E2DC] sm:gap-2 sm:px-3 sm:py-2 sm:text-xs"
                        >
                          <FileText size={13} className="shrink-0" />
                          View License PDF
                          <ExternalLink size={11} className="shrink-0" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] text-red-600 sm:text-xs">
                          <FileText size={13} />
                          License document unavailable
                        </span>
                      )}

                      {hospital.licenseExpiryDate && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] text-[#81756A] sm:text-xs">
                          <CalendarDays
                            size={13}
                            className="shrink-0 sm:size-[15px]"
                          />
                          Expires: {formatDate(hospital.licenseExpiryDate)}
                        </span>
                      )}
                    </div>

                    {hospital.verificationStatus === "rejected" &&
                      hospital.rejectionReason && (
                        <p className="mt-2 break-words text-[10px] text-red-700 sm:mt-3 sm:text-xs">
                          Rejection reason: {hospital.rejectionReason}
                        </p>
                      )}

                    {!hospital.isActive && hospital.deactivationReason && (
                      <p className="mt-2 break-words text-[10px] text-[#81756A] sm:text-xs">
                        Deactivation reason: {hospital.deactivationReason}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2 lg:shrink-0 lg:items-start lg:justify-end">
                    {hospital.verificationStatus === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(hospital._id)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#782B40] px-2.5 py-2 text-[10px] font-medium text-white transition hover:bg-[#963D54] disabled:opacity-50 sm:gap-1.5 sm:px-3 sm:text-xs"
                        >
                          <CheckCircle2 size={12} />
                          Approve
                        </button>

                        <button
                          onClick={() => handleReject(hospital._id)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-2 text-[10px] font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 sm:gap-1.5 sm:px-3 sm:text-xs"
                        >
                          <XCircle size={12} />
                          Reject
                        </button>
                      </>
                    )}

                    {hospital.verificationStatus === "verified" && (
                      <button
                        onClick={() => handleStatusChange(hospital)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E8DDD4] px-2.5 py-2 text-[10px] font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50 sm:gap-1.5 sm:px-3 sm:text-xs"
                      >
                        <Power size={12} />
                        {hospital.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}

                    {isProcessing && (
                      <span className="self-center text-[10px] text-[#81756A] sm:text-xs">
                        Processing...
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-4 flex min-w-0 flex-col gap-3 border-t border-[#E8DDD4] pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
        <p className="text-[10px] text-[#81756A] sm:text-xs">
          Showing{" "}
          {filteredHospitals.length === 0
            ? 0
            : (currentPage - 1) * pageSize + 1}
          {" - "}
          {Math.min(currentPage * pageSize, filteredHospitals.length)}
          {" of "}
          {filteredHospitals.length} hospitals
        </p>

        {totalPages > 1 && (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-[#E8DDD4] px-2.5 py-2 text-[10px] font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-xs"
            >
              Previous
            </button>

            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                aria-current={currentPage === page ? "page" : undefined}
                className={`h-8 min-w-8 rounded-lg px-2 text-[10px] font-medium transition sm:h-9 sm:min-w-9 sm:px-3 sm:text-xs ${
                  currentPage === page
                    ? "bg-[#782B40] text-white"
                    : "border border-[#E8DDD4] text-[#782B40] hover:bg-[#F2E2DC]"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
              className="rounded-lg border border-[#E8DDD4] px-2.5 py-2 text-[10px] font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-xs"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default HospitalManagement;
