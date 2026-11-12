import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Droplets,
  Search,
  Building2,
  Heart,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    path: "/hospital/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Blood Requests",
    path: "/hospital/requests",
    icon: ClipboardList,
  },
  {
    label: "Create Request",
    path: "/hospital/create-request",
    icon: PlusCircle,
  },
  {
    label: "Blood Inventory",
    path: "/hospital/inventory",
    icon: Droplets,
  },
  {
    label: "Find Donors",
    path: "/hospital/find-donors",
    icon: Search,
  },
  {
    label: "Hospital Profile",
    path: "/hospital/profile",
    icon: Building2,
  },
];

function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[#E8DDD4] bg-[#F8F5EF] px-5 py-7">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#963D54] text-white">
          <Heart size={22} />
        </div>

        <div>
          <h1 className="font-serif text-xl font-semibold text-[#302923]">
            DonorNexa
          </h1>
          <p className="text-[10px] tracking-wider text-[#81756A]">
            HOSPITAL PORTAL
          </p>
        </div>
      </div>

      <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A3978C]">
        Menu
      </p>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/hospital/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#963D54] text-white"
                    : "text-[#756B61] hover:bg-[#EFE5DC] hover:text-[#963D54]"
                }`
              }
            >
              <Icon size={19} strokeWidth={1.7} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
