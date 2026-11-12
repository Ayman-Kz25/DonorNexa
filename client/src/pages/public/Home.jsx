import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignUpButton, SignInButton, useAuth } from "@clerk/react";
import { useCurrentUser } from "../../context/UserContext";

import {
  ArrowDown,
  ArrowRight,
  Heart,
  HeartHandshake,
  ShieldCheck,
  MapPin,
  Clock3,
  Users,
  Droplet,
  LockKeyhole,
  Plus,
  Sparkles,
  Building2,
  RefreshCw,
} from "lucide-react";

import { useApi } from "../../hooks/useApi";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const faqs = [
  {
    question: "Who can see my personal information?",
    answer:
      "Your contact details stay private on public pages. A hospital can view them only after you accept its donation request.",
  },
  {
    question: "Can I choose which requests to answer?",
    answer:
      "You decide when you are available and whether to accept or decline each request.",
  },
  {
    question: "Are all requests verified?",
    answer:
      "Hospitals must be reviewed before creating requests. Public listings show essential details only—not patient names or phone numbers.",
  },
];

const roles = [
  {
    id: "donor",
    label: "Donors",
    heading: "For donors",
    italic: "start here.",
    description:
      "Create your profile, set your availability, and respond to verified requests near you.",
    action: "Join as a donor",
    icon: Heart,
    actionType: "signup",
  },
  {
    id: "hospital",
    label: "Hospitals",
    heading: "For hospitals",
    italic: "coordinate care.",
    description:
      "Manage blood requirements, create requests, and connect with eligible donors.",
    action: "Join as a hospital",
    icon: Building2,
    actionType: "signup",
  },
  {
    id: "admin",
    label: "Admins",
    heading: "For administrators",
    italic: "keep it running.",
    description:
      "Access platform management tools and help maintain a secure, organized system.",
    action: "Admin sign in",
    icon: ShieldCheck,
    actionType: "signin",
  },
];

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A34B60]">
      {children}
    </p>
  );
}

