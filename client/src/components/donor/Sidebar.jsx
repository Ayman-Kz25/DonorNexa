import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  HeartHandshake,
  Building2,
  UserRound,
  Heart,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/donor/dashboard", icon: LayoutDashboard },
  { label: "Emergency Requests", path: "/donor/requests", icon: ClipboardList },
  { label: "My Donations", path: "/donor/donations", icon: HeartHandshake },
  { label: "Hospitals", path: "/donor/hospitals", icon: Building2 },
  { label: "My Profile", path: "/donor/profile", icon: UserRound },
];

function NavigationLinks({ mobile = false }) {
  return navItems.map((item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === "/donor/dashboard"}
        className={({ isActive }) =>
          [
            "flex shrink-0 items-center gap-3 rounded-xl text-sm font-medium transition-colors",
            mobile ? "px-3 py-2.5" : "px-3 py-3",
            isActive
              ? "bg-[#963D54] text-white shadow-sm"
              : "text-[#756B61] hover:bg-[#EFE5DC] hover:text-[#963D54]",
          ].join(" ")
        }
      >
        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        <span>{item.label}</span>
      </NavLink>
    );
  });
}

function Sidebar() {
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-[#E8DDD4] bg-[#FCFAF7] px-5 py-7 md:flex">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#963D54] text-white">
            <Heart size={20} fill="currentColor" aria-hidden="true" />
          </div>
          <div>
            <p className="font-serif text-xl font-semibold leading-tight text-[#302923]">
              DonorNexa
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#81756A]">
              Donor portal
            </p>
          </div>
        </div>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A3978C]">
          Your space
        </p>
        <nav aria-label="Donor navigation" className="flex flex-col gap-1.5">
          <NavigationLinks />
        </nav>
      </aside>

      <div className="border-b border-[#E8DDD4] bg-[#FCFAF7] px-4 py-3 md:hidden">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#963D54] text-white">
            <Heart size={17} fill="currentColor" aria-hidden="true" />
          </div>
          <p className="font-serif text-lg font-semibold text-[#302923]">
            DonorNexa
          </p>
        </div>
        <nav
          aria-label="Donor navigation"
          className="flex gap-1 overflow-x-auto pb-1"
        >
          <NavigationLinks mobile />
        </nav>
      </div>
    </>
  );
}

export default Sidebar;
