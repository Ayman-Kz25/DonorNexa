
import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

function DonorAvailability() {
  const { request } = useApi()

  const [donor, setDonor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [reasons, setReasons] = useState([])

  useEffect(() => {
    const loadDonor = async () => {
      try {
        const response = await request({
          method: 'GET',
          url: '/api/donors/profile',
        })

        setDonor(response.data.donor)
      } catch (error) {
        setMessage(
          error.response?.data?.message || 'Unable to load donor profile.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDonor()
  }, [request])

  const handleAvailability = async () => {
    if (!donor) return

    setUpdating(true)
    setMessage('')
    setReasons([])

    try {
      const response = await request({
        method: 'PATCH',
        url: '/api/donors/availability',
        data: {
          isAvailable: !donor.isAvailable,
        },
      })

      setDonor((previous) => ({
        ...previous,
        isAvailable: response.data.isAvailable,
      }))

      setMessage(response.data.message)
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Unable to update availability.'
      )

      setReasons(error.response?.data?.reasons || [])
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <p className="text-[#96334F]">Loading availability...</p>
  }

  if (!donor) {
    return <p className="text-[#96334F]">{message}</p>
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-[#F3D5DE] bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-xl font-bold text-[#96334F]">
        Donor Availability
      </h2>

      <p className="mb-5 text-sm text-gray-600">
        Manage your availability to receive blood donation requests.
      </p>

      <div className="mb-5 flex items-center justify-between rounded-lg bg-[#FFF8FA] p-4">
        <div>
          <p className="font-semibold text-gray-800">
            Availability Status
          </p>

          <p className={`mt-1 text-sm font-medium ${
            donor.isAvailable ? 'text-[#BE4565]' : 'text-gray-500'
          }`}>
            {donor.isAvailable ? 'Available' : 'Unavailable'}
          </p>
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          donor.isAvailable
            ? 'bg-[#FCE7ED] text-[#96334F]'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {donor.isAvailable ? 'ON' : 'OFF'}
        </span>
      </div>

      <button
        type="button"
        onClick={handleAvailability}
        disabled={updating}
        className="w-full rounded-lg bg-[#BE4565] px-5 py-3 font-semibold text-white transition hover:bg-[#96334F] disabled:opacity-50"
      >
        {updating
          ? 'Updating...'
          : donor.isAvailable
            ? 'Turn Availability OFF'
            : 'Turn Availability ON'}
      </button>

      {message && (
        <div className="mt-4 rounded-lg bg-[#FFF8FA] p-3 text-sm text-[#96334F]">
          {message}
        </div>
      )}

      {reasons.length > 0 && (
        <div className="mt-3 rounded-lg border border-[#F3D5DE] p-3">
          <p className="mb-2 font-semibold text-[#96334F]">
            Eligibility requirements not met:
          </p>

          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
            {reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default DonorAvailability
