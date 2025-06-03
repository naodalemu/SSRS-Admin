import { useState, useEffect } from "react"
import { FiUser, FiMail, FiLock } from "react-icons/fi"

const AdminSignUp = () => {
  const [admins, setAdmins] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })

  const baseUrl = import.meta.env.VITE_BASE_URL

  // Fetch admins data
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${baseUrl}/api/admins`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
            Accept: "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setAdmins(data)
        } else {
          console.error("Failed to fetch admins data")
        }
      } catch (error) {
        console.error("Error fetching admins data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdmins()
  }, [baseUrl])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`${baseUrl}/api/register/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Refresh admins list
        const adminsResponse = await fetch(`${baseUrl}/api/admins`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
            Accept: "application/json",
          },
        })

        if (adminsResponse.ok) {
          const data = await adminsResponse.json()
          setAdmins(data)
        }

        // Reset form
        setFormData({
          name: "",
          email: "",
          password: "",
        })
      } else {
        console.error("Failed to add admin")
      }
    } catch (error) {
      console.error("Error adding admin:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if form is valid
  const isFormValid = () => {
    return formData.name.trim() !== "" && formData.email.trim() !== "" && formData.password.trim() !== ""
  }

  return (
    <section className="p-6 bg-gray-100 min-h-screen">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="text-gray-500">You can add new administrators and view existing ones here</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Admin Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-md p-4">
              <h2 className="text-xl font-bold mb-4">Add New Admin</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter full name"
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333]"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      autocomplete="new-password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter email address"
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333]"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      autocomplete="new-password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter password"
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333]"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      autocomplete="new-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors ${
                    isFormValid() ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                  disabled={isSubmitting || !isFormValid()}
                  title={!isFormValid() ? "Please fill all the fields before adding" : ""}
                >
                  {isSubmitting ? "Adding..." : "Add Admin"}
                </button>
              </form>
            </div>
          </div>

          {/* Admins List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-md p-4">
              <h2 className="text-xl font-bold mb-4">Existing Admins</h2>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array(4)
                    .fill(0)
                    .map((_, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4 animate-pulse">
                        <div className="flex items-center space-x-4">
                          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : admins.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="border border-gray-200 rounded-md p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex space-x-4">
                        <div className="h-12 w-12 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=random`}
                            alt={admin.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{admin.name}</div>
                          <div className="text-sm text-gray-600 truncate">{admin.email}</div>
                          <div className="text-xs text-gray-500">Role: {admin.role}</div>
                          <div className="text-xs text-gray-500">
                            Created: {new Date(admin.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiUser className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No administrators found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminSignUp
