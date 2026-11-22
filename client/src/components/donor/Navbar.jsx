import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { HeartHandshake, Menu, X } from "lucide-react";
import { UserButton } from "@clerk/react";
import NotificationBell from "../common/NotificationBell";

const navLinks = [
  { label: "Dashboard", to: "/donor/dashboard" },
  { label: "Emergency Requests", to: "/donor/requests" },
  { label: "My Donations", to: "/donor/donations" },
  { label: "Hospitals", to: "/donor/hospitals" },
  { label: "My Profile", to: "/donor/profile" },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const navLinkClass = ({ isActive }) =>
    `whitespace-nowrap rounded-lg px-2 py-2 text-[11px] font-medium transition duration-200 lg:px-2.5 lg:text-xs xl:px-3 xl:text-sm ${
      isActive
        ? "bg-[#F2E2DC] text-[#782B40] shadow-sm"
        : "text-[#6F6258] hover:bg-white hover:text-[#963D54] hover:shadow-sm"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block w-full rounded-xl px-3 py-2.5 text-xs font-medium transition sm:py-3 sm:text-sm ${
      isActive
        ? "bg-[#F2E2DC] text-[#782B40]"
        : "text-[#6F6258] hover:bg-[#F0EAE0] hover:text-[#963D54]"
    }`;

  return (
    <header className="sticky top-0 z-50 h-0 px-2 sm:px-4 lg:px-5">
      <nav className="relative top-2 mx-auto flex w-full max-w-7xl items-center justify-between gap-2 rounded-xl border border-white bg-[#FFFDF9]/95 px-3 py-2 shadow-[0_8px_32px_rgba(116,65,65,0.12)] ring-1 ring-[#E8DDD4]/70 backdrop-blur-xl backdrop-saturate-150 sm:top-3 sm:gap-3 sm:px-4 sm:py-2.5 lg:top-4 lg:gap-4 lg:px-5 lg:py-3">
        {/* Logo */}
        <Link
          to="/donor/dashboard"
          onClick={closeMenu}
          className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F2E2DC] to-[#E7CFC3] text-[#963D54] shadow-inner shadow-white/60 ring-1 ring-white/70 sm:h-10 sm:w-10 sm:rounded-xl">
            <HeartHandshake size={22} className="sm:hidden" />
            <HeartHandshake size={25} className="hidden sm:block" />
          </div>

          <div className="min-w-0">
            <h1 className="whitespace-nowrap text-base font-bold tracking-tight text-[#963D54] sm:text-lg lg:text-xl">
              DonorNexa
            </h1>

            <p className="hidden whitespace-nowrap text-[8px] tracking-wide text-[#927E70] min-[380px]:block sm:text-[9px] lg:text-[10px]">
              CONNECTING DONORS. SAVING LIVES.
            </p>
          </div>
        </Link>

        {/* Desktop Navigation - Large Screens */}
        <div className="hidden min-w-0 items-center gap-0.5 rounded-xl border border-[#E8DDD4]/70 bg-[#F8F5EF]/70 p-1 shadow-sm lg:flex xl:gap-1">
          {navLinks.map((link) => (
            <NavLink key={link.label} to={link.to} end className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop Profile */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-3">
          <NotificationBell />
          <UserButton />
        </div>

        {/* Tablet Controls */}
        <div className="hidden shrink-0 items-center gap-2 md:flex lg:hidden">
          <NotificationBell />
          <UserButton />

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8DDD4] bg-[#F8F5EF]/70 text-[#963D54] shadow-sm transition hover:bg-white"
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {/* Mobile Controls */}
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <NotificationBell />

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8DDD4] bg-[#F8F5EF]/70 text-[#963D54] shadow-sm transition hover:bg-white sm:h-10 sm:w-10"
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>

      {/* Mobile and Tablet Navigation */}
      {isMenuOpen && (
        <div className="relative top-2 mx-auto mt-2 w-full max-w-7xl rounded-xl border border-white bg-[#FFFDF9]/95 p-3 shadow-[0_8px_32px_rgba(116,65,65,0.12)] ring-1 ring-[#E8DDD4]/70 backdrop-blur-xl sm:top-3 sm:mt-2 sm:p-4 lg:hidden">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end
                onClick={closeMenu}
                className={mobileNavLinkClass}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
