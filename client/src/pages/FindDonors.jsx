import { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";
import { Link } from "react-router-dom";
import {
  Search,
  ShieldCheck,
  MapPin,
  Droplet,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import { useCurrentUser } from "../context/UserContext";

const bloodGroups = [
  { group: "A+", donatesTo: "A+, AB+" },
  { group: "A-", donatesTo: "A+, A-, AB+, AB-" },
  { group: "B+", donatesTo: "B+, AB+" },
  { group: "B-", donatesTo: "B+, B-, AB+, AB-" },
  { group: "AB+", donatesTo: "AB+" },
  { group: "AB-", donatesTo: "AB+, AB-" },
  { group: "O+", donatesTo: "O+, A+, B+, AB+" },
  { group: "O-", donatesTo: "All blood groups" },
];

const matchingSteps = [
  {
    icon: ShieldCheck,
    title: "Verified Hospitals",
    description: "Only approved hospitals can access donor matching features.",
  },
  {
    icon: Droplet,
    title: "Blood Compatibility",
    description:
      "Potential donors are identified using preliminary blood group compatibility rules.",
  },
  {
    icon: MapPin,
    title: "Location-Based Search",
    description: "Matching also considers donor availability and city.",
  },
];

function FindDonors() {
  const { user, userLoading } = useCurrentUser();
  const role = user?.role;

  const { request } = useApi();

  const [verificationStatus, setVerificationStatus] = useState(null);
  const [hospitalLoading, setHospitalLoading] = useState(false);

  useEffect(() => {
    if (userLoading || role !== "hospital") return;

    const fetchHospitalStatus = async () => {
      setHospitalLoading(true);

      try {
        const response = await request({
          method: "GET",
          url: "/api/hospitals/profile",
        });

        const hospital = response.data.hospital || response.data;

        setVerificationStatus(hospital?.verificationStatus || "pending");
      } catch (error) {
        if (error.response?.status === 404) {
          setVerificationStatus("not-registered");
        } else {
          console.error(
            "Hospital Profile Error:",
            error.response?.data || error.message,
          );
          setVerificationStatus("unknown");
        }
      } finally {
        setHospitalLoading(false);
      }
    };

    fetchHospitalStatus();
  }, [userLoading, role, request]);

  const getCTA = () => {
    if (userLoading || hospitalLoading) {
      return {
        text: "Loading...",
        link: null,
      };
    }

    if (!user) {
      return {
        text: "Sign in to Continue",
        link: null,
      };
    }

    switch (role) {
      case "donor":
        return {
          text: "Go to Donor Dashboard",
          link: "/donor/dashboard",
        };

      case "hospital":
        if (verificationStatus === "verified") {
          return {
            text: "Go to Hospital Dashboard",
            link: "/hospital/dashboard",
          };
        }

        if (verificationStatus === "pending") {
          return {
            text: "View Verification Status",
            link: "/hospital/dashboard",
          };
        }

        if (verificationStatus === "rejected") {
          return {
            text: "Review Hospital Registration",
            link: "/hospital/dashboard",
          };
        }

        if (verificationStatus === "not-registered") {
          return {
            text: "Register Your Hospital",
            link: "/hospital/dashboard",
          };
        }

        return {
          text: "Check Hospital Dashboard",
          link: "/hospital/dashboard",
        };

      case "admin":
        return {
          text: "Go to Admin Dashboard",
          link: "/admin/dashboard",
        };

      default:
        return {
          text: "Sign in to Continue",
          link: null,
        };
    }
  };

  const cta = getCTA();

  return (
    <div className="min-h-screen bg-[#FFF8FA]">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-32 text-center md:pt-40">
        <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-32 h-96 w-96 rounded-full bg-[#FCE7ED] blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-[#BE4565] shadow-lg shadow-rose-200/50 ring-1 ring-rose-200/40">
            <Search size={32} />
          </div>

          <p className="mt-6 font-semibold tracking-wide text-[#BE4565]">
            DONOR DISCOVERY
          </p>

          <h1 className="myt-3 text-4xl font-bold tracking-tight text-[#29232A] sm:text-5xl">
            Find the Right Donor.
            <span className="block bg-gradient-to-r from-[#BE4565] to-[#96334F] bg-clip-text text-transparent mt-3">
              Make a Difference.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            DonorNexa helps verified hospitals identify potential blood donors
            based on blood group compatibility and location.
          </p>

          {cta.link ? (
            <Link
              to={cta.link}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#BE4565] to-[#A83A58] px-7 py-3.5 font-semibold text-white shadow-lg shadow-rose-400/30 ring-1 ring-white/30 transition duration-200 hover:from-[#A83A58] hover:to-[#96334F] hover:shadow-rose-400/50"
            >
              {cta.text}
              <ArrowRight size={18} />
            </Link>
          ) : (
            <p className="mt-8 font-medium text-[#96334F]">{cta.text}</p>
          )}
        </div>
      </section>

      {/* Blood Groups */}
      <section className="border-y border-rose-100 bg-gradient-to-b from-white to-[#FFF3F6] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#29232A]">Blood Groups</h2>
            <p className="mt-3 text-gray-600">
              Donor matching considers blood group compatibility.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {bloodGroups.map(({ group, donatesTo }) => (
              <div
                key={group}
                className="group flex flex-col items-center rounded-3xl border border-white/80 bg-white/70 px-4 py-6 text-center shadow-lg shadow-rose-100/50 ring-1 ring-rose-200/40 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-[#BE4565] hover:to-[#96334F] hover:shadow-2xl hover:shadow-rose-300/50"
              >
                <Droplet
                  size={28}
                  className="text-[#BE4565] transition group-hover:text-white"
                />
                <span className="mt-3 text-2xl font-bold text-[#96334F] transition group-hover:text-white">
                  {group}
                </span>
                <span className="mt-2 text-xs leading-5 text-gray-500 transition group-hover:text-rose-100">
                  Can donate to: {donatesTo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Matching Works */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <p className="font-semibold tracking-wide text-[#BE4565]">
            THE MATCHING PROCESS
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[#29232A]">
            How Donor Matching Works
          </h2>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {matchingSteps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="group rounded-3xl border border-rose-100 bg-white p-7 shadow-sm transition duration-300 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-100/70"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FCE7ED] text-[#BE4565] transition duration-300 group-hover:bg-[#BE4565] group-hover:text-white">
                  <Icon size={25} />
                </div>
                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                <p className="mt-3 leading-7 text-gray-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Privacy Notice */}
      <section className="px-6 pb-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 rounded-3xl border border-white/80 bg-gradient-to-r from-[#FCE7ED] via-rose-50 to-[#FCE7ED] p-8 shadow-xl shadow-rose-100/60 ring-1 ring-rose-200/50 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#BE4565] shadow-md shadow-rose-200/60">
            <HeartHandshake size={30} />
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#96334F]">
              Donor Privacy Matters
            </h3>
            <p className="mt-2 leading-7 text-gray-700">
              Donor contact information is not publicly displayed. Hospitals
              access potential donor matches through authorized accounts,
              helping protect donor privacy.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#96334F] to-[#7A2840] px-8 py-16 text-center text-white shadow-2xl shadow-rose-300/40">
          <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-rose-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#BE4565]/40 blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl font-bold">
              {role === "hospital"
                ? "Hospital Access"
                : role === "donor"
                  ? "Your Contribution Matters"
                  : role === "admin"
                    ? "Platform Administration"
                    : "Join the DonorNexa Community"}
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-rose-100">
              {role === "hospital"
                ? verificationStatus === "verified"
                  ? "Your hospital is verified. Access your dashboard to manage blood requests and find compatible donors."
                  : verificationStatus === "pending"
                    ? "Your hospital registration is awaiting verification. Visit your dashboard to check its status."
                    : verificationStatus === "rejected"
                      ? "Your hospital registration needs attention. Visit your dashboard to review its status."
                      : verificationStatus === "not-registered"
                        ? "Register your hospital to request blood and access donor matching after verification."
                        : "Visit your hospital dashboard to check your registration status."
                : role === "donor"
                  ? "Manage your donor profile, update your availability, and help people in need."
                  : role === "admin"
                    ? "Access the administration dashboard to oversee DonorNexa."
                    : "Sign in to access your account and explore the features available to you."}
            </p>

            {cta.link && (
              <Link
                to={cta.link}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-[#96334F] shadow-lg shadow-black/10 transition duration-200 hover:bg-rose-50 hover:shadow-xl"
              >
                {cta.text}
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default FindDonors;
