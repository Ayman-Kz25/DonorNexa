import CitiesManagementContent from "../../components/admin/CitiesManagement";

function CityManagement() {
  return (
    <div className="min-w-0 w-full space-y-4 sm:space-y-5 lg:space-y-6">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-medium text-[#87364D] sm:text-sm">
          Administration
        </p>

        <h1 className="font-serif text-xl font-semibold text-[#302923] sm:text-2xl lg:text-3xl">
          City Management
        </h1>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-[#81756A] sm:text-sm">
          Manage the cities available for donors and hospitals on DonorNexa.
        </p>
      </div>

      <CitiesManagementContent />
    </div>
  );
}

export default CityManagement;
