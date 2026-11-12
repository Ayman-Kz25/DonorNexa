import CitiesManagementContent from "../../components/admin/CitiesManagement";

function CityManagement() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm font-medium text-[#87364D]">
          Administration
        </p>
        <h1 className="font-serif text-2xl font-semibold text-[#302923]">
          City Management
        </h1>
        <p className="mt-1 text-sm text-[#81756A]">
          Manage the cities available for donors and hospitals on DonorNexa.
        </p>
      </div>

      <CitiesManagementContent />
    </div>
  );
}

export default CityManagement;
