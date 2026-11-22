import { UserRound } from "lucide-react";
import DonorProfileForm from "../../components/donor/DonorProfileForm";
import DonorAvailability from "../../components/donor/DonorAvailability";

function DonorProfile() {
  return (
    <main className="mx-auto min-w-0 w-full max-w-full space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Page Heading */}
      <section className="min-w-0">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A45B6D] sm:mb-2 sm:text-xs sm:tracking-[0.16em]">
          Donor Portal
        </p>

        <h1 className="font-serif text-xl font-semibold leading-tight text-[#302923] sm:text-2xl lg:text-3xl">
          My Profile
        </h1>

        <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#81756A] sm:mt-2 sm:text-sm sm:leading-6">
          Manage your personal information and donation preferences.
        </p>
      </section>

      {/* Personal Information */}
      <section className="min-w-0 overflow-hidden rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] shadow-sm sm:rounded-xl">
        <div className="flex min-w-0 items-center gap-2.5 border-b border-[#E8DDD4] px-3.5 py-3 sm:gap-3 sm:px-5 sm:py-4 lg:px-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#963D54] sm:h-10 sm:w-10 sm:rounded-xl">
            <UserRound size={18} className="sm:hidden" />
            <UserRound size={20} className="hidden sm:block" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-5 text-[#302923] sm:text-base">
              Personal Information
            </h2>

            <p className="mt-0.5 text-[11px] leading-4 text-[#927E70] sm:text-xs sm:leading-5">
              Your registered donor details
            </p>
          </div>
        </div>

        <div className="min-w-0 p-3.5 sm:p-5 lg:p-6">
          <DonorProfileForm />
        </div>
      </section>

      {/* Donation Availability */}
      <section className="min-w-0 overflow-hidden rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] shadow-sm sm:rounded-xl">
        <div className="border-b border-[#E8DDD4] px-3.5 py-3 sm:px-5 sm:py-4 lg:px-6">
          <h2 className="text-sm font-semibold leading-5 text-[#302923] sm:text-base">
            Donation Availability
          </h2>

          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#927E70] sm:text-xs sm:leading-5">
            Control whether you are currently available to donate blood.
          </p>
        </div>

        <div className="min-w-0 p-3.5 sm:p-5 lg:p-6">
          <DonorAvailability />
        </div>
      </section>
    </main>
  );
}

export default DonorProfile;
