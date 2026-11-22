import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UsersRound,
  Hospital,
  MapPinned,
  ScrollText,
  Settings,
  HeartPulse,
  HeartHandshake,
  Droplet,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "User Management", path: "/admin/users", icon: UsersRound },
  { label: "Hospital Management", path: "/admin/hospitals", icon: Hospital },
  { label: "Donor Management", path: "/admin/donors", icon: HeartPulse },
  { label: "City Management", path: "/admin/cities", icon: MapPinned },
  { label: "Blood Requests", path: "/admin/blood-requests", icon: Droplet },
  { label: "Audit Logs", path: "/admin/audit-logs", icon: ScrollText },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

function SidebarLinks({ iconOnly = false }) {
  return navItems.map(({ label, path, icon: Icon }) => (
    <NavLink
      key={path}
      to={path}
      end={path === "/admin/dashboard"}
      title={iconOnly ? label : undefined}
      aria-label={label}
      className={({ isActive }) =>
        [
          "group relative flex shrink-0 items-center rounded-xl font-medium transition-colors duration-150",
          iconOnly
            ? "mx-auto size-11 justify-center"
            : "gap-3 px-3.5 py-3 text-sm",
          isActive
            ? "bg-[#F5E9EC] text-[#87364D]"
            : "text-[#71665F] hover:bg-[#F7F2ED] hover:text-[#87364D]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-[#963D54]"
            />
          )}

          <Icon
            size={19}
            strokeWidth={isActive ? 2 : 1.7}
            className="shrink-0"
            aria-hidden="true"
          />

          {!iconOnly && <span className="whitespace-nowrap">{label}</span>}
        </>
      )}
    </NavLink>
  ));
}

function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-dvh w-[68px] shrink-0 flex-col border-r border-[#EAE2DB] bg-[#FFFEFC] px-2 py-5 sm:w-[76px] sm:px-2.5 md:w-[84px] lg:w-[264px] lg:px-5 lg:py-7">
      {/* BRAND */}
      <div className="mb-8 flex items-center justify-center gap-3 lg:mb-10 lg:justify-start lg:px-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#963D54] text-white shadow-sm shadow-[#963D54]/15">
          <HeartHandshake size={20} />
        </div>

        <div className="hidden lg:block">
          <p className="font-serif text-xl font-semibold leading-tight tracking-tight text-[#302923]">
            DonorNexa
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#92857A]">
            Admin portal
          </p>
        </div>
      </div>

      {/* SECTION LABEL */}
      <p className="mb-3 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A3978C] lg:block">
        Management
      </p>

      {/* NAVIGATION */}
      <nav aria-label="Admin navigation" className="flex flex-col gap-2">
        <div className="lg:hidden">
          <SidebarLinks iconOnly />
        </div>

        <div className="hidden lg:flex lg:flex-col lg:gap-1">
          <SidebarLinks />
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
