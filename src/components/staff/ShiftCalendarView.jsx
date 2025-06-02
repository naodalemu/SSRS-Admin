import { useState, useEffect } from "react";
import { FaCheck, FaXmark } from "react-icons/fa6";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiTrash2,
} from "react-icons/fi";
import MessageModal from "../ui/MessageModal";

const ShiftCalendarView = ({ reloadKey }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [staffShifts, setStaffShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({});
  const [viewMode, setViewMode] = useState("month"); // 'week' or 'month'
  const [modalStatus, setModalStatus] = useState(null);
  const [modalMessage, setModalMessage] = useState("");

  const fetchData = async () => {
    try {
      // Fetch staff, shifts, and assignments in parallel
      const [staffResponse, shiftsResponse, assignmentsResponse] =
        await Promise.all([
          fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/getStaff`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }),
          fetch(`${import.meta.env.VITE_BASE_URL}/api/shifts`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }),
          fetch(`${import.meta.env.VITE_BASE_URL}/api/staff-shifts`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }),
          fetch(`${import.meta.env.VITE_BASE_URL}/api/mark-absent`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }),
        ]);

      if (staffResponse.ok && shiftsResponse.ok && assignmentsResponse.ok) {
        const staffData = await staffResponse.json();
        const shiftsData = await shiftsResponse.json();
        const assignmentsData = await assignmentsResponse.json();

        setStaff(staffData);
        setShifts(shiftsData);
        setStaffShifts(assignmentsData);

        // Fetch attendance for all staff
        const attendanceData = {};
        for (const staffMember of staffData) {
          const attendanceResponse = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/attendance/${staffMember.id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
              },
            }
          );
          if (attendanceResponse.ok) {
            const attendanceResult = await attendanceResponse.json();
            attendanceData[staffMember.id] = attendanceResult.attendance;
          }
        }
        setAttendance(attendanceData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setModalStatus(false);
      setModalMessage("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteStaffShift = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/staff-shifts/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete staff shift.");
      }

      // Remove the deleted shift from the state
      setStaffShifts((prevShifts) =>
        prevShifts.filter((shift) => shift.id !== id)
      );
    } catch (error) {
      console.error("Error deleting staff shift:", error);
      setModalStatus(false);
      setModalMessage(
        error.message || "An error occurred while deleting the staff shift."
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, [reloadKey]);

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Start date will be the first day minus the days from previous month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - daysFromPrevMonth);

    // We'll show 6 weeks (42 days) to ensure we cover the whole month
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }

    return days;
  };

  const getWeekDays = () => {
    const date = new Date(currentDate);
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Adjust to get Monday as the first day
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(date);
      weekDay.setDate(date.getDate() + i);
      days.push(weekDay);
    }

    return days;
  };

  const formatDate = (date) => {
    // Convert to East African Time (GMT+3)
    const offsetDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);

    // Format the date as YYYY-MM-DD in the local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getShiftsForDate = (date) => {
    const dateStr = formatDate(date);
    return staffShifts.filter((shift) => shift.date === dateStr);
  };

  const getShiftById = (id) => {
    return shifts.find((shift) => shift.id === id) || {};
  };

  const getStaffById = (id) => {
    return staff.find((s) => s.id === id) || {};
  };

  const getShiftColor = (shiftId) => {
    // Generate a consistent color based on the shift ID
    const colors = [
      "bg-blue-100 border-blue-300 text-blue-800",
      "bg-green-100 border-green-300 text-green-800",
      "bg-yellow-100 border-yellow-300 text-yellow-800",
      "bg-purple-100 border-purple-300 text-purple-800",
      "bg-pink-100 border-pink-300 text-pink-800",
      "bg-indigo-100 border-indigo-300 text-indigo-800",
      "bg-red-100 border-red-300 text-red-800",
    ];

    return colors[shiftId % colors.length];
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "week" ? "month" : "week");
  };

  const approveAttendance = async (attendanceId) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/admin/attendance/${attendanceId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to approve absent.");
      }

      // Fetch updated attendance data
      fetchData();
    } catch (error) {
      console.error("Error approving absent:", error);
      setModalStatus(false);
      setModalMessage(
        error.message || "An error occurred while approving absent."
      );
    }
  };

  const approveLate = async (attendanceRecords) => {
    try {
      // Find the clock_in record
      const clockInRecord = attendanceRecords.find(
        (record) => record.mode === "clock_in"
      );

      if (!clockInRecord) {
        throw new Error(
          "Clock-in record not found for approving late minutes."
        );
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/attendance/${
          clockInRecord.id
        }/approve-late`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to approve late attendance.");
      }

      // Fetch updated attendance data
      fetchData();
    } catch (error) {
      console.error("Error approving late attendance:", error);
      setModalStatus(false);
      setModalMessage(
        error.message || "An error occurred while approving late attendance."
      );
    }
  };

  const approveEarly = async (attendanceRecords) => {
    try {
      // Find the clock_out record
      const clockOutRecord = attendanceRecords.find(
        (record) => record.mode === "clock_out"
      );

      if (!clockOutRecord) {
        throw new Error(
          "Clock-out record not found for approving early minutes."
        );
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/attendance/${
          clockOutRecord.id
        }/approve-early`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to approve early attendance.");
      }

      // Fetch updated attendance data
      fetchData();
    } catch (error) {
      console.error("Error approving early attendance:", error);
      setModalStatus(false);
      setModalMessage(
        error.message || "An error occurred while approving early attendance."
      );
    }
  };

  const getAttendanceStatus = (staffId, staffShiftId, date) => {
    const today = formatDate(new Date());
    const formattedDate = formatDate(date);

    if (formattedDate > today) {
      // Do not show any attendance marks for future dates
      return null;
    }

    const attendanceForStaff = attendance[staffId] || [];
    const attendanceForShift = attendanceForStaff.find(
      (record) =>
        record.staff_shift_id === staffShiftId &&
        record.scanned_at &&
        record.scanned_at.startsWith(formattedDate)
    );

    // For past dates, show both present and absent attendance
    return attendanceForShift ? attendanceForShift.status : null;
  };

  const renderDayCell = (date) => {
    const isToday = formatDate(date) === formatDate(new Date());
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    const shiftsForDay = getShiftsForDate(date);

    return (
      <div
        key={date.toString()}
        className={`border border-gray-200 ${
          viewMode === "week" ? "min-h-[200px]" : "min-h-[100px]"
        } ${isCurrentMonth ? "bg-white" : "bg-gray-50"} ${
          isToday ? "border-blue-500 border-2" : ""
        }`}
      >
        <div className={`p-1 text-right ${isToday ? "bg-blue-50" : ""}`}>
          <span className={`text-sm ${isToday ? "font-bold" : ""}`}>
            {date.getDate()}
          </span>
        </div>
        <div
          className={`p-1 overflow-y-auto ${
            viewMode === "week" ? "max-h-96" : "max-h-24"
          }`}
        >
          {shiftsForDay.map((staffShift) => {
            const shift = getShiftById(staffShift.shift_id);
            const staffMember = getStaffById(staffShift.staff_id);
            const colorClass = getShiftColor(staffShift.shift_id);
            const attendanceStatus = getAttendanceStatus(
              staffShift.staff_id,
              staffShift.id, // Pass the staff_shift_id
              date
            );
            const attendanceRecords = attendance[staffShift.staff_id]?.filter(
              (record) =>
                record.staff_shift_id === staffShift.id &&
                record.scanned_at &&
                record.scanned_at.startsWith(formatDate(date))
            );
            const attendanceForShift =
              attendance[staffShift.staff_id]?.find(
                (record) =>
                  record.staff_shift_id === staffShift.id &&
                  record.scanned_at &&
                  record.scanned_at.startsWith(formatDate(date))
              ) || 0;

            // Aggregate data from clock_in and clock_out records
            const lateMinutes = attendanceRecords
              ?.filter((record) => record.mode === "clock_in")
              .reduce((acc, record) => acc + (record.late_minutes || 0), 0);

            const earlyMinutes = attendanceRecords
              ?.filter((record) => record.mode === "clock_out")
              .reduce((acc, record) => acc + (record.early_minutes || 0), 0);

            const lateApproved = attendanceRecords?.some(
              (record) => record.late_approved === 1
            );

            const earlyApproved = attendanceRecords?.some(
              (record) => record.early_approved === 1
            );

            return (
              <div
                key={`${staffShift.id}`}
                className={`text-xs p-1 mb-1 rounded border ${colorClass} truncate flex justify-between items-start`}
                title={`${staffMember.name || "Staff"}: ${
                  shift.name || "Shift"
                } (${staffShift.start_time || shift.start_time} - ${
                  staffShift.end_time || shift.end_time
                })`}
              >
                <div>
                  <div className="font-semibold truncate">
                    {staffMember.name || "Staff"}
                  </div>
                  <div className="truncate">{shift.name || "Shift"}</div>
                  <div className="truncate">
                    {staffShift.start_time || shift.start_time} -{" "}
                    {staffShift.end_time || shift.end_time}
                  </div>

                  <div className="flex space-x-1">
                    {/* Approve Attendance */}
                    {attendanceForShift &&
                    attendanceForShift.status === "present"
                      ? null
                      : attendanceForShift &&
                        attendanceForShift.status === "absent"
                      ? formatDate(date) <= formatDate(new Date()) && (
                          <button
                            onClick={() =>
                              approveAttendance(attendanceForShift.id)
                            }
                            className={`text-xs px-2 py-1 rounded ${
                              attendanceForShift?.approved_by_admin
                                ? "border border-green-500 text-green-500"
                                : "border border-[#333] text-[#333]"
                            }`}
                            title="Approve Absent"
                          >
                            AA
                          </button>
                        )
                      : null}

                    {/* Approve Late */}
                    {lateMinutes > 0 && (
                      <button
                        onClick={() =>
                          attendanceRecords && approveLate(attendanceRecords)
                        }
                        className={`text-xs px-2 py-1 rounded ${
                          lateApproved
                            ? "border border-green-500 text-green-500"
                            : "border border-[#333] text-[#333]"
                        }`}
                        title="Approve Late"
                      >
                        AL
                      </button>
                    )}

                    {/* Approve Early */}
                    {earlyMinutes > 0 && (
                      <button
                        onClick={() =>
                          attendanceRecords && approveEarly(attendanceRecords)
                        }
                        className={`text-xs px-2 py-1 rounded ${
                          earlyApproved
                            ? "border border-green-500 text-green-500"
                            : "border border-[#333] text-[#333]"
                        }`}
                        title="Approve Early"
                      >
                        AE
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  {attendanceStatus && (
                    <span
                      className={`text-md mb-2 ${
                        attendanceStatus === "present"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                      title={`Attendance: ${attendanceStatus}`}
                    >
                      {attendanceStatus === "present" ? (
                        <FaCheck />
                      ) : attendanceStatus === "absent" ? (
                        <FaXmark />
                      ) : null}
                    </span>
                  )}
                  <button
                    onClick={() => deleteStaffShift(staffShift.id)}
                    className="text-[#333] hover:text-[#444]"
                    title="Delete Shift"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    );
  }

  const days = viewMode === "month" ? getMonthDays() : getWeekDays();
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <section className="p-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-lg font-bold text-gray-800"></h1>

          <div className="flex items-center space-x-2">
            <button
              onClick={navigateToday}
              className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              Today
            </button>

            <button
              onClick={toggleViewMode}
              className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm flex items-center"
            >
              <FiCalendar className="mr-1" />
              {viewMode === "month" ? "Week View" : "Month View"}
            </button>

            <div className="flex items-center">
              <button
                onClick={navigatePrevious}
                className="bg-white border border-gray-300 rounded-l-md px-2 py-1"
              >
                <FiChevronLeft />
              </button>
              <div className="bg-white border-t border-b border-gray-300 px-3 font-medium">
                {viewMode === "month"
                  ? currentDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : `${days[0].toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })} - ${days[6].toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}`}
              </div>
              <button
                onClick={navigateNext}
                className="bg-white border border-gray-300 rounded-r-md px-2 py-1"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-7">
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-2 text-center font-medium bg-gray-50 border-b border-gray-200"
              >
                {day}
              </div>
            ))}
          </div>

          <div
            className={`grid grid-cols-7 ${
              viewMode === "month" ? "grid-rows-6" : "grid-rows-1"
            }`}
          >
            {days.map((day) => renderDayCell(day))}
          </div>
        </div>

        <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Legend</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shifts.map((shift) => (
              <div key={shift.id} className="flex items-center">
                <div
                  className={`w-4 h-4 rounded mr-2 ${getShiftColor(shift.id)}`}
                ></div>
                <span>
                  {shift.name} ({shift.start_time} - {shift.end_time})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Message Modal */}
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
      </div>
    </section>
  );
};

export default ShiftCalendarView;
