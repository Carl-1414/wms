import React, { useEffect, useState } from 'react';
import './WarehouseZones.css';



  const WarehouseZones = () => {
    const [zones, setZones] = useState([
      { id: 'A1', name: 'Electronics Storage', capacity: 85, maxCapacity: 100, temperature: 20, humidity: 45, status: 'Normal', products: 156 },
      { id: 'B2', name: 'Fragile Items', capacity: 67, maxCapacity: 80, temperature: 18, humidity: 40, status: 'Normal', products: 89 },
      { id: 'C3', name: 'Bulk Storage', capacity: 94, maxCapacity: 120, temperature: 22, humidity: 50, status: 'Critical', products: 234 },
      { id: 'D4', name: 'Cold Storage', capacity: 71, maxCapacity: 90, temperature: 4, humidity: 60, status: 'Normal', products: 78 },
      { id: 'E5', name: 'Hazardous Materials', capacity: 45, maxCapacity: 60, temperature: 15, humidity: 35, status: 'Normal', products: 23 },
      { id: 'F6', name: 'Returns Processing', capacity: 23, maxCapacity: 50, temperature: 20, humidity: 45, status: 'Normal', products: 67 },
    ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newZone, setNewZone] = useState({
    id: '',
    name: '',
    maxCapacity: '',
    temperature: '',
    humidity: ''
  });

  const handleAddZone = (e) => {
    e.preventDefault();
    const zone = {
      ...newZone,
      capacity: 0,
      maxCapacity: parseInt(newZone.maxCapacity),
      temperature: parseInt(newZone.temperature),
      humidity: parseInt(newZone.humidity),
      status: 'Normal',
      products: 0
    };
    setZones([...zones, zone]);
    setNewZone({ id: '', name: '', maxCapacity: '', temperature: '', humidity: '' });
    setShowAddForm(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Normal': return '#38a169';
      case 'Critical': return '#e53e3e';
      case 'Warning': return '#d69e2e';
      default: return '#718096';
    }
  };

  const getCapacityStatus = (capacity, maxCapacity) => {
    const percentage = (capacity / maxCapacity) * 100;
    if (percentage >= 90) return 'Critical';
    if (percentage >= 75) return 'Warning';
    return 'Normal';
  };

  return (
    <div className="warehouse-zones">
      <div className="page-header">
        <h1>Warehouse Zones</h1>
        <button className="add-btn" onClick={() => setShowAddForm(true)}>
          + Add New Zone
        </button>
      </div>

      <div className="zones-overview">
        <div className="overview-card">
          <h3>Total Zones</h3>
          <div className="overview-value">{zones.length}</div>
        </div>
        <div className="overview-card">
          <h3>Average Capacity</h3>
          <div className="overview-value">
            {Math.round(zones.reduce((acc, zone) => acc + (zone.capacity / zone.maxCapacity) * 100, 0) / zones.length)}%
          </div>
        </div>
        <div className="overview-card">
          <h3>Critical Zones</h3>
          <div className="overview-value">
            {zones.filter(zone => zone.status === 'Critical').length}
          </div>
        </div>
        <div className="overview-card">
          <h3>Total Products</h3>
          <div className="overview-value">
            {zones.reduce((acc, zone) => acc + zone.products, 0)}
          </div>
        </div>
      </div>

      <div className="zones-grid">
        {zones.map((zone) => (
          <div key={zone.id} className={`zone-card ${zone.status.toLowerCase()}`}>
            <div className="zone-header">
              <h3>Zone {zone.id}</h3>
              <span className={`zone-status ${zone.status.toLowerCase()}`}>
                {zone.status}
              </span>
            </div>
            <h4>{zone.name}</h4>
            
            <div className="zone-metrics">
              <div className="metric">
                <span className="metric-label">Capacity</span>
                <div className="capacity-bar">
                  <div 
                    className="capacity-fill" 
                    style={{ 
                      width: `${(zone.capacity / zone.maxCapacity) * 100}%`,
                      backgroundColor: getStatusColor(getCapacityStatus(zone.capacity, zone.maxCapacity))
                    }}
                  ></div>
                </div>
                <span className="metric-value">{zone.capacity}/{zone.maxCapacity}</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Temperature</span>
                <span className="metric-value">{zone.temperature}°C</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Humidity</span>
                <span className="metric-value">{zone.humidity}%</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Products</span>
                <span className="metric-value">{zone.products}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Zone</h2>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
            </div>
            <form onSubmit={handleAddZone}>
              <div className="form-group">
                <label>Zone ID</label>
                <input
                  type="text"
                  value={newZone.id}
                  onChange={(e) => setNewZone({...newZone, id: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Zone Name</label>
                <input
                  type="text"
                  value={newZone.name}
                  onChange={(e) => setNewZone({...newZone, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Max Capacity</label>
                <input
                  type="number"
                  value={newZone.maxCapacity}
                  onChange={(e) => setNewZone({...newZone, maxCapacity: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Temperature (°C)</label>
                <input
                  type="number"
                  value={newZone.temperature}
                  onChange={(e) => setNewZone({...newZone, temperature: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Humidity (%)</label>
                <input
                  type="number"
                  value={newZone.humidity}
                  onChange={(e) => setNewZone({...newZone, humidity: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit">Add Zone</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseZones;
