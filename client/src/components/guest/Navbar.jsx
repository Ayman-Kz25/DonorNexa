
import { useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, Menu, X, ArrowRight } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/react";

import { useCurrentUser } from "../../context/UserContext";

const navLinks = [
  { label: "Home", to: "/#home" },
  { label: "How It Works", to: "/#how-it-works" },
  { label: "Blood Groups", to: "/#blood-groups" },
  { label: "Emergency Requests", to: "/emergencies" },
  { label: "About", to: "/#roles" },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useCurrentUser();

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#E6DCD0] bg-[#F8F5EF]/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#963D54] text-[#F8F5EF]">
            <HeartHandshake size={23} strokeWidth={1.7} />
          </div>

          <div>
            <h1 className="font-serif text-xl font-semibold tracking-tight text-[#302923]">
              DonorNexa
            </h1>
            <p className="text-[9px] font-medium uppercase tracking-[0.17em] text-[#927E70]">
              Connecting lives
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-[13px] font-medium text-[#6F6258] transition hover:text-[#963D54]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-5 sm:flex">
          {isLoaded && isSignedIn ? (
            <UserButton />
          ) : isLoaded ? (
            <>
              <SignInButton mode="modal">
                <button className="text-sm font-semibold text-[#493D34] transition hover:text-[#963D54]">
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton
                mode="modal"
                signupforceredirecturl="/"
              >
                <button className="inline-flex items-center gap-2 rounded-full bg-[#963D54] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#7D3045]">
                  Get Started
                  <ArrowRight size={15} />
                </button>
              </SignUpButton>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-lg p-2 text-[#963D54] transition hover:bg-[#F0EAE0] lg:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="border-t border-[#E6DCD0] bg-[#F8F5EF] px-6 py-6 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={closeMenu}
                className="rounded-lg px-3 py-3 text-sm font-medium text-[#6F6258] transition hover:bg-[#F0EAE0] hover:text-[#963D54]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-4 border-t border-[#E6DCD0] pt-5">
            {isLoaded && isSignedIn ? (
              <UserButton />
            ) : isLoaded ? (
              <>
                <SignInButton mode="modal">
                  <button
                    onClick={closeMenu}
                    className="text-sm font-semibold text-[#493D34]"
                  >
                    Sign In
                  </button>
                </SignInButton>

                <SignUpButton
                  mode="modal"
                  signupforceredirecturl="/"
                >
                  <button
                    onClick={closeMenu}
                    className="inline-flex items-center gap-2 rounded-full bg-[#963D54] px-5 py-3 text-xs font-semibold text-white"
                  >
                    Get Started
                    <ArrowRight size={14} />
                  </button>
                </SignUpButton>
              </>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
