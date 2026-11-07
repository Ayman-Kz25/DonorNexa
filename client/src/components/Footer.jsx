function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden rounded-t-[2.5rem] border-t border-white/10 bg-gradient-to-b from-[#96334F] to-[#7A2840] px-6 py-10 text-center shadow-[0_-12px_40px_rgba(150,51,79,0.18)] before:pointer-events-none before:absolute before:-left-10 before:-top-16 before:h-48 before:w-48 before:rounded-full before:bg-rose-300/20 before:blur-3xl after:pointer-events-none after:absolute after:-bottom-20 after:-right-10 after:h-56 after:w-56 after:rounded-full after:bg-[#BE4565]/30 after:blur-3xl">
      <p className="relative z-10 mx-auto max-w-7xl text-sm font-medium tracking-wide text-rose-100/90">
        © {new Date().getFullYear()} DonorNexa. Connecting Donors. Bridging
        Lives.
      </p>
    </footer>
  );
}

export default Footer;