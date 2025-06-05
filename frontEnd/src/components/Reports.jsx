// reports.jsx
import React, { useState, useEffect } from 'react';
// Ensure this import is present to link your CSS file
import './Reports.css';

const Reports = () => {
  // State to hold the overview statistics (Available Reports, Generated This Month, etc.)
  const [overviewData, setOverviewData] = useState({
    availableReports: 0,
    generatedThisMonth: 0,
    recentDownloads: 0,
    storageUsed: '0 GB',
  });

  // State to hold the list of available report types
  const [reportTypes, setReportTypes] = useState([]);

  // State to hold the list of recently generated reports
  const [recentReports, setRecentReports] = useState([]);

  // Base URL for your backend API. Ensure this matches the port your server is running on.
  const API_BASE_URL = 'http://localhost:3000/api'; // As per your server.js, it's running on port 3000.

  // useEffect hook to fetch initial data when the component mounts
  // The empty dependency array `[]` ensures this runs only once.
  useEffect(() => {
    fetchOverviewData();
    fetchReportTypes();
    fetchRecentReports();
  }, []);

  /**
   * Fetches the overview statistics (available reports, generated this month, etc.) from the backend.
   */
  const fetchOverviewData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/overview`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOverviewData(data);
    } catch (error) {
      console.error('Error fetching overview data:', error.message);
      // Fallback to static/default values if the backend call fails
      setOverviewData({
        availableReports: 5, // Static fallback matching your initial setup
        generatedThisMonth: 'N/A',
        recentDownloads: 'N/A',
        storageUsed: 'N/A',
      });
    }
  };

  /**
   * Fetches the list of available report types from the backend.
   */
  const fetchReportTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/types`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setReportTypes(data);
    } catch (error) {
      console.error('Error fetching report types:', error.message);
      // Fallback to static report types if the backend call fails
      setReportTypes([
        { id: 'inventory', name: 'Inventory Report', description: 'Current stock levels and locations' },
        { id: 'shipments', name: 'Shipments Report', description: 'Incoming and outgoing shipment summary' },
        { id: 'audits', name: 'Audit Report', description: 'Inventory audit results and accuracy metrics' },
        { id: 'performance', name: 'Performance Report', description: 'Warehouse efficiency and KPI metrics' },
        { id: 'financial', name: 'Financial Report', description: 'Cost analysis and value reports' },
      ]);
    }
  };

  /**
   * Fetches the list of recently generated reports from the backend.
   */
  const fetchRecentReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/recent`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRecentReports(data);
    } catch (error) {
      console.error('Error fetching recent reports:', error.message);
      // Fallback to an empty array if the backend call fails
      setRecentReports([]);
    }
  };

  /**
   * Handles the generation of a new report.
   * Sends a POST request to the backend to trigger report generation.
   * After successful generation, it re-fetches overview data and recent reports to update the UI.
   * @param {string} reportId - The ID of the report type to generate (e.g., 'inventory', 'shipments').
   */
  const handleGenerateReport = async (reportId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportType: reportId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Use a custom modal or toast notification instead of alert() in a real app
      alert(data.message);
      // Re-fetch data to update counts and the list of recent reports
      fetchOverviewData();
      fetchRecentReports();
    } catch (error) {
      console.error(`Error generating ${reportId} report:`, error.message);
      alert(`Failed to generate report: ${error.message}`);
    }
  };

  /**
   * Handles the download of a report.
   * Sends a GET request to the backend to simulate a download and increment download count.
   * @param {string} reportName - The name of the report to download.
   */
  const handleDownloadReport = async (reportName) => {
    try {
      // Encode the report name to handle spaces or special characters in the URL
      const response = await fetch(`${API_BASE_URL}/reports/download/${encodeURIComponent(reportName)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      alert(data.message);
      // Re-fetch overview data to update the recent downloads count
      fetchOverviewData();
      // In a real application, you might trigger a file download here, e.g.:
      // window.open(`${API_BASE_URL}/reports/download-file-actual/${encodeURIComponent(reportName)}`);
    } catch (error) {
      console.error('Error downloading report:', error.message);
      alert(`Failed to download report: ${error.message}`);
    }
  };

  /**
   * Handles sharing a report.
   * Prompts the user for a recipient and sends a POST request to the backend.
   * @param {string} reportName - The name of the report to share.
   */
  const handleShareReport = async (reportName) => {
    // In a real application, you'd use a more sophisticated modal for input
    const recipient = prompt(`Enter recipient email to share "${reportName}":`);
    if (recipient) {
      try {
        const response = await fetch(`${API_BASE_URL}/reports/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reportName, recipient }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        alert(data.message);
      } catch (error) {
        console.error('Error sharing report:', error.message);
        alert(`Failed to share report: ${error.message}`);
      }
    }
  };

  return (
    <div className="reports">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        {/* The main "Generate Report" button here could open a modal for more options,
            or simply instruct the user to use the specific "Generate" buttons below. */}
        <button
          className="generate-btn"
          onClick={() => alert('Please select a specific report type to generate from the list below.')}
        >
          Generate Report
        </button>
      </div>

      <div className="reports-overview">
        <div className="overview-card">
          <h3>Available Reports</h3>
          <div className="overview-value">{overviewData.availableReports}</div>
        </div>
        <div className="overview-card">
          <h3>Generated This Month</h3>
          <div className="overview-value">{overviewData.generatedThisMonth}</div>
        </div>
        <div className="overview-card">
          <h3>Recent Downloads</h3>
          <div className="overview-value">{overviewData.recentDownloads}</div>
        </div>
        <div className="overview-card">
          <h3>Storage Used</h3>
          <div className="overview-value">{overviewData.storageUsed}</div>
        </div>
      </div>

      <div className="reports-content">
        <div className="report-types">
          <h2>Report Types</h2>
          <div className="types-grid">
            {/* Map through the reportTypes state, which is fetched from the backend */}
            {reportTypes.map(report => (
              <div key={report.id} className="report-type-card">
                <h3>{report.name}</h3>
                <p>{report.description}</p>
                {/* Attach the handleGenerateReport function to the Generate button */}
                <button className="generate-btn small" onClick={() => handleGenerateReport(report.id)}>
                  Generate
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-reports">
          <h2>Recent Reports</h2>
          <div className="reports-table">
            <div className="table-header">
              <div>Report Name</div>
              <div>Date</div>
              <div>Type</div>
              <div>Size</div>
              <div>Actions</div>
            </div>
            {/* Conditionally render recent reports or a "No data" message */}
            {recentReports.length > 0 ? (
              recentReports.map((report, index) => (
                <div key={index} className="table-row">
                  <div className="report-name">{report.name}</div>
                  <div className="date">{report.date}</div>
                  <div className="type">{report.type}</div>
                  <div className="size">{report.size}</div>
                  <div className="actions">
                    {/* Attach download and share handlers */}
                    <button className="action-btn download" onClick={() => handleDownloadReport(report.name)}>
                      Download
                    </button>
                    <button className="action-btn share" onClick={() => handleShareReport(report.name)}>
                      Share</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="table-row no-data">
                No recent reports found. Generate one to see it here!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
