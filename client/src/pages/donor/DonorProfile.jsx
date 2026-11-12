import { UserRound } from "lucide-react";
import DonorProfileForm from "../../components/donor/DonorProfileForm";
import DonorAvailability from "../../components/donor/DonorAvailability";

function DonorProfile() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
          Donor Portal
        </p>

        <h1 className="mt-2 font-serif text-3xl font-semibold text-[#302923] sm:text-4xl">
          My Profile
        </h1>

        <p className="mt-3 text-sm text-[#81756A]">
          Manage your personal information and donor details.
        </p>
      </section>

      <section className="w-full rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex items-center gap-3 border-b border-[#E8DDD4] pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#963D54]">
            <UserRound size={24} />
          </div>

          <div>
            <h2 className="font-serif text-xl font-semibold text-[#302923]">
              Donor Information
            </h2>
            <p className="mt-1 text-sm text-[#927E70]">
              View and update your registered information.
            </p>
          </div>
        </div>

        <DonorProfileForm />
      </section>

      <section className="mt-6 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="font-serif text-xl font-semibold text-[#302923]">
            Donation Availability
          </h2>
          <p className="mt-1 text-sm text-[#81756A]">
            Manage whether you are currently available to donate blood.
          </p>
        </div>

        <DonorAvailability />
      </section>
    </div>
  );
}

export default DonorProfile;
