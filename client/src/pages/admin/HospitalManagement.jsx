import HospitalManagementContent from "../../components/admin/HospitalManagement";

const HospitalManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-[#302923]">
          Hospital Management
        </h1>
        <p className="mt-1 text-sm text-[#81756A]">
          Review hospital registrations and manage verification and account
          status.
        </p>
      </div>

      <HospitalManagementContent />
    </div>
  );
};

export default HospitalManagement;
