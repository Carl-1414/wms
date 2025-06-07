import React, { useState, useEffect } from 'react';
import './Reports.css';

const Reports = () => {
  const [overviewData, setOverviewData] = useState({
    availableReports: 0,
    generatedThisMonth: 0,
    recentDownloads: 0,
    storageUsed: '0 GB',
  });

  const [reportTypes, setReportTypes] = useState([]);
  const [recentReports, setRecentReports] = useState([]);

  const API_BASE_URL = 'http://localhost:3000/api';

  useEffect(() => {
    fetchOverviewData();
    fetchReportTypes();
    fetchRecentReports();
  }, []);

  const fetchOverviewData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/overview-stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOverviewData({
        ...data,
        storageUsed: data.storageUsedGB !== undefined ? `${data.storageUsedGB} GB` : 'N/A'
      });
    } catch (error) {
      console.error('Error fetching overview data:', error.message);
      setOverviewData({
        availableReports: 5, 
        generatedThisMonth: 0,
        recentDownloads: 0,
        storageUsed: 'N/A',
      });
    }
  };

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
      setReportTypes([
        { id: 'inventory', name: 'Inventory Report', description: 'Current stock levels and locations' },
        { id: 'shipments', name: 'Shipments Report', description: 'Incoming and outgoing shipment summary' },
        { id: 'audits', name: 'Audit Report', description: 'Inventory audit results and accuracy metrics' },
        { id: 'performance', name: 'Performance Report', description: 'Warehouse efficiency and KPI metrics' },
        { id: 'financial', name: 'Financial Report', description: 'Cost analysis and value reports' },
      ]);
    }
  };

  const fetchRecentReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/recent`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const transformedData = data.map(report => ({
        id: report.id,
        name: report.report_name,
        date: new Date(report.generated_at).toLocaleDateString(),
        type: report.report_type,
        size: report.file_size_kb ? `${(report.file_size_kb / 1024).toFixed(1)} MB` : 'N/A',
        fileName: report.id,
      }));
      setRecentReports(transformedData);
    } catch (error) {
      console.error('Error fetching recent reports:', error.message);
      setRecentReports([]);
    }
  };

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
      alert(data.message);
      fetchOverviewData();
      fetchRecentReports();
    } catch (error) {
      console.error(`Error generating ${reportId} report:`, error.message);
      alert(`Failed to generate report: ${error.message}`);
    }
  };

  const handleDownloadReport = async (reportId, userFriendlyName) => {
    const apiBaseUrl = API_BASE_URL;

    if (!reportId) {
      console.error('handleDownloadReport error: reportId is missing.');
      alert('Error: Report identifier is missing. Cannot download.');
      return;
    }

    console.log(`Attempting to download report. Report ID: "${reportId}", User-friendly Name: "${userFriendlyName}"`);

    try {
      const response = await fetch(`${apiBaseUrl}/reports/download/${encodeURIComponent(reportId)}`);

      if (!response.ok) {
        let errorDetail = `Server responded with status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.message || errorDetail;
        } catch (e) {
          errorDetail = response.statusText || `Failed to retrieve error details. Status: ${response.status}`;
        }
        console.error('Failed to download report. Detail:', errorDetail);
        alert(`Failed to download report: ${errorDetail}`);
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = userFriendlyName || reportId;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      console.log(`Report "${userFriendlyName || reportId}" download initiated.`);
    } catch (error) {
      console.error('An unexpected error occurred during download:', error);
      alert(`An unexpected error occurred while downloading the report: ${error.message || 'Please try again.'}`);
    }
  };

  const handleShareReport = async (reportName) => {
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
            {reportTypes.map(report => (
              <div key={report.id} className="report-type-card">
                <h3>{report.name}</h3>
                <p>{report.description}</p>
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
            {recentReports.length > 0 ? (
              recentReports.map((report, index) => (
                <div key={index} className="table-row">
                  <div className="report-name">{report.name}</div>
                  <div className="date">{report.date}</div>
                  <div className="type">{report.type}</div>
                  <div className="size">{report.size}</div>
                  <div className="actions">
                    <button className="action-btn download" onClick={() => handleDownloadReport(report.id, report.name)}>
                      Download
                    </button>
                    <button className="action-btn share" onClick={() => handleShareReport(report.name)}>
                      Share
                    </button>
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
