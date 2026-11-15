
import {
  Droplet,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";
import DonorMatchedRequests from "../../components/donor/DonorMatchedRequests";

function DonorRequests() {
  return (
    <div className="space-y-7">
      {/* Page Heading */}
      <section className="flex flex-col gap-4 rounded-xl border border-[#E8DDD4] bg-gradient-to-r from-[#FFF8F8] via-[#FFFDF9] to-[#F8F0EC] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
            Donor Portal
          </p>

          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#302923] sm:text-4xl">
            Blood Requests
          </h1>

          <p className="mt-2 max-w-lg text-sm leading-6 text-[#81756A]">
            Discover blood requests matched to your blood group, location,
            and donor eligibility.
          </p>
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center self-start rounded-xl border border-[#E8DDD4] bg-white text-[#963D54] shadow-sm sm:self-center">
          <Droplet size={27} />
        </div>
      </section>

      {/* Information Strip */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-4">
          <div className="rounded-lg bg-[#F2E2DC] p-2 text-[#963D54]">
            <HeartHandshake size={19} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[#302923]">
              Make a Difference
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#81756A]">
              Respond to suitable requests to help patients in need.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-4">
          <div className="rounded-lg bg-[#F2E2DC] p-2 text-[#963D54]">
            <ShieldCheck size={19} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[#302923]">
              Your Privacy Matters
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#81756A]">
              Your contact information is shared with a hospital only
              after you accept a request.
            </p>
          </div>
        </div>
      </section>

      {/* Matched Requests */}
      <DonorMatchedRequests />
    </div>
  );
}

export default DonorRequests;
