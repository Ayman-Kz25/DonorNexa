import { Outlet } from "react-router-dom";
import Navbar from "../components/donor/Navbar";

function DonorLayout() {
  return (
    <div className="min-h-dvh bg-[#F8F5EF] text-[#302923]">
      <Navbar />

      <main className="mx-auto min-h-dvh w-full max-w-[1800px] px-4 pb-8 pt-28 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DonorLayout;
