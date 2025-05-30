import React from 'react';
import './Dashboard.css';


const Dashboard = () => {
  const metrics = [
    { title: 'Total SKUs', value: '2,847', unit: 'products', trend: '+12.5%' },
    { title: 'Warehouse Zones', value: '8', unit: 'active', trend: '0%' },
    { title: 'Pending Audits', value: '3', unit: 'zones', trend: '-25%' },
    { title: 'Storage Capacity', value: '82%', unit: 'utilized', trend: '+5.2%' },
  ];

  const incomingShipments = [
    { id: 'INC-001', supplier: 'TechCorp Industries', status: 'In Transit', eta: '2 hours', items: 145 },
    { id: 'INC-002', supplier: 'Global Supplies Ltd', status: 'Arrived', eta: 'Now', items: 89 },
    { id: 'INC-003', supplier: 'MegaParts Co', status: 'Processing', eta: '30 mins', items: 267 },
  ];

  const outgoingShipments = [
    { id: 'OUT-001', customer: 'Retail Chain A', status: 'Ready', departure: '1 hour', items: 156 },
    { id: 'OUT-002', customer: 'E-commerce Hub', status: 'Loading', departure: 'Now', items: 78 },
    { id: 'OUT-003', customer: 'Distribution Center', status: 'Scheduled', departure: '3 hours', items: 203 },
  ];

  const warehouseZones = [
    { zone: 'A1 - Electronics', capacity: '85%', temperature: '20°C', status: 'Normal' },
    { zone: 'B2 - Fragile Items', capacity: '67%', temperature: '18°C', status: 'Normal' },
    { zone: 'C3 - Bulk Storage', capacity: '94%', temperature: '22°C', status: 'Critical' },
    { zone: 'D4 - Cold Storage', capacity: '71%', temperature: '4°C', status: 'Normal' },
  ];

  const recentAudits = [
    { zone: 'A1', date: '2024-01-15', discrepancies: 3, status: 'Resolved' },
    { zone: 'B2', date: '2024-01-14', discrepancies: 0, status: 'Clean' },
    { zone: 'C3', date: '2024-01-13', discrepancies: 7, status: 'Pending' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Warehouse Management Dashboard</h1>
        <div className="date">{new Date().toLocaleDateString()}</div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <h3>{metric.title}</h3>
            <div className="metric-value">
              {metric.value} <span className="unit">{metric.unit}</span>
            </div>
            <div className={`trend ${metric.trend.startsWith('+') ? 'positive' : metric.trend === '0%' ? 'neutral' : 'negative'}`}>
              {metric.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="widget">
          <h3>Incoming Shipments</h3>
          <div className="shipments-list">
            {incomingShipments.map((shipment, index) => (
              <div key={index} className="shipment-item">
                <div className="shipment-id">{shipment.id}</div>
                <div className="shipment-supplier">{shipment.supplier}</div>
                <div className={`shipment-status ${shipment.status.toLowerCase().replace(' ', '-')}`}>
                  {shipment.status}
                </div>
                <div className="shipment-eta">{shipment.eta}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="widget">
          <h3>Outgoing Shipments</h3>
          <div className="shipments-list">
            {outgoingShipments.map((shipment, index) => (
              <div key={index} className="shipment-item">
                <div className="shipment-id">{shipment.id}</div>
                <div className="shipment-customer">{shipment.customer}</div>
                <div className={`shipment-status ${shipment.status.toLowerCase()}`}>
                  {shipment.status}
                </div>
                <div className="shipment-departure">{shipment.departure}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="widget">
          <h3>Warehouse Zones Status</h3>
          <div className="zones-list">
            {warehouseZones.map((zone, index) => (
              <div key={index} className="zone-item">
                <div className="zone-name">{zone.zone}</div>
                <div className="zone-capacity">{zone.capacity}</div>
                <div className="zone-temp">{zone.temperature}</div>
                <div className={`zone-status ${zone.status.toLowerCase()}`}>
                  {zone.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="widget">
          <h3>Recent Audits</h3>
          <div className="audits-list">
            {recentAudits.map((audit, index) => (
              <div key={index} className="audit-item">
                <div className="audit-zone">Zone {audit.zone}</div>
                <div className="audit-date">{audit.date}</div>
                <div className="audit-discrepancies">{audit.discrepancies} issues</div>
                <div className={`audit-status ${audit.status.toLowerCase()}`}>
                  {audit.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


export default Dashboard;
