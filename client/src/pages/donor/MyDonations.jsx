import { HeartHandshake } from "lucide-react";
import DonorDonationHistory from "../../components/donor/DonorDonationHistory";

function MyDonations() {
  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
          Donor Portal
        </p>

        <h1 className="mt-2 font-serif text-3xl font-semibold text-[#302923] sm:text-4xl">
          My Donations
        </h1>

        <p className="mt-3 text-sm text-[#81756A]">
          View your previous blood donations and keep track of your
          contribution.
        </p>
      </section>

      {/* Donation Records */}
      <section className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3 border-b border-[#E8DDD4] pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#963D54]">
            <HeartHandshake size={22} />
          </div>

          <div>
            <h2 className="font-serif text-xl font-semibold text-[#302923]">
              Donation Records
            </h2>

            <p className="mt-1 text-sm text-[#927E70]">
              A record of your completed blood donations.
            </p>
          </div>
        </div>

        <DonorDonationHistory />
      </section>
    </div>
  );
}

export default MyDonations;
