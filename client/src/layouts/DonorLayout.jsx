import { Outlet } from "react-router-dom";
import Navbar from "../components/donor/Navbar";

function DonorLayout() {
  return (
    <div className="min-h-dvh w-full overflow-x-clip bg-[#F8F5EF] text-[#302923]">
      <Navbar />

      <main className="mx-auto min-h-dvh w-full max-w-[1800px] px-3 pb-6 pt-24 min-[380px]:px-4 sm:px-6 sm:pb-8 sm:pt-28 lg:px-8 lg:pt-32">
        <div className="mx-auto w-full max-w-6xl min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DonorLayout;
