import { Link } from "react-router-dom";
import {
  Heart,
  HeartHandshake,
  Search,
  ShieldCheck,
  Users,
  ArrowRight,
  Droplet,
  CheckCircle2,
  MapPin,
  ChevronDown,
} from "lucide-react";

function Home() {
  const steps = [
    {
      icon: Users,
      title: "Register",
      description:
        "Create your donor account and add your blood group and location.",
    },
    {
      icon: Search,
      title: "Find a Match",
      description:
        "Hospitals can find available donors based on blood compatibility and location.",
    },
    {
      icon: HeartHandshake,
      title: "Save a Life",
      description: "Respond to donation requests and help patients in need.",
    },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: "Verified Hospitals",
      description:
        "Hospital accounts are reviewed before they can create blood requests.",
    },
    {
      icon: Search,
      title: "Smart Donor Matching",
      description:
        "Find potential donors using blood group compatibility and city.",
    },
    {
      icon: Heart,
      title: "Emergency Requests",
      description:
        "View active blood requests and help connect donors with hospitals.",
    },
  ];

  const trustPoints = [
    { icon: ShieldCheck, label: "Verified hospitals" },
    { icon: Droplet, label: "Blood group matching" },
    { icon: MapPin, label: "City-based search" },
  ];

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const eligibility = [
    "You are in good health and feeling well on the day of donation",
    "You meet the age and minimum weight requirements set by your local blood bank",
    "You have not donated blood recently",
    "You are willing to respond when a hospital in your city needs you",
  ];

  const faqs = [
    {
      q: "Who can create a blood request?",
      a: "Only hospital accounts that have been reviewed can create blood requests, which keeps requests trustworthy.",
    },
    {
      q: "How are donors matched?",
      a: "Donors are matched using blood group compatibility and the city they registered in.",
    },
    {
      q: "Do I have to donate every time I'm contacted?",
      a: "No. You can respond to the requests that fit your availability and health.",
    },
  ];

  return (
    <div className="bg-[#FFF8FA] text-[#29232A]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Soft background glows */}
        <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-[#FCE7ED] blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-16 pt-32 md:grid-cols-2 md:pb-24 md:pt-40">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-medium text-[#96334F] shadow-sm shadow-rose-200/40 ring-1 ring-rose-200/40 backdrop-blur-md">
              <Droplet size={16} className="text-[#BE4565]" />
              Every Donation Matters
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Connecting Donors.
              <span className="block bg-gradient-to-r from-[#BE4565] to-[#96334F] bg-clip-text text-transparent">
                Bridging Lives.
              </span>
              Saving Hope.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              DonorNexa helps connect blood donors with hospitals through a
              simple and reliable donation coordination platform. Your
              availability could make a difference in someone's life.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/find-donors"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#BE4565] to-[#A83A58] px-7 py-3.5 font-semibold text-white shadow-lg shadow-rose-400/30 ring-1 ring-white/30 transition duration-200 hover:from-[#A83A58] hover:to-[#96334F] hover:shadow-rose-400/50"
              >
                Find Donors
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/emergency"
                className="rounded-full border border-[#BE4565]/50 bg-white/50 px-7 py-3.5 font-semibold text-[#96334F] backdrop-blur-md transition duration-200 hover:bg-white/90 hover:shadow-md hover:shadow-rose-200/50"
              >
                View Blood Requests
              </Link>
            </div>

            {/* Trust row */}
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {trustPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <li
                    key={point.label}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FCE7ED] text-[#BE4565]">
                      <Icon size={15} />
                    </span>
                    {point.label}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Hero Visual */}
          <div className="relative mx-auto flex w-full max-w-lg items-center justify-center">
            <div className="absolute h-72 w-72 rounded-full bg-[#FCE7ED] blur-2xl sm:h-96 sm:w-96" />

            <div className="relative flex aspect-square w-full max-w-md items-center justify-center rounded-[40px] border border-white/80 bg-gradient-to-br from-white/80 to-rose-50/70 shadow-2xl shadow-rose-200/60 ring-1 ring-rose-200/40 backdrop-blur-xl">
              <div className="flex h-52 w-52 items-center justify-center rounded-full bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 shadow-inner shadow-white/70 ring-8 ring-white/50">
                <Heart
                  size={120}
                  strokeWidth={1.3}
                  className="fill-[#BE4565] text-[#BE4565] drop-shadow-lg"
                />
              </div>

              <div className="absolute bottom-10 right-4 rounded-2xl border border-white/80 bg-white/70 px-5 py-3 shadow-lg shadow-rose-200/50 ring-1 ring-rose-200/40 backdrop-blur-xl sm:right-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#FCE7ED] p-2 text-[#BE4565]">
                    <HeartHandshake size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Be a Donor</p>
                    <p className="text-xs text-gray-500">Make a difference</p>
                  </div>
                </div>
              </div>

              <div className="absolute left-4 top-10 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-lg shadow-rose-200/50 ring-1 ring-rose-200/40 backdrop-blur-xl sm:left-0">
                <div className="flex items-center gap-2">
                  <Droplet size={20} className="text-[#BE4565]" />
                  <span className="text-sm font-semibold text-[#96334F]">
                    Blood Donation
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blood Groups */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/80 bg-gradient-to-r from-white/80 via-rose-50/70 to-white/80 px-6 py-8 shadow-xl shadow-rose-100/60 ring-1 ring-rose-200/40 backdrop-blur-xl sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold">Looking for a specific blood group?</h2>
              <p className="mt-2 leading-7 text-gray-600">
                Start with the blood group you need and find compatible donors
                in your city.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {bloodGroups.map((group) => (
                <Link
                  key={group}
                  to="/find-donors"
                  className="flex h-14 w-16 items-center justify-center rounded-2xl border border-rose-100 bg-white/80 text-lg font-bold text-[#96334F] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-transparent hover:bg-gradient-to-br hover:from-[#BE4565] hover:to-[#96334F] hover:text-white hover:shadow-lg hover:shadow-rose-300/50 sm:h-16 sm:w-20 sm:text-xl"
                >
                  {group}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mt-16 border-y border-rose-100 bg-gradient-to-b from-white to-[#FFF3F6] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold tracking-wide text-[#BE4565]">
              HOW IT WORKS
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Three Steps. One Meaningful Impact.
            </h2>
            <p className="mt-4 text-gray-600">
              A simple process to help donors and hospitals connect.
            </p>
          </div>

          <div className="relative mt-14 grid gap-8 md:grid-cols-3">
            {/* Connecting line behind the cards on desktop */}
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-16 hidden h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent md:block" />

            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="relative rounded-3xl border border-white/80 bg-white/70 p-8 shadow-lg shadow-rose-100/50 ring-1 ring-rose-200/40 backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-rose-200/60"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-[#BE4565] shadow-inner shadow-white/70 ring-1 ring-white/70">
                    <Icon size={28} />
                  </div>

                  <p className="mt-6 text-sm font-semibold tracking-wide text-[#BE4565]">
                    STEP 0{index + 1}
                  </p>

                  <h3 className="mt-2 text-xl font-bold">{step.title}</h3>

                  <p className="mt-3 leading-7 text-gray-600">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="font-semibold tracking-wide text-[#BE4565]">
            WHY DONORNEXA
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Bringing the Right People Together
          </h2>
          <p className="mt-4 leading-7 text-gray-600">
            Designed to make blood donation coordination more organized,
            accessible, and transparent.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-3xl border border-rose-100 bg-white p-7 shadow-sm transition duration-300 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-100/70"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FCE7ED] text-[#BE4565] transition duration-300 group-hover:bg-[#BE4565] group-hover:text-white">
                  <Icon size={24} />
                </div>

                <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>

                <p className="mt-3 leading-7 text-gray-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Eligibility + FAQ */}
      <section className="border-t border-rose-100 bg-white px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          {/* Eligibility */}
          <div>
            <p className="font-semibold tracking-wide text-[#BE4565]">
              BEFORE YOU DONATE
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Ready to Become a Donor?
            </h2>
            <p className="mt-4 leading-7 text-gray-600">
              Eligibility rules can vary, so always follow the guidance of your
              local blood bank or hospital.
            </p>

            <ul className="mt-8 space-y-4">
              {eligibility.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-[#FFF8FA] p-4"
                >
                  <CheckCircle2
                    size={22}
                    className="mt-0.5 shrink-0 text-[#BE4565]"
                  />
                  <span className="leading-7 text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* FAQ */}
          <div>
            <p className="font-semibold tracking-wide text-[#BE4565]">
              GOOD TO KNOW
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Common Questions
            </h2>

            <div className="mt-8 space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-rose-100 bg-[#FFF8FA] p-5 transition open:bg-white open:shadow-lg open:shadow-rose-100/60"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#29232A] [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <ChevronDown
                      size={20}
                      className="shrink-0 text-[#BE4565] transition duration-300 group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 leading-7 text-gray-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#96334F] to-[#7A2840] px-8 py-16 text-center text-white shadow-2xl shadow-rose-300/40 sm:px-16">
          <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-rose-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#BE4565]/40 blur-3xl" />

          <div className="relative">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
              <HeartHandshake size={28} />
            </span>

            <h2 className="mt-6 text-3xl font-bold sm:text-4xl">
              Your One Step Can Make a Difference.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-rose-100">
              Become part of a community working to make blood donation
              coordination easier.
            </p>

            <Link
              to="/find-donors"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-[#96334F] shadow-lg shadow-black/10 transition duration-200 hover:bg-rose-50 hover:shadow-xl"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;