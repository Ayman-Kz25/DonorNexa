import DonorProfileForm from '../components/DonorProfileForm'
import DonorAvailability from '../components/DonorAvailability'

function DonorDashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-10">
      <h1 className="text-3xl font-bold text-[#96334F]">
        Donor Dashboard
      </h1>

      <DonorProfileForm />
      <DonorAvailability />
    </div>
  )
}

export default DonorDashboard