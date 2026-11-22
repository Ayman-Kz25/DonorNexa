import { Droplet, HeartHandshake, ShieldCheck } from "lucide-react";
import DonorMatchedRequests from "../../components/donor/DonorMatchedRequests";

function DonorRequests() {
  return (
    <main className="mx-auto min-w-0 w-full max-w-full space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Page Heading */}
      <section className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-[#E8DDD4] bg-gradient-to-br from-[#FFF8F8] via-[#FFFDF9] to-[#F8F0EC] p-4 sm:items-center sm:gap-5 sm:p-5 lg:p-7">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A45B6D] sm:text-[11px] sm:tracking-[0.17em]">
            Donor Portal
          </p>

          <h1 className="mt-1.5 font-serif text-xl font-semibold leading-tight text-[#302923] sm:mt-2 sm:text-2xl lg:text-3xl xl:text-4xl">
            Blood Requests
          </h1>

          <p className="mt-2 max-w-lg text-xs leading-5 text-[#81756A] sm:text-sm sm:leading-6">
            Discover blood requests matched to your blood group, location, and
            donor eligibility.
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E8DDD4] bg-white/90 text-[#963D54] shadow-sm sm:h-12 sm:w-12 lg:h-14 lg:w-14">
          <Droplet size={21} className="sm:hidden" />
          <Droplet size={25} className="hidden sm:block lg:hidden" />
          <Droplet size={28} className="hidden lg:block" />
        </div>
      </section>

      {/* Information Cards */}
      <section className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 sm:gap-3.5">
        <div className="flex min-w-0 items-start gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 sm:p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#963D54] sm:h-10 sm:w-10">
            <HeartHandshake size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-semibold text-[#302923] sm:text-sm">
              Make a Difference
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#81756A] sm:text-[13px] sm:leading-[1.4rem]">
              Respond to suitable requests to help patients in need.
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 sm:p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#963D54] sm:h-10 sm:w-10">
            <ShieldCheck size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-semibold text-[#302923] sm:text-sm">
              Your Privacy Matters
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#81756A] sm:text-[13px] sm:leading-[1.4rem]">
              Your contact information is shared with a hospital only after you
              accept a request.
            </p>
          </div>
        </div>
      </section>

      {/* Matched Requests */}
      <section className="min-w-0 w-full max-w-full">
        <DonorMatchedRequests />
      </section>
    </main>
  );
}

export default DonorRequests;
