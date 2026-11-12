import DonorManagementContent from "../../components/admin/DonorManagement";

const DonorManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-[#302923]">
          Donor Management
        </h1>
        <p className="mt-1 text-sm text-[#81756A]">
          View donor profiles, blood groups, availability, and account status.
        </p>
      </div>

      <DonorManagementContent />
    </div>
  );
};

export default DonorManagement;
