import { Link } from "react-router-dom";
import {
  Heart,
  HeartHandshake,
  Search,
  ShieldCheck,
  Users,
  ArrowRight,
  Droplet,
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

  return (
    <div className="bg-[#FFF8FA] text-[#29232A]">
      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FCE7ED] px-4 py-2 text-sm font-medium text-[#96334F]">
            <Droplet size={16} />
            Every Donation Matters
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Connecting Donors.
            <span className="block text-[#BE4565]">Bridging Lives.</span>
            Saving Hope.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
            DonorNexa helps connect blood donors with hospitals through a simple
            and reliable donation coordination platform. Your availability could
            make a difference in someone's life.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/find-donors"
              className="inline-flex items-center gap-2 rounded-lg bg-[#BE4565] px-6 py-3 font-semibold text-white transition hover:bg-[#96334F]"
            >
              Find Donors
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/emergency-requests"
              className="rounded-lg border border-[#BE4565] px-6 py-3 font-semibold text-[#96334F] transition hover:bg-[#FCE7ED]"
            >
              View Blood Requests
            </Link>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative mx-auto flex w-full max-w-lg items-center justify-center">
          <div className="absolute h-72 w-72 rounded-full bg-[#FCE7ED] blur-2xl sm:h-96 sm:w-96" />

          <div className="relative flex aspect-square w-full max-w-md items-center justify-center rounded-[40px] border border-rose-100 bg-white shadow-xl shadow-rose-100/50">
            <div className="flex h-52 w-52 items-center justify-center rounded-full bg-[#FCE7ED]">
              <Heart
                size={120}
                strokeWidth={1.3}
                className="fill-[#BE4565] text-[#BE4565]"
              />
            </div>

            <div className="absolute bottom-10 right-4 rounded-xl border border-rose-100 bg-white px-5 py-3 shadow-lg sm:right-0">
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

            <div className="absolute left-4 top-10 rounded-xl border border-rose-100 bg-white px-4 py-3 shadow-lg sm:left-0">
              <div className="flex items-center gap-2">
                <Droplet size={20} className="text-[#BE4565]" />
                <span className="text-sm font-semibold text-[#96334F]">
                  Blood Donation
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-rose-100 bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold text-[#BE4565]">HOW IT WORKS</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Three Steps. One Meaningful Impact.
            </h2>
            <p className="mt-4 text-gray-600">
              A simple process to help donors and hospitals connect.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-2xl border border-rose-100 bg-[#FFF8FA] p-8 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-100/60"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FCE7ED] text-[#BE4565]">
                    <Icon size={28} />
                  </div>

                  <p className="mt-6 text-sm font-semibold text-[#BE4565]">
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
          <p className="font-semibold text-[#BE4565]">WHY DONORNEXA</p>
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
                className="rounded-2xl border border-rose-100 bg-white p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FCE7ED] text-[#BE4565]">
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

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-3xl bg-[#96334F] px-8 py-14 text-center text-white sm:px-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Your One Step Can Make a Difference.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-rose-100">
            Become part of a community working to make blood donation
            coordination easier.
          </p>

          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-[#96334F] transition hover:bg-rose-50"
          >
            Get Started
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
