import React, { useState } from 'react';
import './InventoryAudits.css';

const InventoryAudits = () => {
  const [audits, setAudits] = useState([
    { id: 'AUD-001', zone: 'A1', date: '2024-01-15', auditor: 'John Smith', discrepancies: 3, status: 'Resolved', accuracy: 98.5 },
    { id: 'AUD-002', zone: 'B2', date: '2024-01-14', auditor: 'Sarah Johnson', discrepancies: 0, status: 'Clean', accuracy: 100 },
    { id: 'AUD-003', zone: 'C3', date: '2024-01-13', auditor: 'Mike Wilson', discrepancies: 7, status: 'Pending', accuracy: 94.2 },
    { id: 'AUD-004', zone: 'D4', date: '2024-01-12', auditor: 'Lisa Brown', discrepancies: 2, status: 'Resolved', accuracy: 99.1 },
    { id: 'AUD-005', zone: 'E5', date: '2024-01-11', auditor: 'David Lee', discrepancies: 1, status: 'Resolved', accuracy: 99.5 },
  ]);

  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Clean': return '✅';
      case 'Resolved': return '🔧';
      case 'Pending': return '⏳';
      case 'In Progress': return '🔍';
      default: return '📋';
    }
  };

  const avgAccuracy = audits.reduce((acc, audit) => acc + audit.accuracy, 0) / audits.length;
  const pendingAudits = audits.filter(a => a.status === 'Pending').length;
  const totalDiscrepancies = audits.reduce((acc, audit) => acc + audit.discrepancies, 0);

  return (
    <div className="inventory-audits">
      <div className="page-header">
        <h1>Inventory Audits</h1>
        <button className="add-btn" onClick={() => setShowScheduleForm(true)}>
          + Schedule Audit
        </button>
      </div>

      <div className="audits-overview">
        <div className="overview-card">
          <h3>Total Audits</h3>
          <div className="overview-value">{audits.length}</div>
        </div>
        <div className="overview-card">
          <h3>Average Accuracy</h3>
          <div className="overview-value">{avgAccuracy.toFixed(1)}%</div>
        </div>
        <div className="overview-card">
          <h3>Pending Audits</h3>
          <div className="overview-value">{pendingAudits}</div>
        </div>
        <div className="overview-card">
          <h3>Total Discrepancies</h3>
          <div className="overview-value">{totalDiscrepancies}</div>
        </div>
      </div>

      <div className="audits-grid">
        {audits.map(audit => (
          <div key={audit.id} className={`audit-card ${audit.status.toLowerCase()}`}>
            <div className="audit-header">
              <div className="audit-id">
                <span className="status-icon">{getStatusIcon(audit.status)}</span>
                {audit.id}
              </div>
              <span className={`status-badge ${audit.status.toLowerCase()}`}>
                {audit.status}
              </span>
            </div>
            
            <div className="audit-details">
              <h3>Zone {audit.zone}</h3>
              <div className="detail-row">
                <span className="label">Date:</span>
                <span className="value">{audit.date}</span>
              </div>
              <div className="detail-row">
                <span className="label">Auditor:</span>
                <span className="value">{audit.auditor}</span>
              </div>
              <div className="detail-row">
                <span className="label">Discrepancies:</span>
                <span className={`value ${audit.discrepancies > 0 ? 'warning' : 'success'}`}>
                  {audit.discrepancies}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Accuracy:</span>
                <span className="value">{audit.accuracy}%</span>
              </div>
            </div>
            
            <div className="audit-actions">
              <button className="action-btn primary">View Report</button>
              <button className="action-btn secondary">Download</button>
            </div>
          </div>
        ))}
      </div>

      {showScheduleForm && (
        <div className="modal-overlay" onClick={() => setShowScheduleForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule New Audit</h2>
              <button className="close-btn" onClick={() => setShowScheduleForm(false)}>×</button>
            </div>
            <form>
              <div className="form-group">
                <label>Zone</label>
                <select required>
                  <option value="">Select Zone</option>
                  <option value="A1">Zone A1</option>
                  <option value="B2">Zone B2</option>
                  <option value="C3">Zone C3</option>
                  <option value="D4">Zone D4</option>
                  <option value="E5">Zone E5</option>
                </select>
              </div>
              <div className="form-group">
                <label>Scheduled Date</label>
                <input type="date" required />
              </div>
              <div className="form-group">
                <label>Auditor</label>
                <select required>
                  <option value="">Select Auditor</option>
                  <option value="John Smith">John Smith</option>
                  <option value="Sarah Johnson">Sarah Johnson</option>
                  <option value="Mike Wilson">Mike Wilson</option>
                  <option value="Lisa Brown">Lisa Brown</option>
                  <option value="David Lee">David Lee</option>
                </select>
              </div>
              <div className="form-group">
                <label>Audit Type</label>
                <select required>
                  <option value="">Select Type</option>
                  <option value="Full">Full Audit</option>
                  <option value="Spot">Spot Check</option>
                  <option value="Cycle">Cycle Count</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowScheduleForm(false)}>Cancel</button>
                <button type="submit">Schedule Audit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAudits;
