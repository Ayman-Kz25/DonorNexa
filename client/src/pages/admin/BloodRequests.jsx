import BloodRequestsManagement from "../../components/admin/BloodRequestsManagement";

const BloodRequests = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-[#302923]">
          Blood Requests Management
        </h1>
        <p className="mt-1 text-sm text-[#81756A]">
          Monitor blood requests submitted by registered hospitals.
        </p>
      </div>

      <BloodRequestsManagement />
    </div>
  );
};

export default BloodRequests;
