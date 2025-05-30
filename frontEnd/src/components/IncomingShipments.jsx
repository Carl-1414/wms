import React, { useState } from 'react';
import './IncomingShipments.css';

const IncomingShipments = () => {
  const [shipments, setShipments] = useState([
    { id: 'INC-001', supplier: 'TechCorp Industries', status: 'In Transit', eta: '2024-01-16 14:30', items: 145, value: 25000, trackingNumber: 'TC123456789' },
    { id: 'INC-002', supplier: 'Global Supplies Ltd', status: 'Arrived', eta: '2024-01-15 09:00', items: 89, value: 15000, trackingNumber: 'GS987654321' },
    { id: 'INC-003', supplier: 'MegaParts Co', status: 'Processing', eta: '2024-01-15 16:45', items: 267, value: 45000, trackingNumber: 'MP555666777' },
    { id: 'INC-004', supplier: 'Industrial Solutions', status: 'Scheduled', eta: '2024-01-17 10:00', items: 78, value: 12000, trackingNumber: 'IS111222333' },
    { id: 'INC-005', supplier: 'Premium Electronics', status: 'Delayed', eta: '2024-01-16 18:00', items: 156, value: 35000, trackingNumber: 'PE444555666' },
  ]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'In Transit': return '🚛';
      case 'Arrived': return '✅';
      case 'Processing': return '⚙️';
      case 'Scheduled': return '📅';
      case 'Delayed': return '⚠️';
      default: return '📦';
    }
  };

  const totalValue = shipments.reduce((acc, shipment) => acc + shipment.value, 0);
  const arrivedToday = shipments.filter(s => s.status === 'Arrived').length;
  const inTransit = shipments.filter(s => s.status === 'In Transit').length;

  return (
    <div className="incoming-shipments">
      <div className="page-header">
        <h1>Incoming Shipments</h1>
        <button className="add-btn">+ New Shipment</button>
      </div>

      <div className="shipments-overview">
        <div className="overview-card">
          <h3>Total Shipments</h3>
          <div className="overview-value">{shipments.length}</div>
        </div>
        <div className="overview-card">
          <h3>Arrived Today</h3>
          <div className="overview-value">{arrivedToday}</div>
        </div>
        <div className="overview-card">
          <h3>In Transit</h3>
          <div className="overview-value">{inTransit}</div>
        </div>
        <div className="overview-card">
          <h3>Total Value</h3>
          <div className="overview-value">${totalValue.toLocaleString()}</div>
        </div>
      </div>

      <div className="shipments-grid">
        {shipments.map(shipment => (
          <div key={shipment.id} className={`shipment-card ${shipment.status.toLowerCase().replace(' ', '-')}`}>
            <div className="shipment-header">
              <div className="shipment-id">
                <span className="status-icon">{getStatusIcon(shipment.status)}</span>
                {shipment.id}
              </div>
              <span className={`status-badge ${shipment.status.toLowerCase().replace(' ', '-')}`}>
                {shipment.status}
              </span>
            </div>
            
            <div className="shipment-details">
              <h3>{shipment.supplier}</h3>
              <div className="detail-row">
                <span className="label">ETA:</span>
                <span className="value">{new Date(shipment.eta).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Items:</span>
                <span className="value">{shipment.items}</span>
              </div>
              <div className="detail-row">
                <span className="label">Value:</span>
                <span className="value">${shipment.value.toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Tracking:</span>
                <span className="value tracking">{shipment.trackingNumber}</span>
              </div>
            </div>
            
            <div className="shipment-actions">
              <button className="action-btn primary">View Details</button>
              <button className="action-btn secondary">Track</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomingShipments;
