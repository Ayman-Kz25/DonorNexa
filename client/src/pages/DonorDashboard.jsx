import { Link } from 'react-router-dom'
import {
  Heart,
  Droplet,
  ShieldCheck,
  ArrowRight,
  ClipboardList,
  CalendarCheck,
} from 'lucide-react'

import DonorProfileForm from '../components/donor/DonorProfileForm'
import DonorAvailability from '../components/donor/DonorAvailability'
import DonorMatchedRequests from '../components/donor/DonorMatchedRequests'

function DonorDashboard() {
  const infoCards = [
    {
      icon: Heart,
      title: 'Your Impact',
      description: 'Every donation matters',
    },
    {
      icon: ShieldCheck,
      title: 'Donor Eligibility',
      description: 'Keep your information updated',
    },
    {
      icon: Droplet,
      title: 'Blood Donation',
      description: 'Keep your donation history updated',
    },
  ]

  return (
    <div className="min-h-screen bg-[#FFF8FA]">
      {/* Dashboard Header */}
      <section className="relative overflow-hidden border-b border-rose-100 bg-gradient-to-b from-[#FFF3F6] to-[#FFF8FA] px-6 pb-12 pt-32 md:pt-36">
        <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-[#FCE7ED] blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold tracking-wide text-[#96334F] shadow-sm shadow-rose-200/40 ring-1 ring-rose-200/40 backdrop-blur-md">
            <Droplet size={16} className="text-[#BE4565]" />
            DONOR PORTAL
          </span>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#29232A] sm:text-4xl lg:text-5xl">
            Donor{' '}
            <span className="bg-gradient-to-r from-[#BE4565] to-[#96334F] bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Manage your donor profile, keep your availability updated, and
            respond to blood requests matched with you.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-10 px-6 py-10">
        {/* Information Cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {infoCards.map((card) => {
            const Icon = card.icon

            return (
              <div
                key={card.title}
                className="group flex items-center gap-4 rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg shadow-rose-100/50 ring-1 ring-rose-200/40 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-200/60"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-[#BE4565] shadow-inner shadow-white/70 ring-1 ring-white/70 transition duration-300 group-hover:from-[#BE4565] group-hover:to-[#96334F] group-hover:text-white">
                  <Icon size={25} />
                </div>

                <div>
                  <h3 className="font-bold text-[#29232A]">{card.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {card.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Matched requests come first: they are the actionable part */}
        <DonorMatchedRequests />

        {/* Profile + Availability side by side on large screens */}
        <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
          {/* Profile */}
          <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm shadow-rose-100/50 sm:p-8 lg:col-span-2">
            <div className="mb-7 flex items-center gap-3 border-b border-rose-100 pb-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FCE7ED] text-[#BE4565]">
                <ClipboardList size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#29232A]">
                  Donor Information
                </h2>
                <p className="text-sm text-gray-500">
                  View and update your personal donor details.
                </p>
              </div>
            </div>

            <DonorProfileForm />
          </section>

          {/* Availability */}
          <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm shadow-rose-100/50 sm:p-8 lg:sticky lg:top-28">
            <div className="mb-7 flex items-center gap-3 border-b border-rose-100 pb-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FCE7ED] text-[#BE4565]">
                <CalendarCheck size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#29232A]">
                  Donation Availability
                </h2>
                <p className="text-sm text-gray-500">
                  Control whether hospitals can consider you for potential
                  matches.
                </p>
              </div>
            </div>

            <DonorAvailability />
          </section>
        </div>

        {/* Emergency Requests Link */}
        <section className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#96334F] to-[#7A2840] p-8 text-white shadow-2xl shadow-rose-300/40 sm:flex-row sm:items-center">
          <div className="pointer-events-none absolute -left-12 -top-16 h-52 w-52 rounded-full bg-rose-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-12 h-60 w-60 rounded-full bg-[#BE4565]/40 blur-3xl" />

          <div className="relative">
            <h2 className="text-xl font-bold">
              Explore Active Blood Requests
            </h2>
            <p className="mt-2 text-sm text-rose-100">
              Stay informed about current blood donation needs.
            </p>
          </div>

          <Link
            to="/emergency-requests"
            className="group relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#96334F] shadow-lg shadow-black/10 transition duration-200 hover:bg-rose-50 hover:shadow-xl"
          >
            View Requests
            <ArrowRight
              size={18}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </section>
      </main>
    </div>
  )
}

export default DonorDashboard