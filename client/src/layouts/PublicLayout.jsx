import { Outlet } from "react-router-dom";
import Navbar from "../components/guest/Navbar";
import Footer from "../components/guest/Footer";

function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#302923]">
      <Navbar />

      <main>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default PublicLayout;
