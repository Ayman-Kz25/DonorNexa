import DonorMatchedRequests from "../../components/donor/DonorMatchedRequests";

function DonorRequests() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
          Donor Portal
        </p>

        <h1 className="mt-2 font-serif text-3xl font-semibold text-[#302923] sm:text-4xl">
          Blood Requests
        </h1>

        <p className="mt-3 text-sm text-[#81756A]">
          View blood requests that match your blood group and donor details.
        </p>
      </section>

      <DonorMatchedRequests />
    </div>
  );
}

export default DonorRequests;
