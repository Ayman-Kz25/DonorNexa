import { Outlet } from "react-router-dom";
import Navbar from "../components/hospital/Navbar";

function HospitalLayout() {
  return (
    <div className="min-h-dvh w-full min-w-0 overflow-x-clip bg-[#F8F5EF] text-[#302923]">
      <Navbar />

      <main className="mx-auto min-h-dvh w-full max-w-[1800px] min-w-0 px-3 pb-6 pt-5 sm:px-5 sm:pb-8 sm:pt-7 md:px-7 lg:px-8 lg:pt-8">
        <div className="mx-auto w-full min-w-0 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default HospitalLayout;
