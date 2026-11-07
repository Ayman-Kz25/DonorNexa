
import { useEffect, useState } from "react";
import {
  HeartHandshake,
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";

import {
  Show,
  SignInButton,
  SignUpButton,
  useAuth,
  UserButton,
} from "@clerk/react";

import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi.js";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [role, setRole] = useState(null);

  const { isLoaded, isSignedIn } = useAuth();
  const { request } = useApi();
  const navigate = useNavigate();

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Find Donors", to: "/find-donors" },
    { label: "Emergency Requests", to: "/emergency-requests" },
    { label: "About Us", to: "/about" },
  ];

  // Get the user's actual role from MongoDB
  useEffect(() => {
    let isMounted = true;

    const fetchUserRole = async () => {
      if (!isLoaded || !isSignedIn) {
        setRole(null);
        return;
      }

      try {
        const response = await request({
          method: "POST",
          url: "/api/users/sync",
        });

        if (isMounted) {
          setRole(response.data.user?.role || null);
        }
      } catch (error) {
        console.error("Unable to load user role:", error);
      }
    };

    fetchUserRole();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, request]);

  const dashboardConfig = {
    donor: {
      label: "Donor Dashboard",
      path: "/donor/dashboard",
    },
    hospital: {
      label: "Hospital Dashboard",
      path: "/hospital/dashboard",
    },
    admin: {
      label: "Admin Dashboard",
      path: "/admin/dashboard",
    },
  };

  const dashboard = dashboardConfig[role];

  const renderUserButton = () => (
    <UserButton>
      {dashboard && (
        <UserButton.MenuItems>
          <UserButton.Action
            label={dashboard.label}
            labelIcon={<LayoutDashboard size={16} />}
            onClick={() => navigate(dashboard.path)}
          />
        </UserButton.MenuItems>
      )}
    </UserButton>
  );

  return (
    <header className="sticky top-0 z-50 h-0 px-3 sm:px-5">
      <nav className="relative top-3 mx-auto flex sm:top-4 w-full max-w-7xl items-center justify-between rounded-2xl border border-white bg-white/85 px-4 py-2.5 shadow-[0_8px_32px_rgba(190,69,101,0.14)] ring-1 ring-rose-200/40 backdrop-blur-xl backdrop-saturate-150 lg:px-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-[#BE4565] shadow-inner shadow-white/60 ring-1 ring-white/70">
            <HeartHandshake size={25} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#96334F]">
              DonorNexa
            </h1>
            <p className="text-[10px] tracking-wide text-[#96334F]/60">
              CONNECTING DONORS. SAVING LIVES.
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 rounded-full border border-white/60 bg-white/40 p-1 shadow-sm shadow-rose-200/30 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition duration-200 hover:bg-white/80 hover:text-[#BE4565] hover:shadow-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Authentication */}
        <div className="hidden items-center gap-3 md:flex">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-full px-4 py-2 text-sm font-semibold text-[#96334F] transition hover:bg-white/70 hover:cursor-pointer">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#BE4565] to-[#A83A58] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-400/30 ring-1 ring-white/30 transition duration-200 hover:from-[#A83A58] hover:to-[#96334F] hover:shadow-rose-400/50">
                Get Started
                <ArrowRight size={16} />
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            {renderUserButton()}
          </Show>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-xl border border-white/70 bg-white/50 p-2 text-[#96334F] shadow-sm backdrop-blur transition hover:bg-white/80 md:hidden"
          aria-label="Toggle navigation"
        >
          {isMenuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="relative top-3 mx-auto mt-2 sm:top-4 w-full max-w-7xl rounded-2xl border border-white bg-white/90 px-5 py-5 shadow-[0_8px_32px_rgba(190,69,101,0.14)] ring-1 ring-rose-200/40 backdrop-blur-xl backdrop-saturate-150 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-white/70 hover:text-[#BE4565]"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 flex items-center gap-3 border-t border-rose-200/50 pt-4">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="rounded-full px-3 py-2 text-sm font-semibold text-[#96334F] transition hover:bg-white/70">
                    Sign In
                  </button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <button className="rounded-full bg-gradient-to-r from-[#BE4565] to-[#A83A58] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-rose-400/30">
                    Get Started
                  </button>
                </SignUpButton>
              </Show>

              <Show when="signed-in">
                {renderUserButton()}
              </Show>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
