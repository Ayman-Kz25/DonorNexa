import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UsersRound,
  Hospital,
  MapPinned,
  ClipboardList,
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

function SidebarLinks({ mobile = false }) {
  return navItems.map(({ label, path, icon: Icon }) => (
    <NavLink
      key={path}
      to={path}
      end={path === "/admin/dashboard"}
      className={({ isActive }) =>
        [
          "group relative flex shrink-0 items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-150",
          mobile ? "px-3 py-2.5" : "px-3.5 py-3",
          isActive
            ? "bg-[#F5E9EC] text-[#87364D]"
            : "text-[#71665F] hover:bg-[#F7F2ED] hover:text-[#87364D]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !mobile && (
            <span
              aria-hidden="true"
              className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-[#963D54]"
            />
          )}
          <Icon size={18} strokeWidth={isActive ? 2 : 1.7} aria-hidden="true" />
          <span className="whitespace-nowrap">{label}</span>
        </>
      )}
    </NavLink>
  ));
}

function Sidebar() {
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-[#EAE2DB] bg-[#FFFEFC] px-5 py-7 md:flex">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#963D54] text-white shadow-sm shadow-[#963D54]/15">
            <HeartHandshake size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="font-serif text-xl font-semibold leading-tight tracking-tight text-[#302923]">
              DonorNexa
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#92857A]">
              Admin portal
            </p>
          </div>
        </div>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A3978C]">
          Management
        </p>
        <nav aria-label="Admin navigation" className="flex flex-col gap-1">
          <SidebarLinks />
        </nav>
      </aside>

      <div className="border-b border-[#EAE2DB] bg-[#FFFEFC] px-4 py-3 md:hidden">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#963D54] text-white">
            <HeartHandshake size={17} aria-hidden="true" />
          </div>
          <p className="font-serif text-lg font-semibold tracking-tight text-[#302923]">
            DonorNexa
          </p>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.14em] text-[#92857A]">
            Admin
          </span>
        </div>
        <nav
          aria-label="Admin navigation"
          className="flex gap-1 overflow-x-auto pb-1"
        >
          <SidebarLinks mobile />
        </nav>
      </div>
    </>
  );
}

export default Sidebar;
