import { HeartHandshake } from "lucide-react";
import DonorDonationHistory from "../../components/donor/DonorDonationHistory";

function MyDonations() {
  return (
    <main className="mx-auto min-w-0 w-full max-w-full space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Page Heading */}
      <section className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A45B6D] sm:text-xs sm:tracking-[0.18em]">
          Donor Portal
        </p>

        <h1 className="mt-1.5 font-serif text-xl font-semibold leading-tight text-[#302923] sm:mt-2 sm:text-2xl lg:text-3xl">
          My Donations
        </h1>

        <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#81756A] sm:mt-2 sm:text-sm sm:leading-6">
          View your previous blood donations and keep track of your
          contribution.
        </p>
      </section>

      {/* Donation Records */}
      <section className="min-w-0 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 shadow-sm sm:rounded-xl sm:p-4 lg:p-5">
        <div className="mb-4 flex min-w-0 items-center gap-2.5 border-b border-[#E8DDD4] pb-3 sm:mb-5 sm:gap-3 sm:pb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#963D54] sm:h-10 sm:w-10 sm:rounded-xl">
            <HeartHandshake size={19} className="sm:hidden" />
            <HeartHandshake size={21} className="hidden sm:block" />
          </div>

          <div className="min-w-0">
            <h2 className="font-serif text-base font-semibold leading-tight text-[#302923] sm:text-lg">
              Donation Records
            </h2>

            <p className="mt-1 text-[11px] leading-4 text-[#927E70] sm:text-xs sm:leading-5">
              A record of your completed blood donations.
            </p>
          </div>
        </div>

        <DonorDonationHistory />
      </section>
    </main>
  );
}

export default MyDonations;
