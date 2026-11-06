
import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

function DonorProfileForm() {
  const { request } = useApi()

  const [formData, setFormData] = useState({
    bloodGroup: '',
    dateOfBirth: '',
    weight: '',
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await request({
          method: 'GET',
          url: '/api/donors/profile',
        })

        const donor = response.data.donor

        setFormData({
          bloodGroup: donor.bloodGroup,
          dateOfBirth: new Date(donor.dateOfBirth)
            .toISOString()
            .split('T')[0],
          weight: donor.weight,
        })

        setIsEditing(false)
      } catch (error) {
        if (error.response?.status !== 404) {
          setMessage('Unable to load donor profile.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [request])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage('')

    try {
      const response = await request({
        method: 'POST',
        url: '/api/donors/profile',
        data: {
          ...formData,
          weight: Number(formData.weight),
        },
      })

      setMessage(response.data.message)
      setIsEditing(false)
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Unable to save profile.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p className="text-center text-[#96334F]">Loading profile...</p>
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-xl bg-white p-6 shadow-md"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#96334F]">
          Donor Profile
        </h2>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="font-medium text-[#BE4565] hover:text-[#96334F]"
          >
            Edit Profile
          </button>
        )}
      </div>

      <label className="mb-2 block font-medium">Blood Group</label>
      <select
        name="bloodGroup"
        value={formData.bloodGroup}
        onChange={handleChange}
        disabled={!isEditing}
        required
        className="mb-4 w-full rounded-lg border p-3 disabled:bg-gray-100"
      >
        <option value="">Select blood group</option>
        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
          (group) => (
            <option key={group} value={group}>
              {group}
            </option>
          )
        )}
      </select>

      <label className="mb-2 block font-medium">Date of Birth</label>
      <input
        type="date"
        name="dateOfBirth"
        value={formData.dateOfBirth}
        onChange={handleChange}
        disabled={!isEditing}
        required
        className="mb-4 w-full rounded-lg border p-3 disabled:bg-gray-100"
      />

      <label className="mb-2 block font-medium">Weight (kg)</label>
      <input
        type="number"
        name="weight"
        value={formData.weight}
        onChange={handleChange}
        disabled={!isEditing}
        min="1"
        required
        className="mb-6 w-full rounded-lg border p-3 disabled:bg-gray-100"
      />

      {isEditing && (
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-lg bg-[#BE4565] px-5 py-3 font-semibold text-white hover:bg-[#96334F] disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      )}

      {message && (
        <p className="mt-4 text-center text-sm text-[#96334F]">
          {message}
        </p>
      )}
    </form>
  )
}

export default DonorProfileForm
