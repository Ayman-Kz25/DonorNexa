import UserManagementContent from "../../components/admin/UserManagement";

function UserManagement() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm font-medium text-[#87364D]">
          Administration
        </p>
        <h1 className="font-serif text-2xl font-semibold text-[#302923]">
          User Management
        </h1>
        <p className="mt-1 text-sm text-[#81756A]">
          View, search, and manage DonorNexa users and account statuses.
        </p>
      </div>

      <UserManagementContent />
    </div>
  );
}

export default UserManagement;
