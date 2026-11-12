import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { HeartHandshake, Menu, X } from "lucide-react";
import { UserButton } from "@clerk/react";

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

  const closeMenu = () => setIsMenuOpen(false);

  const navLinkClass = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-medium transition duration-200 ${
      isActive
        ? "bg-[#F2E2DC] text-[#782B40] shadow-sm"
        : "text-[#6F6258] hover:bg-white hover:text-[#963D54] hover:shadow-sm"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? "bg-[#F2E2DC] text-[#782B40]"
        : "text-[#6F6258] hover:bg-[#F0EAE0] hover:text-[#963D54]"
    }`;

  return (
    <header className="sticky top-0 z-50 h-0 px-3 sm:px-5">
      <nav className="relative top-3 mx-auto flex w-full max-w-7xl items-center justify-between rounded-xl border border-white bg-[#FFFDF9]/90 px-4 py-2.5 shadow-[0_8px_32px_rgba(116,65,65,0.12)] ring-1 ring-[#E8DDD4]/70 backdrop-blur-xl backdrop-saturate-150 sm:top-4 lg:px-6">
        {/* Logo */}
        <Link
          to="/hospital/dashboard"
          onClick={closeMenu}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F2E2DC] to-[#E7CFC3] text-[#963D54] shadow-inner shadow-white/60 ring-1 ring-white/70">
            <HeartHandshake size={25} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#963D54]">
              DonorNexa
            </h1>
            <p className="text-[10px] tracking-wide text-[#927E70]">
              HOSPITAL PORTAL
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 rounded-xl border border-[#E8DDD4]/70 bg-[#F8F5EF]/70 p-1 shadow-sm lg:flex">
          {navLinks.map((link) => (
            <NavLink key={link.label} to={link.to} end className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Profile */}
        <div className="hidden items-center lg:flex">
          <UserButton />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-xl border border-[#E8DDD4] bg-[#F8F5EF]/70 p-2 text-[#963D54] shadow-sm backdrop-blur transition hover:bg-white lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="relative top-3 mx-auto mt-2 w-full max-w-7xl rounded-xl border border-white bg-[#FFFDF9]/95 px-5 py-5 shadow-[0_8px_32px_rgba(116,65,65,0.12)] ring-1 ring-[#E8DDD4]/70 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-2">
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

            <div className="mt-2 flex items-center border-t border-[#E8DDD4] pt-4">
              <UserButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
