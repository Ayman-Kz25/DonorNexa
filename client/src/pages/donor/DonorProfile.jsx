import { UserRound } from "lucide-react";
import DonorProfileForm from "../../components/donor/DonorProfileForm";
import DonorAvailability from "../../components/donor/DonorAvailability";

function DonorProfile() {
  return (
    <div className="space-y-7">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#BE4565] mb-2">
          Donor Portal
        </p>

        <h1 className="font-serif text-3xl font-semibold text-[#302923] sm:text-4xl">
          My Profile
        </h1>

        <p className="mt-2 text-sm text-[#817780]">
          Manage your personal information and donation preferences.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#F0DDE3] bg-white shadow-[0_4px_24px_rgba(92,35,54,0.04)]">
        <div className="flex items-center gap-3 border-b border-[#F3E7EB] px-5 py-4 sm:px-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCEBF0] text-[#BE4565]">
            <UserRound size={20} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-[#29232A]">
              Personal Information
            </h2>
            <p className="mt-0.5 text-xs text-[#8C8087]">
              Your registered donor details
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <DonorProfileForm />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#F0DDE3] bg-white shadow-[0_4px_24px_rgba(92,35,54,0.04)]">
        <div className="border-b border-[#F3E7EB] px-5 py-4 sm:px-7">
          <h2 className="text-base font-semibold text-[#29232A]">
            Donation Availability
          </h2>
          <p className="mt-1 text-xs text-[#8C8087]">
            Control whether you are currently available to donate blood.
          </p>
        </div>

        <div className="p-5 sm:p-7">
          <DonorAvailability />
        </div>
      </section>
    </div>
  );
}

export default DonorProfile;
