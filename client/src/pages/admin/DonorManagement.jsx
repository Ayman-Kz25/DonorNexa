import DonorManagementContent from "../../components/admin/DonorManagement";

const DonorManagement = () => {
  return (
    <div className="min-w-0 w-full space-y-4 sm:space-y-5 lg:space-y-6">
      <div className="min-w-0">
        <h1 className="font-serif text-xl font-semibold text-[#302923] sm:text-2xl lg:text-3xl">
          Donor Management
        </h1>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-[#81756A] sm:text-sm">
          View donor profiles, blood groups, availability, and account status.
        </p>
      </div>

      <DonorManagementContent />
    </div>
  );
};

export default DonorManagement;