function formatRequiredDate(date) {
  if (!date) return "Not specified";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not specified";
  }

  return parsedDate.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Home() {
  const { request } = useApi();

  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const { user, userLoading } = useCurrentUser();

  const dashboardPaths = {
    donor: "/donor/dashboard",
    hospital: "/hospital/dashboard",
    admin: "/admin/dashboard",
  };

  const handleRoleAction = (roleId) => {
    if (!isLoaded || userLoading || !isSignedIn || !user) return;

    if (user.role === "unassigned") {
      navigate(`/onboarding/${roleId}`);
      return;
    }

    if (dashboardPaths[user.role]) {
      navigate(dashboardPaths[user.role]);
    }
  };

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState(false);

  const [selectedRole, setSelectedRole] = useState("donor");

  const activeRole = roles.find((role) => role.id === selectedRole) || roles[0];

  const RoleIcon = activeRole.icon;

  // Fetch actual active emergency requests
  useEffect(() => {
    let isMounted = true;

    const fetchRequests = async () => {
      try {
        setRequestsLoading(true);
        setRequestsError(false);

        const response = await request({
          method: "GET",
          url: "/api/blood-requests/active",
        });

        const data = response.data;

        const activeRequests = Array.isArray(data)
          ? data
          : data?.bloodRequests || [];

        if (isMounted) {
          setRequests(activeRequests.slice(0, 3));
        }
      } catch (error) {
        console.error("Unable to fetch public requests:", error);

        if (isMounted) {
          setRequestsError(true);
          setRequests([]);
        }
      } finally {
        if (isMounted) {
          setRequestsLoading(false);
        }
      }
    };

    fetchRequests();

    return () => {
      isMounted = false;
    };
  }, [request]);

  console.log("Home user:", user);
  console.log("Home user role:", user?.role);

  return (
    <div className="overflow-hidden bg-[#F8F5EF] text-[#302923]">
      {/* Hero */}
      <section
        id="home"
        className="relative px-6 pb-20 pt-24 sm:pt-28 lg:pb-24"
      >
        <div className="mx-auto grid max-w-[1450px] items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          {/* Left Content */}
          <div>
            <div className="mb-8 inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0E2DA] text-[#963D54]">
                <Heart size={16} fill="currentColor" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#963D54]">
                A platform for blood donation
              </span>
            </div>

            <h1 className="max-w-2xl font-serif text-5xl leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-[88px]">
              Someone out there
              <br />
              is your <span className="italic text-[#A94452]">match.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-[#756B61] sm:text-lg">
              When a hospital needs blood, the right donor shouldn’t be hard to
              find. DonorNexa brings verified hospitals and willing donors
              together, right when it matters.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {isLoaded && isSignedIn ? (
                <button
                  type="button"
                  onClick={() => handleRoleAction("donor")}
                  disabled={userLoading}
                  className="inline-flex items-center gap-4 rounded-md bg-[#963D54] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#7D3045] disabled:opacity-60"
                >
                  I want to donate
                  <ArrowRight size={18} />
                </button>
              ) : (
                <SignUpButton
                  mode="modal"
                  signUpForceRedirectUrl="/onboarding/donor"
                >
                  <button className="inline-flex items-center gap-4 rounded-md bg-[#963D54] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#7D3045]">
                    I want to donate
                    <ArrowRight size={18} />
                  </button>
                </SignUpButton>
              )}

              <a
                href="#requests"
                className="inline-flex items-center gap-3 rounded-md border border-[#CDBCAF] px-6 py-4 text-sm font-semibold text-[#493D34] transition hover:border-[#963D54] hover:text-[#963D54]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#CDBCAF]">
                  <ArrowDown size={13} />
                </span>
                Explore requests
              </a>
            </div>

            <div className="mt-11 flex items-center gap-4">
              <div className="flex -space-x-2">
                {["F", "A", "M", "+"].map((item, index) => (
                  <div
                    key={item}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#F8F5EF] text-xs font-medium ${
                      index === 3
                        ? "bg-[#EDE1D4] text-[#963D54]"
                        : "bg-[#E8D0C0] text-[#694B40]"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Verified hospitals. Eligible donors.
                </p>
                <p className="mt-1 text-xs text-[#8B7E72]">
                  Better coordination when every moment matters.
                </p>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative w-full">
            <div className="relative flex aspect-[1.42/1] min-h-[360px] items-center justify-center overflow-hidden border border-[#E3D5C8] bg-[#F0E3D8] sm:min-h-[430px]">
              {/* Subtle dotted background */}
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(#D9BFAF 0.8px, transparent 0.8px)",
                  backgroundSize: "11px 11px",
                }}
              />

              {/* Header */}
              <div className="absolute left-7 right-7 top-7 z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#C66D5B]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#765D4E]">
                    DonorNexa platform
                  </span>
                </div>

                <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#765D4E]">
                  Pakistan
                  <MapPin size={13} />
                </span>
              </div>

              {/* Orbit circles */}
              <div className="absolute h-[260px] w-[260px] rounded-full border border-[#CDAF9E]/80 sm:h-[340px] sm:w-[340px]" />
              <div className="absolute h-[210px] w-[370px] rotate-[-28deg] rounded-[50%] border border-[#CDAF9E]/70 sm:h-[270px] sm:w-[470px]" />
              <div className="absolute h-[210px] w-[370px] rotate-[28deg] rounded-[50%] border border-[#CDAF9E]/70 sm:h-[270px] sm:w-[470px]" />

              {/* Center icon */}
              <div
                className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full border border-white/70 shadow-[0_8px_30px_rgba(116,65,65,0.10)] sm:h-40 sm:w-40"
                style={{
                  background:
                    "radial-gradient(circle, #FFF9F5 0%, #E7CFC3 72%)",
                }}
              >
                <HeartHandshake
                  size={65}
                  strokeWidth={1.4}
                  className="text-[#963D54] sm:h-[76px] sm:w-[76px]"
                />
              </div>

              {/* Decorative plus */}
              <span className="absolute left-[16%] top-[28%] text-2xl font-light text-[#B04452]">
                +
              </span>
              <Sparkles
                size={23}
                strokeWidth={1}
                className="absolute right-[20%] bottom-[28%] text-[#C58C79]"
              />

              {/* Blood group information */}
              <div className="absolute right-5 top-[31%] z-20 flex items-center gap-3 bg-[#FBF8F3] px-4 py-3 shadow-sm sm:right-8 sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1E3DC] text-[#A94452]">
                  <Droplet size={21} fill="currentColor" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#302923]">
                    Every type matters
                  </p>
                  <p className="mt-1 text-[9px] text-[#8B7E72]">
                    8 blood groups. One platform.
                  </p>
                </div>
                <ArrowRight size={16} className="ml-1 text-[#963D54]" />
              </div>

              {/* Verification information */}
              <div className="absolute bottom-[25%] left-5 z-20 flex items-center gap-3 bg-[#FBF8F3] px-4 py-3 shadow-sm sm:left-8 sm:px-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E4E9DD] text-[#657A5D]">
                  <ShieldCheck size={19} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#302923]">
                    Verified hospital requests
                  </p>
                  <p className="mt-1 text-[9px] text-[#8B7E72]">
                    Coordinated with care
                  </p>
                </div>
              </div>

              {/* Bottom process labels */}
              <div className="absolute bottom-6 left-7 right-7 z-10 flex items-center justify-between gap-2">
                <span className="text-[8px] font-medium uppercase tracking-[0.13em] text-[#806858] sm:text-[9px]">
                  01 — Connect
                </span>
                <span className="text-[8px] font-medium uppercase tracking-[0.13em] text-[#806858] sm:text-[9px]">
                  02 — Respond
                </span>
                <span className="text-[8px] font-medium uppercase tracking-[0.13em] text-[#806858] sm:text-[9px]">
                  03 — Make an impact
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blood Groups */}
      <section id="blood-groups" className="px-6 py-20">
        <div className="mx-auto max-w-7xl border-y border-[#E6DCD0] py-12">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <SectionLabel>Every type matters</SectionLabel>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
                8 blood groups. One community.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#81756A]">
                Every blood group has a place in helping someone.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {bloodGroups.map((group) => (
                <div
                  key={group}
                  className="flex h-14 w-16 items-center justify-center rounded-xl border border-[#E2D5C8] bg-[#F2ECE3] font-serif text-xl text-[#963D54] transition hover:border-[#963D54] hover:bg-[#963D54] hover:text-white sm:h-16 sm:w-20"
                >
                  {group}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-[#F0EAE0] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <SectionLabel>Less searching. More helping.</SectionLabel>
              <h2 className="mt-4 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
                Good things happen
                <br />
                <span className="italic text-[#963D54]">when we connect.</span>
              </h2>
            </div>

            <p className="max-w-sm text-sm leading-7 text-[#81756A]">
              Simple by design. Thoughtful where it counts. A clear process that
              brings donors and hospitals closer.
            </p>
          </div>

          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Find your place",
                description:
                  "Join as a donor or a hospital. Verified hospital accounts keep every request grounded in trust.",
                note: "People first",
                icon: Users,
              },
              {
                number: "02",
                title: "A thoughtful match",
                description:
                  "Blood compatibility, city, and donor eligibility help bring the right people closer.",
                note: "Matched with care",
                icon: HeartHandshake,
              },
              {
                number: "03",
                title: "Show up for someone",
                description:
                  "Respond when you can. Your details stay private until you choose to accept.",
                note: "On your terms",
                icon: Heart,
              },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="border-t border-[#CFC0B1] pt-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-3xl text-[#963D54]">
                      {step.number}
                    </span>
                    <Icon
                      size={25}
                      strokeWidth={1.4}
                      className="text-[#963D54]"
                    />
                  </div>

                  <h3 className="mt-9 font-serif text-2xl">{step.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#81756A]">
                    {step.description}
                  </p>
                  <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-[#963D54]">
                    {step.note}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust and Platform Features */}
      <section id="impact" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionLabel>Built for the moments that matter</SectionLabel>
              <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
                A little more trust.
                <br />
                <span className="italic text-[#963D54]">
                  A little more hope.
                </span>
              </h2>
              <p className="mt-6 max-w-lg text-sm leading-8 text-[#81756A]">
                DonorNexa is designed around people. From hospital verification
                to donor privacy, every part of the platform aims to make
                coordination more thoughtful.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  title: "Hospital verification",
                  description: "Hospital accounts go through a review process.",
                  icon: ShieldCheck,
                },
                {
                  title: "Donor privacy",
                  description:
                    "Personal contact details are protected on public pages.",
                  icon: LockKeyhole,
                },
                {
                  title: "Blood compatibility",
                  description:
                    "Blood groups help identify suitable donor matches.",
                  icon: Droplet,
                },
                {
                  title: "Clear coordination",
                  description:
                    "Donors and hospitals can manage requests in one place.",
                  icon: HeartHandshake,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="min-h-48 rounded-2xl border border-[#E6DCD0] bg-[#F2ECE3] p-6"
                  >
                    <Icon size={22} className="text-[#963D54]" />
                    <h3 className="mt-6 font-serif text-xl text-[#302923]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-xs leading-6 text-[#81756A]">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Live Emergency Requests */}
      <section id="requests" className="bg-[#302923] px-6 py-24 text-[#F8F5EF]">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <SectionLabel>Emergency blood requests</SectionLabel>
              <h2 className="mt-4 font-serif text-4xl sm:text-5xl">
                Help that can’t wait.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#C2B5A8]">
                Active requests shared by hospitals on DonorNexa.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#E7B9BD] transition hover:text-white"
            >
              Refresh requests
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Loading */}
          {requestsLoading && (
            <div className="mt-12 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] py-14 text-sm text-[#C2B5A8]">
              <RefreshCw size={17} className="animate-spin" />
              Loading active requests...
            </div>
          )}

          {/* Error */}
          {!requestsLoading && requestsError && (
            <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
              <p className="font-serif text-xl">
                Requests are temporarily unavailable.
              </p>
              <p className="mt-3 text-sm text-[#C2B5A8]">
                Please try again later.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!requestsLoading && !requestsError && requests.length === 0 && (
            <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-14 text-center">
              <HeartHandshake
                size={30}
                strokeWidth={1.3}
                className="mx-auto text-[#E7B9BD]"
              />
              <h3 className="mt-5 font-serif text-2xl">
                No active requests right now.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#C2B5A8]">
                When a hospital publishes an active blood request, it will
                appear here.
              </p>
            </div>
          )}

          {/* Actual Backend Requests */}
          {!requestsLoading && !requestsError && requests.length > 0 && (
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {requests.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-6"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#963D54] font-serif text-2xl">
                      {item.bloodGroup}
                    </span>

                    <span className="rounded-full bg-[#6B5547] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#F8E9DD]">
                      {item.urgency}
                    </span>
                  </div>

                  <h3 className="mt-7 font-serif text-xl leading-snug">
                    {item.hospital?.hospitalName || "Hospital"}
                  </h3>

                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#C2B5A8]">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {item.city || "Location not specified"}
                    </span>

                    <span>{item.unitsRequired} units needed</span>
                  </div>

                  <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-[#E7B9BD]">
                    <Clock3 size={14} />
                    Required by: {formatRequiredDate(item.requiredBy)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Role Selection */}
      <section id="roles" className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {/* Left: Role Selection */}
          <div>
            <SectionLabel>Choose your role</SectionLabel>

            <h2 className="mt-5 max-w-xl font-serif text-4xl leading-[1.15] tracking-tight sm:text-5xl lg:text-[64px]">
              One platform.
              <br />
              <span className="italic text-[#A34B60]">Different roles</span>
              <br />
              one shared purpose.
            </h2>

            <p className="mt-6 max-w-lg text-sm leading-7 text-[#81756A]">
              Whether you donate blood, coordinate hospital requirements, or
              manage the platform, choose your role to get started.
            </p>

            <div className="mt-8 max-w-lg">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`flex w-full items-center justify-between border-t border-[#DED3C7] px-3 py-5 text-left transition last:border-b ${
                      isSelected
                        ? "text-[#963D54]"
                        : "text-[#81756A] hover:text-[#963D54]"
                    }`}
                  >
                    <span className="flex items-center gap-4">
                      <Icon size={19} strokeWidth={1.7} />
                      <span className="text-sm font-medium">{role.label}</span>
                    </span>

                    <ArrowRight
                      size={17}
                      className={`transition ${
                        isSelected
                          ? "translate-x-0 opacity-100"
                          : "-translate-x-2 opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Dynamic Role Card */}
          <div className="relative min-h-[455px] overflow-hidden bg-[#963D54] p-8 text-[#FFF8F0] sm:p-10 lg:p-12">
            {/* Decorative Circles */}
            <div className="pointer-events-none absolute -bottom-40 -right-36 h-[500px] w-[500px] rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-28 -right-24 h-[400px] w-[400px] rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-16 -right-12 h-[300px] w-[300px] rounded-full border border-white/15" />

            {/* Card Header */}
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center bg-white/10">
                  <RoleIcon size={25} strokeWidth={1.6} />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#F4D9D5]">
                  DONORNEXA · {activeRole.label.toUpperCase()}
                </span>
              </div>

              <Sparkles
                size={23}
                strokeWidth={1.2}
                className="text-[#EBC9C4]"
              />
            </div>

            {/* Card Content */}
            <div className="relative mt-12 max-w-md">
              <h3 className="font-serif text-4xl leading-[1.05] sm:text-[46px]">
                {activeRole.heading}
                <br />
                <span className="italic text-[#EBC9C4]">
                  {activeRole.italic}
                </span>
              </h3>

              <p className="mt-5 max-w-md text-sm leading-7 text-[#F4E1DF]">
                {activeRole.description}
              </p>

              <div className="mt-8">
                {activeRole.actionType === "signup" ? (
                  isLoaded && isSignedIn ? (
                    <button
                      type="button"
                      onClick={() => handleRoleAction(activeRole.id)}
                      disabled={userLoading}
                      className="inline-flex items-center gap-5 rounded-md bg-[#FFF8F0] px-7 py-4 text-xs font-semibold text-[#963D54] transition hover:bg-white disabled:opacity-60"
                    >
                      {activeRole.action}
                      <ArrowRight size={17} />
                    </button>
                  ) : (
                    <SignUpButton
                      mode="modal"
                      signUpForceRedirectUrl={`/onboarding/${activeRole.id}`}
                    >
                      <button className="inline-flex items-center gap-5 rounded-md bg-[#FFF8F0] px-7 py-4 text-xs font-semibold text-[#963D54] transition hover:bg-white">
                        {activeRole.action}
                        <ArrowRight size={17} />
                      </button>
                    </SignUpButton>
                  )
                ) : isLoaded && isSignedIn ? (
                  user?.role === "admin" ? (
                    <button
                      type="button"
                      onClick={() => navigate("/admin/dashboard")}
                      className="inline-flex items-center gap-5 rounded-md bg-[#FFF8F0] px-7 py-4 text-xs font-semibold text-[#963D54] transition hover:bg-white"
                    >
                      Go to Admin Dashboard
                      <ArrowRight size={17} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed items-center gap-5 rounded-md bg-white/20 px-7 py-4 text-xs font-semibold text-white/70"
                    >
                      Admin access only
                      <ShieldCheck size={17} />
                    </button>
                  )
                ) : (
                  <SignInButton
                    mode="modal"
                    signInForceRedirectUrl="/admin/dashboard"
                  >
                    <button className="inline-flex items-center gap-5 rounded-md bg-[#FFF8F0] px-7 py-4 text-xs font-semibold text-[#963D54] transition hover:bg-white">
                      Admin sign in
                      <ArrowRight size={17} />
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>

            {/* Card Footer */}
            <div className="relative mt-11 flex items-center justify-between border-t border-white/20 pt-5">
              <div className="flex items-center gap-2 text-[10px] text-[#F4D9D5]">
                <ShieldCheck size={17} />
                Your information stays protected
              </div>

              <span className="text-[10px] font-medium tracking-wider text-[#F4D9D5]">
                {String(
                  roles.findIndex((role) => role.id === selectedRole) + 1,
                ).padStart(2, "0")}
                {" / "}
                {String(roles.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="border-t border-[#E6DCD0] px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionLabel>A few good questions</SectionLabel>
            <h2 className="mt-4 font-serif text-4xl sm:text-5xl">
              Good to know.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-[#81756A]">
              A little clarity goes a long way. Here are a few things people
              often ask about DonorNexa.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group border-b border-[#DED3C7] py-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-serif text-lg marker:hidden">
                  {faq.question}
                  <Plus
                    size={19}
                    className="shrink-0 text-[#963D54] transition group-open:rotate-45"
                  />
                </summary>

                <p className="max-w-2xl pt-4 text-sm leading-7 text-[#81756A]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#963D54] px-7 py-16 text-center text-white sm:px-12 sm:py-20">
          <Sparkles size={25} className="mx-auto text-[#EBC9C4]" />

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#EBC9C4]">
            Your role matters
          </p>

          <h2 className="mx-auto mt-5 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">
            Be part of the process.
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#F0DDE0]">
            One platform to connect donors, hospitals, and administrators.
          </p>

          <a
            href="#roles"
            className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#F8F5EF] px-8 py-4 text-sm font-semibold text-[#963D54] transition hover:bg-white"
          >
            Find your place
            <ArrowRight size={17} />
          </a>
        </div>
      </section>
    </div>
  );
}

export default Home;
