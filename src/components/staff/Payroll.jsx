"use client";

import { useState, useEffect } from "react";
import {
  FiCalendar,
  FiDollarSign,
  FiPrinter,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFileExcel,
  FaFilePdf,
  FaHistory,
  FaChartBar,
} from "react-icons/fa";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

function Payroll() {
  // State for date range selection
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State for payroll data
  const [payrollData, setPayrollData] = useState([]);
  const [historicalPayrolls, setHistoricalPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // State for UI controls
  const [activeTab, setActiveTab] = useState("current"); // 'current' or 'history'
  const [sortField, setSortField] = useState("staff");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showSummary, setShowSummary] = useState(true);

  // Set default date range to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(lastDay));

    const savedPayroll = localStorage.getItem("current_payroll");
    if (savedPayroll) {
      setPayrollData(JSON.parse(savedPayroll));
    }

    // Fetch historical payrolls on component mount
    fetchHistoricalPayrolls();
  }, []);

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      currencyDisplay: "code",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace(/^([A-Z]{3})\s*(.+)$/, "$2 $1");
  };

  const calculatePayroll = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    setCalculating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/payroll/calculate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start_date: startDate,
            end_date: endDate,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to calculate payroll");
      }

      const data = await response.json();
      console.log(data)
      setPayrollData(data.payrolls);
      localStorage.setItem("current_payroll", JSON.stringify(data.payrolls));

      // After calculation, refresh historical payrolls
      fetchHistoricalPayrolls();

      // Switch to current tab to show results
      setActiveTab("current");
    } catch (error) {
      console.error("Error calculating payroll:", error);
      alert("Failed to calculate payroll. Please try again.");
    } finally {
      setCalculating(false);
    }
  };

  const fetchHistoricalPayrolls = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/payroll/`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch historical payrolls");
      }

      const data = await response.json();
      setHistoricalPayrolls(data);
    } catch (error) {
      console.error("Error fetching historical payrolls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="inline ml-1" />;
    return sortDirection === "asc" ? (
      <FaSortUp className="inline ml-1" />
    ) : (
      <FaSortDown className="inline ml-1" />
    );
  };

  const sortedPayrollData = [...payrollData].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "staff":
        comparison = a.staff.localeCompare(b.staff);
        break;
      case "total_salary":
      case "daily_salary":
      case "normal_earned":
      case "overtime_earned":
      case "total_earned":
      case "tax":
      case "tips":
      case "net_salary_without_tips":
      case "net_salary_with_tips":
        comparison =
          Number.parseFloat(a[sortField]) - Number.parseFloat(b[sortField]);
        break;
      case "assigned_days":
        comparison = a.assigned_days - b.assigned_days;
        break;
      default:
        comparison = 0;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Calculate summary statistics
  const summaryStats =
    payrollData.length > 0
      ? {
          totalStaff: payrollData.length,
          totalGrossSalary: payrollData.reduce(
            (sum, item) => sum + Number.parseFloat(item.total_earned || 0),
            0
          ),
          totalTax: payrollData.reduce(
            (sum, item) => sum + Number.parseFloat(item.tax || 0),
            0
          ),
          totalNetSalary: payrollData.reduce(
            (sum, item) =>
              sum + Number.parseFloat(item.net_salary_with_tips || 0),
            0
          ),
          totalTips: payrollData.reduce(
            (sum, item) => sum + Number.parseFloat(item.tips || 0),
            0
          ),
          averageSalary:
            payrollData.reduce(
              (sum, item) => sum + Number.parseFloat(item.total_earned || 0),
              0
            ) / payrollData.length,
        }
      : null;

  const printPayroll = () => {
    const dataToPrint =
      activeTab === "current" ? payrollData : historicalPayrolls;

    const printWindow = window.open("", "_blank");

    const tableRows = dataToPrint
      .map((item) => {
        if (activeTab === "current") {
          // Current payroll data structure
          return `
            <tr>
              <td>${item.staff}</td>
              <td>${item.assigned_days}</td>
              <td>${formatCurrency(item.daily_salary)}</td>
              <td>${formatCurrency(item.normal_earned)}</td>
              <td>${formatCurrency(item.overtime_earned)}</td>
              <td>${formatCurrency(item.total_earned)}</td>
              <td>${formatCurrency(item.tax)}</td>
              <td>${formatCurrency(item.tips)}</td>
              <td>${formatCurrency(item.net_salary_with_tips)}</td>
            </tr>
          `;
        } else {
          // Historical payroll data structure
          return `
            <tr>
              <td>${item.id}</td>
              <td>${item.staff_id}</td>
              <td>${item.staff_name}</td>
              <td>${item.start_date} to ${item.end_date}</td>
              <td>${item.assigned_days}</td>
              <td>${formatCurrency(item.total_salary)}</td>
              <td>${formatCurrency(item.total_earned)}</td>
              <td>${formatCurrency(item.tax)}</td>
              <td>${formatCurrency(item.tips)}</td>
              <td>${formatCurrency(item.net_salary_with_tips)}</td>
            </tr>
          `;
        }
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Payroll Report (${startDate} to ${endDate})</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 30px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; }
          </style>
        </head>
              <body>
        <h1>${
          activeTab === "current"
            ? "Payroll Report"
            : "Full Payroll History Report"
        }</h1>
        <p>Period: ${
          activeTab === "current" ? `${startDate} to ${endDate}` : "Everything"
        }</p>

        <table>
          <thead>
            <tr>
              ${
                activeTab === "current"
                  ? `
                  <th>Staff</th>
                  <th>Days</th>
                  <th>Daily Rate</th>
                  <th>Regular</th>
                  <th>Overtime</th>
                  <th>Gross</th>
                  <th>Tax</th>
                  <th>Tips</th>
                  <th>Net Pay</th>
                `
                  : `
                  <th>ID</th>
                  <th>Staff ID</th>
                  <th>Staff Name</th>
                  <th>Period</th>
                  <th>Days</th>
                  <th>Total Salary</th>
                  <th>Total Earned</th>
                  <th>Tax</th>
                  <th>Tips</th>
                  <th>Net Salary</th>
                `
              }
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        ${
          activeTab === "current"
            ? `
            <div class="summary">
              <h2>Summary</h2>
              <p>Total Staff: ${summaryStats.totalStaff}</p>
              <p>
                Total Gross Salary: ${formatCurrency(
                  summaryStats.totalGrossSalary
                )}
              </p>
              <p>Total Tax: ${formatCurrency(summaryStats.totalTax)}</p>
              <p>
                Total Net Salary: ${formatCurrency(summaryStats.totalNetSalary)}
              </p>
            </div>
          `
            : ""
        }

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Add slight delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const exportToCSV = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === "current") {
      csvContent +=
        "Staff,Assigned Days,Daily Salary,Regular Pay,Overtime Pay,Gross Pay,Tax,Tips,Net Pay\n";

      payrollData.forEach((item) => {
        csvContent += `${item.staff},${item.assigned_days},${item.daily_salary},${item.normal_earned},${item.overtime_earned},${item.total_earned},${item.tax},${item.tips},${item.net_salary_with_tips}\n`;
      });
    } else {
      csvContent +=
        "ID,Staff ID,Staff Name,Period,Assigned Days,Total Salary,Total Earned,Tax,Tips,Net Salary\n";

      historicalPayrolls.forEach((item) => {
        csvContent += `${item.id},${item.staff_id},${item.staff_name},${item.start_date} to ${item.end_date},${item.assigned_days},${item.total_salary},${item.total_earned},${item.tax},${item.tips},${item.net_salary_with_tips}\n`;
      });
    }

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    {
      activeTab === "current"
        ? link.setAttribute(
            "download",
            `payroll_${startDate}_to_${endDate}.csv`
          )
        : link.setAttribute(
            "download",
            `Full_Payroll_History_${new Date().toLocaleString()}.csv`
          );
    }
    document.body.appendChild(link);

    // Trigger download and clean up
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Set title based on active tab
    const title =
      activeTab === "current"
        ? "Payroll Report"
        : "Full Payroll History Report";

    // Add title to the PDF
    doc.text(title, 14, 20);

    // Add period information
    const period =
      activeTab === "current"
        ? `Period: ${startDate} to ${endDate}`
        : "Period: Everything";
    doc.text(period, 14, 30);

    // Define table columns and rows based on active tab
    let columns = [];
    let rows = [];

    if (activeTab === "current") {
      // Columns for current payroll
      columns = [
        "Staff",
        "Days",
        "Daily Rate",
        "Regular",
        "Overtime",
        "Gross",
        "Tax",
        "Tips",
        "Net Pay",
      ];

      // Rows for current payroll
      rows = payrollData.map((item) => [
        item.staff,
        item.assigned_days,
        formatCurrency(item.daily_salary),
        formatCurrency(item.normal_earned),
        formatCurrency(item.overtime_earned),
        formatCurrency(item.total_earned),
        formatCurrency(item.tax),
        formatCurrency(item.tips),
        formatCurrency(item.net_salary_with_tips),
      ]);
    } else {
      // Columns for historical payroll
      columns = [
        "ID",
        "Staff ID",
        "Staff Name",
        "Period",
        "Days",
        "Total Salary",
        "Total Earned",
        "Tax",
        "Tips",
        "Net Salary",
      ];

      // Rows for historical payroll
      rows = historicalPayrolls.map((item) => [
        item.id,
        item.staff_id,
        item.staff_name,
        `${item.start_date} to ${item.end_date}`,
        item.assigned_days,
        formatCurrency(item.total_salary),
        formatCurrency(item.total_earned),
        formatCurrency(item.tax),
        formatCurrency(item.tips),
        formatCurrency(item.net_salary_with_tips),
      ]);
    }

    // Add table to the PDF
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] }, // Green header
    });

    // Add footer
    const footerText = `Generated on ${new Date().toLocaleString()}`;
    doc.text(footerText, 14, doc.internal.pageSize.height - 10);

    // Save the PDF
    const fileName =
      activeTab === "current"
        ? `Payroll_Report_${startDate}_to_${endDate}.pdf`
        : `Full_Payroll_History_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <section className="p-6 bg-gray-100 min-h-screen">
      <div className="w-full">
        <div className="flex justify-between items-center pr-8 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Payroll Management</h1>
            <p className="text-gray-500">
              Generate, export and analyze payroll data for staff
            </p>
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <button
                onClick={calculatePayroll}
                disabled={calculating}
                className="w-full md:w-auto bg-[#333] hover:bg-[#444] text-white py-2 px-4 rounded-md flex items-center justify-center"
              >
                {calculating ? (
                  <>
                    <FiRefreshCw className="animate-spin mr-2" /> Calculating...
                  </>
                ) : (
                  <>
                    <FiDollarSign className="mr-2" /> Calculate Payroll
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "current"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("current")}
          >
            Current Payroll
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "history"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("history")}
          >
            <FaHistory className="inline mr-1" /> Payroll History
          </button>
        </div>

        {/* Current Payroll Tab */}
        {activeTab === "current" && (
          <>
            {/* Summary Stats */}
            {payrollData.length > 0 && summaryStats && showSummary && (
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    <FaChartBar className="inline mr-2" /> Payroll Summary
                  </h2>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 mb-1">
                      Total Staff
                    </div>
                    <div className="text-2xl font-bold flex items-center">
                      <FiUsers className="mr-2" /> {summaryStats.totalStaff}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 mb-1">
                      Total Gross Salary
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(summaryStats.totalGrossSalary)}
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 mb-1">
                      Total Net Salary
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(summaryStats.totalNetSalary)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-red-600 mb-1">Total Tax</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(summaryStats.totalTax)}
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm text-yellow-600 mb-1">
                      Total Tips
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(summaryStats.totalTips)}
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="text-sm text-indigo-600 mb-1">
                      Average Gross Salary
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(summaryStats.averageSalary)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {payrollData.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {!showSummary && (
                  <button
                    onClick={() => setShowSummary(true)}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 py-1 px-3 rounded-md text-sm flex items-center"
                  >
                    <FaChartBar className="mr-1" /> Show Summary
                  </button>
                )}

                <button
                  onClick={printPayroll}
                  className="bg-gray-50 text-gray-600 hover:bg-gray-100 py-1 px-3 rounded-md text-sm flex items-center"
                >
                  <FiPrinter className="mr-1" /> Print
                </button>

                <button
                  onClick={exportToCSV}
                  className="bg-green-50 text-green-600 hover:bg-green-100 py-1 px-3 rounded-md text-sm flex items-center"
                >
                  <FaFileExcel className="mr-1" /> Export CSV
                </button>

                <button
                  onClick={exportToPDF}
                  className="bg-red-50 text-red-600 hover:bg-red-100 py-1 px-3 rounded-md text-sm flex items-center"
                >
                  <FaFilePdf className="mr-1" /> Export PDF
                </button>
              </div>
            )}

            {/* Payroll Data Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {payrollData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("staff")}
                        >
                          Staff {getSortIcon("staff")}
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("assigned_days")}
                        >
                          Days {getSortIcon("assigned_days")}
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("daily_salary")}
                        >
                          Daily Rate {getSortIcon("daily_salary")}
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("normal_earned")}
                        >
                          Regular {getSortIcon("normal_earned")}
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("overtime_earned")}
                        >
                          Overtime {getSortIcon("overtime_earned")}
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("total_earned")}
                        >
                          Gross {getSortIcon("total_earned")}
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("tax")}
                        >
                          Tax {getSortIcon("tax")}
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("tips")}
                        >
                          Tips {getSortIcon("tips")}
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("net_salary_with_tips")}
                        >
                          Net Pay {getSortIcon("net_salary_with_tips")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedPayrollData.map((item, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {item.staff}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {item.assigned_days}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {formatCurrency(item.daily_salary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {formatCurrency(item.normal_earned)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {formatCurrency(item.overtime_earned)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            {formatCurrency(item.total_earned)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-red-500">
                            {formatCurrency(item.tax)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-green-500">
                            {formatCurrency(item.tips)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                            {formatCurrency(item.net_salary_with_tips)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  {calculating ? (
                    <div className="flex flex-col items-center">
                      <FiRefreshCw className="animate-spin text-3xl mb-2" />
                      <p>Calculating payroll...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FiDollarSign className="text-3xl mb-2" />
                      <p>
                        Select a date range and click "Calculate Payroll" to
                        generate payroll data.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        {payrollData.length > 0 && activeTab === "history" && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={printPayroll}
              className="bg-gray-50 text-gray-600 hover:bg-gray-100 py-1 px-3 rounded-md text-sm flex items-center"
            >
              <FiPrinter className="mr-1" /> Print
            </button>

            <button
              onClick={exportToCSV}
              className="bg-green-50 text-green-600 hover:bg-green-100 py-1 px-3 rounded-md text-sm flex items-center"
            >
              <FaFileExcel className="mr-1" /> Export CSV
            </button>

            <button
              onClick={exportToPDF}
              className="bg-red-50 text-red-600 hover:bg-red-100 py-1 px-3 rounded-md text-sm flex items-center"
            >
              <FaFilePdf className="mr-1" /> Export PDF
            </button>
          </div>
        )}

        {/* Historical Payroll Tab */}
        {activeTab === "history" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <FiRefreshCw className="animate-spin text-3xl mb-2 mx-auto" />
                <p>Loading historical payroll data...</p>
              </div>
            ) : historicalPayrolls.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Earned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tips
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Salary
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historicalPayrolls.map((item, index) => (
                      <tr
                        key={item.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.staff_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.start_date} to {item.end_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.assigned_days}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatCurrency(item.total_salary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.total_earned)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                          {formatCurrency(item.tax)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500">
                          {formatCurrency(item.tips)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                          {formatCurrency(item.net_salary_with_tips)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No historical payroll records found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default Payroll;
