import BloodInventoryManager from "../../components/hospital/BloodInventory";

const BloodInventory = () => {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
          Hospital Portal
        </p>

        <h1 className="mt-2 font-serif text-3xl font-semibold text-[#302923] sm:text-4xl">
          Blood Inventory
        </h1>

        <p className="mt-3 text-sm text-[#81756A]">
          Monitor available blood units and keep your hospital's inventory
          updated.
        </p>
      </section>

      <BloodInventoryManager />
    </div>
  );
};

export default BloodInventory;
