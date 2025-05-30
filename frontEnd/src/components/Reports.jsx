import React, { useState } from 'react';
import './Reports.css';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('');

  const reportTypes = [
    { id: 'inventory', name: 'Inventory Report', description: 'Current stock levels and locations' },
    { id: 'shipments', name: 'Shipments Report', description: 'Incoming and outgoing shipment summary' },
    { id: 'audits', name: 'Audit Report', description: 'Inventory audit results and accuracy metrics' },
    { id: 'performance', name: 'Performance Report', description: 'Warehouse efficiency and KPI metrics' },
    { id: 'financial', name: 'Financial Report', description: 'Cost analysis and value reports' },
  ];

  const recentReports = [
    { name: 'Monthly Inventory Report', date: '2024-01-15', type: 'PDF', size: '2.3 MB' },
    { name: 'Weekly Shipments Summary', date: '2024-01-14', type: 'Excel', size: '1.8 MB' },
    { name: 'Q4 Performance Analysis', date: '2024-01-12', type: 'PDF', size: '4.2 MB' },
    { name: 'Audit Results - Zone A1', date: '2024-01-10', type: 'PDF', size: '1.5 MB' },
  ];

  return (
    <div className="reports">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <button className="generate-btn">Generate Report</button>
      </div>

      <div className="reports-overview">
        <div className="overview-card">
          <h3>Available Reports</h3>
          <div className="overview-value">{reportTypes.length}</div>
        </div>
        <div className="overview-card">
          <h3>Generated This Month</h3>
          <div className="overview-value">24</div>
        </div>
        <div className="overview-card">
          <h3>Recent Downloads</h3>
          <div className="overview-value">156</div>
        </div>
        <div className="overview-card">
          <h3>Storage Used</h3>
          <div className="overview-value">2.8 GB</div>
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
                <button className="generate-btn small">Generate</button>
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
            {recentReports.map((report, index) => (
              <div key={index} className="table-row">
                <div className="report-name">{report.name}</div>
                <div className="date">{report.date}</div>
                <div className="type">{report.type}</div>
                <div className="size">{report.size}</div>
                <div className="actions">
                  <button className="action-btn download">Download</button>
                  <button className="action-btn share">Share</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
