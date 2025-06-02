import { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { MdClose } from "react-icons/md";
import MessageModal from "../ui/MessageModal";

const ShiftTemplateManagement = () => {
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState({
    name: "",
    start_time: "09:00",
    end_time: "14:00",
    is_overtime: false,
    overtime_type: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [modalStatus, setModalStatus] = useState(null); // Modal visibility
  const [modalMessage, setModalMessage] = useState(""); // Modal message

  useEffect(() => {
    const fetchShiftTemplates = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/shifts`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setShiftTemplates(data);
        } else {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch shift templates"
          );
        }
      } catch (error) {
        console.error("Error fetching shift templates:", error);
        setModalStatus(false);
        setModalMessage(error.message);
      }
    };

    fetchShiftTemplates();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentTemplate((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = `${import.meta.env.VITE_BASE_URL}/api/shifts`;
      const method = "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(currentTemplate),
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to save shift template");
      }

      if (isEditing) {
        setShiftTemplates(
          shiftTemplates.map((template) =>
            template.id === currentTemplate.id ? data : template
          )
        );
      } else {
        setShiftTemplates([...shiftTemplates, data]);
      }

      resetForm();
    } catch (error) {
      console.error("Error saving shift template:", error);
      setModalStatus(false);
      setModalMessage(error.message);
    }
  };

  const deleteTemplate = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/shifts/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      let data = null;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const errorText = await response.text();
        
        if (errorText.includes("1451")) {
          throw new Error(
            "This shift is already being used and it can't be deleted."
          );
        }

        throw new Error("Unexpected response format from the server.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete shift template");
      }

      setShiftTemplates(
        shiftTemplates.filter((template) => template.id !== id)
      );
    } catch (error) {
      console.error("Error deleting shift template:", error);
      setModalStatus(false);
      setModalMessage(error.message);
    }
  };

  const resetForm = () => {
    setCurrentTemplate({
      name: "",
      start_time: "09:00",
      end_time: "14:00",
      is_overtime: false,
      overtime_type: "",
    });
    setIsEditing(false);
    setIsFormOpen(false);
  };

  return (
    <section className="p-6">
      <div className="">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Create Shift</h1>
            <p className="text-gray-500">
              Create shift templates you can use for shifts!
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-md flex items-center"
          >
            {isFormOpen ? (
              <MdClose className="mr-2" />
            ) : (
              <FiPlus className="mr-2" />
            )}{" "}
            {isFormOpen ? "Cancel" : "Add Shift Template"}
          </button>
        </div>

        {isFormOpen && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? "Edit Shift Template" : "Create Shift Template"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={currentTemplate.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-bg-[#333] focus:border-bg-[#333]"
                    placeholder="e.g., Morning Shift"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={currentTemplate.start_time}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-bg-[#333] focus:border-bg-[#333]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={currentTemplate.end_time}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-bg-[#333] focus:border-bg-[#333]"
                    required
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overtime
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      id="is_overtime"
                      type="checkbox"
                      name="is_overtime"
                      checked={currentTemplate.is_overtime}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[#333] focus:ring-[#333] border-gray-300 rounded"
                    />
                    <label
                      className="text-sm text-gray-700"
                      htmlFor="is_overtime"
                    >
                      Is this an overtime shift?
                    </label>
                  </div>
                </div>
                {currentTemplate.is_overtime && (
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Overtime Type
                    </label>
                    <select
                      name="overtime_type"
                      value={currentTemplate.overtime_type}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#333] focus:border-[#333]"
                      required
                    >
                      <option value="">Select Overtime Type</option>
                      <option value="normal">Normal</option>
                      <option value="holiday">Holiday</option>
                      <option value="weekend">Weekend</option>
                      <option value="night">Night</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="mr-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-md"
                >
                  {isEditing ? "Update" : "Create"} Template
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overtime
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shiftTemplates.length > 0 ? (
                shiftTemplates.map((template) => (
                  <tr key={template.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {template.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {template.start_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {template.end_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {template.is_overtime ? template.overtime_type : "No"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="inline" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No shift templates found. Create your first template!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalStatus !== null && (
        <MessageModal
          isItError={!modalStatus}
          message={modalMessage}
          closeMessageBackdrop={() => {
            setModalStatus(null);
            setModalMessage("");
          }}
        />
      )}
    </section>
  );
};

export default ShiftTemplateManagement;
