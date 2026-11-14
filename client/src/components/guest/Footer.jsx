import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { HeartHandshake, ArrowUpRight } from "lucide-react";
import { useCurrentUser } from "../../context/UserContext";

function Footer() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const { user, userLoading } = useCurrentUser();

  const handleRoleLink = (role) => {
    if (!isLoaded || userLoading) return;

    if (!isSignedIn) {
      navigate(`/onboarding/${role}`);
      return;
    }

    if (user?.role === "unassigned") {
      navigate(`/onboarding/${role}`);
      return;
    }

    const dashboardPaths = {
      donor: "/donor/dashboard",
      hospital: "/hospital/dashboard",
      admin: "/admin/dashboard",
    };

    navigate(dashboardPaths[user?.role] || "/");
  };

  const exploreLinks = [
    { label: "Home", to: "/#home" },
    { label: "How It Works", to: "/#how-it-works" },
    { label: "Blood Groups", to: "/#blood-groups" },
    { label: "Emergency Requests", to: "/emergencies" },
    { label: "About Us", to: "/#roles" },
  ];

  return (
    <footer className="border-t border-[#E6DCD0] bg-[#F0EAE0] px-6 pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 pb-14 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#963D54] text-white">
                <HeartHandshake size={24} />
              </div>

              <span className="font-serif text-2xl font-semibold text-[#302923]">
                DonorNexa
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-[#81756A]">
              Connecting willing blood donors with hospitals to make donation
              coordination easier, more accessible, and more thoughtful.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#963D54]">
              Explore
            </h3>

            <div className="mt-6 flex flex-col gap-4">
              {exploreLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-[#6F6258] hover:text-[#963D54]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Get Involved */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#963D54]">
              Get Involved
            </h3>

            <div className="mt-6 flex flex-col gap-4">
              <button
                type="button"
                onClick={() => handleRoleLink("donor")}
                disabled={!isLoaded || userLoading}
                className="inline-flex items-center gap-2 text-left text-sm text-[#6F6258] hover:text-[#963D54] disabled:opacity-60"
              >
                Become a Donor
                <ArrowUpRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => handleRoleLink("hospital")}
                disabled={!isLoaded || userLoading}
                className="inline-flex items-center gap-2 text-left text-sm text-[#6F6258] hover:text-[#963D54] disabled:opacity-60"
              >
                Register a Hospital
                <ArrowUpRight size={14} />
              </button>

              <Link
                to="#faqs"
                className="text-sm text-[#6F6258] hover:text-[#963D54]"
              >
                FAQs
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col gap-3 border-t border-[#DCCFC1] py-6 text-xs text-[#8B7E72] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DonorNexa. All rights reserved.</p>

          <p className="flex items-center gap-1.5">
            Made with
            <span className="text-[#963D54]">♥</span>
            for a community that cares.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
