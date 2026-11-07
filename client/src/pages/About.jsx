import { Link } from "react-router-dom";
import {
  Heart,
  Target,
  Eye,
  ShieldCheck,
  Users,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import { useCurrentUser } from "../context/UserContext";

function About() {
  const { user, userLoading } = useCurrentUser();
  const role = user?.role;

  const getAboutCTA = () => {
    if (userLoading) {
      return {
        heading: "Discover DonorNexa.",
        description: "Connecting donors and hospitals through one platform.",
        text: "Explore DonorNexa",
        link: "/find-donors",
      };
    }

    if (!user) {
      return {
        heading: "Be Part of Something Meaningful.",
        description:
          "Join DonorNexa and help build a more connected blood donation community.",
        text: "Get Started",
        link: "/find-donors",
      };
    }

    switch (role) {
      case "donor":
        return {
          heading: "Your Contribution Matters.",
          description:
            "Manage your donor profile and keep your availability updated.",
          text: "Donor Dashboard",
          link: "/donor/dashboard",
        };

      case "hospital":
        return {
          heading: "Connect With Potential Donors.",
          description:
            "Access your hospital dashboard to manage requests and donor matching.",
          text: "Hospital Dashboard",
          link: "/hospital/dashboard",
        };

      case "admin":
        return {
          heading: "Keep DonorNexa Connected.",
          description:
            "Oversee platform activities through your administration dashboard.",
          text: "Admin Dashboard",
          link: "/admin/dashboard",
        };

      default:
        return {
          heading: "Be Part of Something Meaningful.",
          description: "Explore how DonorNexa connects donors and hospitals.",
          text: "Get Started",
          link: "/find-donors",
        };
    }
  };

  const aboutCTA = getAboutCTA();

  const values = [
    {
      icon: Heart,
      title: "Compassion",
      description:
        "We believe that helping others begins with care, kindness, and a willingness to make a difference.",
    },
    {
      icon: ShieldCheck,
      title: "Trust & Privacy",
      description:
        "We prioritize secure access, hospital verification, and responsible handling of donor information.",
    },
    {
      icon: Users,
      title: "Community",
      description:
        "We aim to bring donors and hospitals together through an organized coordination platform.",
    },
  ];

  const purpose = [
    {
      icon: Target,
      title: "Our Mission",
      description:
        "To simplify blood donation coordination by connecting available donors with verified hospitals through a centralized digital platform.",
    },
    {
      icon: Eye,
      title: "Our Vision",
      description:
        "To contribute towards a more connected and organized blood donation community where finding potential donors becomes easier and faster.",
    },
  ];

  return (
    <div className="bg-[#FFF8FA] text-[#29232A]">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-32 text-center md:pt-40">
        <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-32 h-96 w-96 rounded-full bg-[#FCE7ED] blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-[#BE4565] shadow-lg shadow-rose-200/50 ring-1 ring-rose-200/40">
            <HeartHandshake size={34} />
          </div>

          <p className="mt-6 font-semibold tracking-wide text-[#BE4565]">
            ABOUT DONORNEXA
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Connecting People Through
            <span className="block bg-gradient-to-r from-[#BE4565] to-[#96334F] bg-clip-text text-transparent mt-3">
              The Gift of Life.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            DonorNexa is a blood donation coordination platform designed to make
            connections between potential donors and hospitals easier, more
            organized, and more accessible.
          </p>
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="border-y border-rose-100 bg-gradient-to-b from-white to-[#FFF3F6] px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2">
          {purpose.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/70 p-8 shadow-xl shadow-rose-100/60 ring-1 ring-rose-200/40 backdrop-blur-xl sm:p-10"
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-rose-200/40 blur-3xl" />

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-[#BE4565] shadow-inner shadow-white/70 ring-1 ring-white/70">
                    <Icon size={28} />
                  </div>

                  <h2 className="mt-6 text-2xl font-bold">{item.title}</h2>

                  <p className="mt-4 leading-8 text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Values */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <p className="font-semibold tracking-wide text-[#BE4565]">
            WHAT WE BELIEVE IN
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Our Core Values
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
            The principles that guide the way DonorNexa is designed and
            developed.
          </p>
        </div>

        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {values.map((value) => {
            const Icon = value.icon;

            return (
              <div
                key={value.title}
                className="group rounded-3xl border border-rose-100 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-rose-200 hover:shadow-2xl hover:shadow-rose-200/60"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCE7ED] text-[#BE4565] transition duration-300 group-hover:bg-[#BE4565] group-hover:text-white">
                  <Icon size={28} />
                </div>

                <h3 className="mt-6 text-xl font-bold">{value.title}</h3>

                <p className="mt-3 leading-7 text-gray-600">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Important Information */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/80 bg-gradient-to-r from-[#FCE7ED] via-rose-50 to-[#FCE7ED] p-8 shadow-xl shadow-rose-100/60 ring-1 ring-rose-200/50 sm:p-12">
          <div className="flex flex-col items-start gap-5 sm:flex-row">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#96334F] shadow-md shadow-rose-200/60">
              <ShieldCheck size={30} />
            </span>

            <div>
              <h2 className="text-2xl font-bold text-[#96334F]">
                Our Responsibility
              </h2>

              <p className="mt-4 leading-8 text-gray-700">
                DonorNexa is a coordination platform, not a medical
                decision-making system. Blood compatibility and donor
                eligibility information provided by the platform is preliminary.
                Final suitability, testing, and donation decisions must always
                be confirmed by qualified healthcare professionals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#96334F] to-[#7A2840] px-8 py-16 text-center text-white shadow-2xl shadow-rose-300/40">
          <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-rose-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#BE4565]/40 blur-3xl" />

          <div className="relative">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
              <HeartHandshake size={28} />
            </span>

            <h2 className="mt-6 text-3xl font-bold sm:text-4xl">
              {aboutCTA.heading}
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-rose-100">
              {aboutCTA.description}
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

export default About;
