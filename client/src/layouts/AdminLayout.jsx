import { Outlet } from "react-router-dom";
import { UserButton } from "@clerk/react";

import Sidebar from "../components/admin/Sidebar";
import { useCurrentUser } from "../context/UserContext";

function AdminLayout() {
  const { user } = useCurrentUser();

  return (
    <div className="flex min-h-screen bg-[#F8F5EF]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[76px] items-center justify-between border-b border-[#E8DDD4] bg-[#F8F5EF] px-8">
          <div>
            <p className="text-xs text-[#81756A]">Admin Portal</p>
            <h2 className="font-serif text-xl text-[#302923]">
              Welcome{user?.name ? `, ${user.name}` : " back"}
            </h2>
          </div>

          <UserButton />
        </header>

        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
