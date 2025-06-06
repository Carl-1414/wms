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
      // Corrected API endpoint
      const response = await fetch(`${API_BASE_URL}/reports/overview-stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Adapt backend data (storageUsedGB) to frontend state (storageUsed)
      setOverviewData({
        ...data,
        storageUsed: data.storageUsedGB !== undefined ? `${data.storageUsedGB} GB` : 'N/A'
      });
    } catch (error) {
      console.error('Error fetching overview data:', error.message);
      setOverviewData({
        availableReports: 5, 
        generatedThisMonth: 0, // Default to 0 or N/A
        recentDownloads: 0,
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
      // Transform backend data to match frontend expectations
      const transformedData = data.map(report => ({
        id: report.id, // Keep the ID for actions like download
        name: report.report_name,
        date: new Date(report.generated_at).toLocaleDateString(), // Format date
        type: report.report_type,
        size: report.file_size_kb ? `${(report.file_size_kb / 1024).toFixed(1)} MB` : 'N/A', // Format size
        // We'll use 'id' for download, so 'fileName' isn't strictly needed from backend for this step
        // but if backend later provides a real filename, it can be added here.
        fileName: report.id, // Using id as a placeholder for fileName for now for handleDownloadReport
      }));
      setRecentReports(transformedData);
    } catch (error) {
      console.error('Error fetching recent reports:', error.message);
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
   * Handles the download of an existing (recently generated) report.
   * @param {string} reportId - The ID of the report to download.
   * @param {string} userFriendlyName - The desired filename for the user's download (e.g., 'Inventory Report Q1.csv').
   */
  const handleDownloadReport = async (reportId, userFriendlyName) => {
    const apiBaseUrl = API_BASE_URL;

    if (!reportId) {
        console.error('handleDownloadReport error: reportId is missing.');
        alert('Error: Report identifier is missing. Cannot download.');
        return;
    }

    console.log(`Attempting to download report. Report ID: "${reportId}", User-friendly Name: "${userFriendlyName}"`);

    try {
        // The actual download endpoint needs to be created on the backend.
        // This will likely change to something like `${apiBaseUrl}/reports/download/${reportId}`
        // For now, this will fail or do nothing useful until backend is ready.
      const response = await fetch(`${apiBaseUrl}/reports/download/${encodeURIComponent(reportId)}`);

      if (!response.ok) {
            let errorDetail = `Server responded with status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorDetail = errorData.message || errorDetail;
            } catch (e) {
                // If response is not JSON or parsing fails, use status text or default message
                errorDetail = response.statusText || `Failed to retrieve error details. Status: ${response.status}`;
            }
            console.error('Failed to download report. Detail:', errorDetail);
            alert(`Failed to download report: ${errorDetail}`);
            return;
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none'; // Hide the anchor element
        a.href = downloadUrl;
        // Use the userFriendlyName for the downloaded file, fallback to diskFileName if userFriendlyName is not provided
        a.download = userFriendlyName || reportId;
        
        document.body.appendChild(a);
        a.click();
        
        // Clean up: remove the anchor and revoke the object URL
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        console.log(`Report "${userFriendlyName || reportId}" download initiated.`);
        // Optionally, re-fetch overview data if download counts are displayed and updated by the backend
        // fetchOverviewData(); 

    } catch (error) {
        console.error('An unexpected error occurred during download:', error);
        alert(`An unexpected error occurred while downloading the report: ${error.message || 'Please try again.'}`);
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
                    {/* Pass report.id as the first argument to handleDownloadReport */}
                    <button className="action-btn download" onClick={() => handleDownloadReport(report.id, report.name)}>
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