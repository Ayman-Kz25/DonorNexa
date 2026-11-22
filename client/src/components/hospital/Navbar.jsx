import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { HeartHandshake, Menu, X } from "lucide-react";
import { UserButton } from "@clerk/react";
import NotificationBell from "../common/NotificationBell";

const navLinks = [
  { label: "Dashboard", to: "/hospital/dashboard" },
  { label: "Blood Requests", to: "/hospital/requests" },
  { label: "Create Request", to: "/hospital/create-request" },
  { label: "Blood Inventory", to: "/hospital/inventory" },
  { label: "Find Donors", to: "/hospital/find-donors" },
  { label: "My Profile", to: "/hospital/profile" },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setIsMenuOpen(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  // Prevent the expanded menu from remaining open on desktop.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        closeMenu();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navLinkClass = ({ isActive }) =>
    `whitespace-nowrap rounded-lg px-2 py-2 text-[11px] font-medium transition xl:px-2.5 xl:text-xs 2xl:px-3 2xl:text-sm ${
      isActive
        ? "bg-[#F2E2DC] text-[#782B40] shadow-sm"
        : "text-[#6F6258] hover:bg-white hover:text-[#963D54]"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block w-full rounded-lg px-3 py-2.5 text-xs font-medium transition sm:text-sm ${
      isActive
        ? "bg-[#F2E2DC] text-[#782B40]"
        : "text-[#6F6258] hover:bg-[#F0EAE0] hover:text-[#963D54]"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full px-2 pt-2 sm:px-4 sm:pt-3">
      <nav className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-2 rounded-xl border border-white bg-[#FFFDF9]/95 px-3 py-2 shadow-[0_8px_32px_rgba(116,65,65,0.12)] ring-1 ring-[#E8DDD4]/70 backdrop-blur-xl backdrop-saturate-150 sm:px-4 sm:py-2.5 lg:gap-3 lg:px-5">
        {/* Logo */}
        <Link
          to="/hospital/dashboard"
          onClick={closeMenu}
          className="flex min-w-0 shrink-0 items-center gap-2"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F2E2DC] to-[#E7CFC3] text-[#963D54] shadow-inner shadow-white/60 ring-1 ring-white/70 sm:h-10 sm:w-10">
            <HeartHandshake size={21} />
          </div>

          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight tracking-tight text-[#963D54] sm:text-lg">
              DonorNexa
            </h1>
            <p className="text-[9px] tracking-wide text-[#927E70] sm:text-[10px]">
              HOSPITAL PORTAL
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden min-w-0 flex-1 items-center justify-center xl:flex">
          <div className="flex min-w-0 items-center gap-0.5 rounded-xl border border-[#E8DDD4]/70 bg-[#F8F5EF]/70 p-1 shadow-sm">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end
                className={navLinkClass}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <NotificationBell />
          <UserButton />
        </div>

        {/* Mobile / Tablet Actions */}
        <div className="flex shrink-0 items-center gap-2 xl:hidden">
          <NotificationBell />

          <button
            type="button"
            onClick={() => setIsMenuOpen((previous) => !previous)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E8DDD4] bg-[#F8F5EF]/70 text-[#963D54] shadow-sm transition hover:bg-white sm:h-10 sm:w-10"
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMenuOpen}
            aria-controls="hospital-mobile-navigation"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile / Tablet Navigation */}
      <div
        id="hospital-mobile-navigation"
        className={`mx-auto mt-2 w-full max-w-7xl overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9]/95 shadow-[0_8px_32px_rgba(116,65,65,0.12)] ring-1 ring-[#E8DDD4]/70 backdrop-blur-xl transition-all duration-200 xl:hidden ${
          isMenuOpen
            ? "visible max-h-[480px] translate-y-0 p-3 opacity-100 sm:p-4"
            : "invisible max-h-0 -translate-y-1 border-transparent p-0 opacity-0"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end
              onClick={closeMenu}
              tabIndex={isMenuOpen ? 0 : -1}
              className={mobileNavLinkClass}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#E8DDD4] px-2 pt-3">
          <span className="text-xs font-medium text-[#81756A]">
            Hospital Account
          </span>
          <UserButton />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
