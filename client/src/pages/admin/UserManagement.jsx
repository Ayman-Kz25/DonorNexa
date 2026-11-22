import UserManagementContent from "../../components/admin/UserManagement";

function UserManagement() {
  return (
    <div className="min-w-0 w-full space-y-4 sm:space-y-6">
      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-medium text-[#87364D] sm:text-sm">
          Administration
        </p>

        <h1 className="font-serif text-xl font-semibold text-[#302923] min-[400px]:text-2xl">
          User Management
        </h1>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-[#81756A] sm:text-sm">
          View, search, and manage DonorNexa users and account statuses.
        </p>
      </div>

      <UserManagementContent />
    </div>
  );
}

export default UserManagement;
