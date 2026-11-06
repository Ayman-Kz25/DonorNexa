import { useState } from "react";
import { HeartHandshake, Menu, X, ArrowRight } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Find Donors", to: "/find-donors" },
    { label: "Emergency Requests", to: "/emergency" },
    { label: "About Us", to: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-rose-100 bg-white/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCE7ED] text-[#BE4565]">
            <HeartHandshake size={25} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#96334F]">
              DonorNexa
            </h1>
            <p className="text-[10px] tracking-wide text-gray-500">
              CONNECTING DONORS. SAVING LIVES.
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-medium text-gray-600 transition hover:text-[#BE4565]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Authentication */}
        <div className="hidden items-center gap-3 md:flex">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-lg px-4 py-2 text-sm font-semibold text-[#96334F] transition hover:bg-rose-50">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="flex items-center gap-2 rounded-lg bg-[#BE4565] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#96334F]">
                Get Started
                <ArrowRight size={16} />
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-lg p-2 text-[#96334F] md:hidden"
          aria-label="Toggle navigation"
        >
          {isMenuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-rose-100 bg-white px-5 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium text-gray-700 hover:text-[#BE4565]"
              >
                {link.label}
              </Link>
            ))}

            <div className="flex items-center gap-3 border-t border-rose-100 pt-4">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="text-sm font-semibold text-[#96334F]">
                    Sign In
                  </button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <button className="rounded-lg bg-[#BE4565] px-4 py-2 text-sm font-semibold text-white">
                    Get Started
                  </button>
                </SignUpButton>
              </Show>

              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
