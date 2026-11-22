import { Outlet } from "react-router-dom";
import { UserButton } from "@clerk/react";

import Sidebar from "../components/admin/Sidebar";
import { useCurrentUser } from "../context/UserContext";

function AdminLayout() {
  const { user } = useCurrentUser();

  return (
    <div className="flex min-h-screen min-w-0 bg-[#F8F5EF]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[60px] items-center justify-between gap-3 border-b border-[#E8DDD4] bg-[#F8F5EF] px-3 py-2.5 min-[400px]:px-4 sm:min-h-[72px] sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-[9px] text-[#81756A] min-[400px]:text-[10px] sm:text-xs">
              Admin Portal
            </p>

            <h2 className="truncate font-serif text-sm text-[#302923] min-[400px]:text-base sm:text-lg lg:text-xl">
              Welcome{user?.name ? `, ${user.name}` : " back"}
            </h2>
          </div>

          <div className="flex shrink-0 items-center justify-center [&_.cl-avatarBox]:!h-7 [&_.cl-avatarBox]:!w-7 min-[400px]:[&_.cl-avatarBox]:!h-8 min-[400px]:[&_.cl-avatarBox]:!w-8 sm:[&_.cl-avatarBox]:!h-9 sm:[&_.cl-avatarBox]:!w-9">
            <UserButton />
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 min-[400px]:p-4 sm:p-5 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;