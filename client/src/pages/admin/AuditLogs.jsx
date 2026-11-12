
import AuditLogsManagement from "../../components/admin/AuditLogs";

function AuditLogs() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm font-medium text-[#87364D]">
          Administration
        </p>
        <h1 className="font-serif text-2xl font-semibold text-[#302923]">
          Audit Logs
        </h1>
        <p className="mt-1 text-sm text-[#81756A]">
          Review and monitor administrative activities across DonorNexa.
        </p>
      </div>

      <AuditLogsManagement />
    </div>
  );
}

export default AuditLogs;
