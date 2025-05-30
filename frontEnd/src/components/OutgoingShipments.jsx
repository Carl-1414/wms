import React, { useState } from 'react';
import './OutgoingShipments.css';

const OutgoingShipments = () => {
  const [shipments, setShipments] = useState([
    { id: 'OUT-001', customer: 'Retail Chain A', status: 'Ready', departure: '2024-01-16 10:00', items: 156, value: 28000, destination: 'New York, NY' },
    { id: 'OUT-002', customer: 'E-commerce Hub', status: 'Loading', departure: '2024-01-15 14:30', items: 78, value: 15000, destination: 'Los Angeles, CA' },
    { id: 'OUT-003', customer: 'Distribution Center', status: 'Scheduled', departure: '2024-01-17 08:00', items: 203, value: 42000, destination: 'Chicago, IL' },
    { id: 'OUT-004', customer: 'Wholesale Partner', status: 'Shipped', departure: '2024-01-15 16:45', items: 89, value: 18000, destination: 'Miami, FL' },
    { id: 'OUT-005', customer: 'Regional Store', status: 'Preparing', departure: '2024-01-16 12:00', items: 134, value: 25000, destination: 'Seattle, WA' },
  ]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Ready': return '✅';
      case 'Loading': return '📦';
      case 'Scheduled': return '📅';
      case 'Shipped': return '🚛';
      case 'Preparing': return '⚙️';
      default: return '📋';
    }
  };

  const totalValue = shipments.reduce((acc, shipment) => acc + shipment.value, 0);
  const shippedToday = shipments.filter(s => s.status === 'Shipped').length;
  const readyToShip = shipments.filter(s => s.status === 'Ready').length;

  return (
    <div className="outgoing-shipments">
      <div className="page-header">
        <h1>Outgoing Shipments</h1>
        <button className="add-btn">+ New Shipment</button>
      </div>

      <div className="shipments-overview">
        <div className="overview-card">
          <h3>Total Shipments</h3>
          <div className="overview-value">{shipments.length}</div>
        </div>
        <div className="overview-card">
          <h3>Ready to Ship</h3>
          <div className="overview-value">{readyToShip}</div>
        </div>
        <div className="overview-card">
          <h3>Shipped Today</h3>
          <div className="overview-value">{shippedToday}</div>
        </div>
        <div className="overview-card">
          <h3>Total Value</h3>
          <div className="overview-value">${totalValue.toLocaleString()}</div>
        </div>
      </div>

      <div className="shipments-grid">
        {shipments.map(shipment => (
          <div key={shipment.id} className={`shipment-card ${shipment.status.toLowerCase()}`}>
            <div className="shipment-header">
              <div className="shipment-id">
                <span className="status-icon">{getStatusIcon(shipment.status)}</span>
                {shipment.id}
              </div>
              <span className={`status-badge ${shipment.status.toLowerCase()}`}>
                {shipment.status}
              </span>
            </div>
            
            <div className="shipment-details">
              <h3>{shipment.customer}</h3>
              <div className="detail-row">
                <span className="label">Departure:</span>
                <span className="value">{new Date(shipment.departure).toLocaleString()}</span>
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
                <span className="label">Destination:</span>
                <span className="value">{shipment.destination}</span>
              </div>
            </div>
            
            <div className="shipment-actions">
              <button className="action-btn primary">View Details</button>
              <button className="action-btn secondary">Print Label</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutgoingShipments;
