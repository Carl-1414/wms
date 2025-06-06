// WarehouseZones.js
import React, { useEffect, useState } from 'react';
import './WarehouseZones.css';

const WarehouseZones = () => {
    // Initialize zones as an empty array, it will be populated from the backend
    const [zones, setZones] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newZone, setNewZone] = useState({
        id: '',
        name: '',
        maxCapacity: '', // Matches backend expected key
        temperature: '',
        humidity: ''
    });
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedZoneIdForStock, setSelectedZoneIdForStock] = useState(null);
    const [stockQuantityChange, setStockQuantityChange] = useState('');

    // --- Fetch Zones from Backend on Component Mount ---
    const fetchZones = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/warehouse-zones'); // Adjust port if different
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setZones(data); // Set the zones state with data from backend
        } catch (error) {
            console.error('Error fetching zones:', error);
            // Optionally, show an error message to the user
        }
    };

    // --- Fetch Zones from Backend on Component Mount ---
    useEffect(() => {
        const fetchZones = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/warehouse-zones'); // Adjust port if different
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setZones(data); // Set the zones state with data from backend
            } catch (error) {
                console.error('Error fetching zones:', error);
                // Optionally, show an error message to the user
            }
        };

        fetchZones();
    }, []); // Empty dependency array means this runs once on mount

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewZone(prevZone => ({
            ...prevZone,
            [name]: value
        }));
    };

    // Handle form submission to backend
    const handleAddZone = async (e) => { // Make it async
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/api/warehouse-zones', { // Adjust port if different
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: newZone.id,
                    name: newZone.name,
                    max_capacity: parseInt(newZone.maxCapacity, 10), // Changed key to snake_case
                    temperature: parseInt(newZone.temperature, 10),
                    humidity: parseInt(newZone.humidity, 10)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }

            const responseData = await response.json(); // Get the full response data

            // Add the new zone (from responseData.zone) to the state
            if (responseData.zone) {
                setZones(prevZones => [...prevZones, responseData.zone]);
            } else {
                console.error('New zone data not found in server response. Full response:', responseData);
                // Consider re-fetching all zones to ensure UI consistency if this happens
                // fetchZones(); // You might need to ensure fetchZones is defined and accessible here
            }

            // Reset form fields
            setNewZone({
                id: '',
                name: '',
                maxCapacity: '',
                temperature: '',
                humidity: ''
            });
            setShowAddForm(false); // Close the modal
            console.log('New Zone Added:', responseData.zone);

        } catch (error) {
            console.error('Error adding zone:', error);
            alert(`Failed to add zone: ${error.message}`);
        }
    };

    const handleStockAdjustment = async (e) => {
        e.preventDefault();
        if (!selectedZoneIdForStock || stockQuantityChange === '') {
            alert('Please select a zone and enter a quantity.');
            return;
        }

        const quantity = parseInt(stockQuantityChange, 10);
        if (isNaN(quantity)) {
            alert('Please enter a valid number for quantity.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/zones/${selectedZoneIdForStock}/stock`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quantityChange: quantity }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
            }

            // Update the zones state with the updated zone information
            setZones(prevZones => 
                prevZones.map(z => 
                    z.id === selectedZoneIdForStock ? responseData.zone : z
                )
            );

            setShowStockModal(false);
            setSelectedZoneIdForStock(null);
            setStockQuantityChange('');
            alert(responseData.message || 'Stock updated successfully!');

        } catch (error) {
            console.error('Error adjusting stock:', error);
            alert(`Failed to adjust stock: ${error.message}`);
        }
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
        if (maxCapacity === 0) return 'Normal'; // Avoid division by zero
        const percentage = (capacity / maxCapacity) * 100;
        if (percentage >= 90) return 'Critical';
        if (percentage >= 75) return 'Warning';
        return 'Normal';
    };

    const handleDeleteZone = async (zoneId) => {
        if (window.confirm(`Are you sure you want to delete zone ${zoneId}? This action cannot be undone.`)) {
            try {
                const response = await fetch(`http://localhost:3000/api/warehouse-zones/${zoneId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    // Try to parse error message from backend if available
                    let errorMsg = `HTTP error! status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.message || errorMsg;
                    } catch (e) {
                        // Ignore if response is not JSON
                    }
                    throw new Error(errorMsg);
                }

                // If deletion is successful (e.g., status 200 or 204 No Content)
                setZones(prevZones => prevZones.filter(zone => zone.id !== zoneId));
                alert(`Zone ${zoneId} deleted successfully.`);

            } catch (error) {
                console.error('Error deleting zone:', error);
                alert(`Failed to delete zone: ${error.message}`);
            }
        }
    };

    // Calculate total products, critical zones, etc. from the fetched zones
    const totalProducts = zones.reduce((acc, zone) => acc + (zone.products_count || 0), 0);
    const criticalZones = zones.filter(zone => getCapacityStatus(zone.capacity, zone.max_capacity) === 'Critical').length;
    const avgCapacity = zones.length > 0
        ? Math.round(zones.reduce((acc, zone) => {
            const currentCapacity = zone.capacity || 0;
            const currentMaxCapacity = zone.max_capacity || 0;
            if (currentMaxCapacity === 0) return acc; // Avoid division by zero, don't add to sum for this zone
            return acc + (currentCapacity / currentMaxCapacity) * 100;
        }, 0) / zones.filter(zone => (zone.max_capacity || 0) > 0).length) // Divide only by zones with max_capacity > 0
        : 0;


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
                        {avgCapacity}%
                    </div>
                </div>
                <div className="overview-card">
                    <h3>Critical Zones</h3>
                    <div className="overview-value">
                        {criticalZones}
                    </div>
                </div>
                <div className="overview-card">
                    <h3>Total Products</h3>
                    <div className="overview-value">
                        {totalProducts}
                    </div>
                </div>
            </div>

            <div className="zones-grid">
                {zones.map((zone) => (
                    <div key={zone.id} className={`zone-card ${getCapacityStatus(zone.capacity, zone.max_capacity).toLowerCase()}`}>
                        <div className="zone-header">
                            <div> {/* Group title and status together */} 
                                <h3>Zone {zone.id}</h3>
                                <span className={`zone-status ${getCapacityStatus(zone.capacity, zone.max_capacity).toLowerCase()}`}>
                                    {getCapacityStatus(zone.capacity, zone.max_capacity)}
                                </span>
                            </div>
                            <button 
                                className="delete-zone-btn" 
                                onClick={() => handleDeleteZone(zone.id)}
                                title={`Delete Zone ${zone.id}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                        <h4>{zone.name}</h4>

                        <div className="zone-metrics">
                            <div className="metric">
                                <span className="metric-label">Capacity</span>
                                <div className="capacity-bar">
                                    <div
                                        className="capacity-fill"
                                        style={{
                                            width: `${(zone.capacity / zone.max_capacity) * 100}%`,
                                            backgroundColor: getStatusColor(getCapacityStatus(zone.capacity, zone.max_capacity))
                                        }}
                                    ></div>
                                </div>
                                <span className="metric-value">{zone.capacity}/{zone.max_capacity}</span>
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
                                <span className="metric-value">{zone.products_count || 0}</span>
                            </div>

                            <button 
                                className="adjust-stock-btn"
                                onClick={() => {
                                    setSelectedZoneIdForStock(zone.id);
                                    setShowStockModal(true);
                                    setStockQuantityChange(''); // Reset for new entry
                                }}
                            >
                                Adjust Stock
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showAddForm && (
                <div className={`modal-overlay ${showAddForm ? 'active' : ''}`} onClick={() => setShowAddForm(false)}>
                    <div className="modal modal-content-animated" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Zone</h2>
                            <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddZone} className="modal-body">
                            <div className="form-group">
                                <label>Zone ID</label>
                                <input
                                    type="text"
                                    name="id" // Add name attribute
                                    value={newZone.id}
                                    onChange={handleInputChange} // Use generic handler
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Zone Name</label>
                                <input
                                    type="text"
                                    name="name" // Add name attribute
                                    value={newZone.name}
                                    onChange={handleInputChange} // Use generic handler
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Max Capacity</label>
                                <input
                                    type="number"
                                    name="maxCapacity" // Add name attribute
                                    value={newZone.maxCapacity}
                                    onChange={handleInputChange} // Use generic handler
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Temperature (°C)</label>
                                <input
                                    type="number"
                                    name="temperature" // Add name attribute
                                    value={newZone.temperature}
                                    onChange={handleInputChange} // Use generic handler
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Humidity (%)</label>
                                <input
                                    type="number"
                                    name="humidity" // Add name attribute
                                    value={newZone.humidity}
                                    onChange={handleInputChange} // Use generic handler
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Zone</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {showStockModal && selectedZoneIdForStock && (
                <div className={`modal-overlay ${showStockModal ? 'active' : ''}`} onClick={() => setShowStockModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Adjust Stock for Zone {selectedZoneIdForStock}</h2>
                            <button className="close-btn" onClick={() => setShowStockModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleStockAdjustment}>
                            <div className="form-group">
                                <label htmlFor="stockQuantityChange">Quantity Change (+/-)</label>
                                <input
                                    type="number"
                                    id="stockQuantityChange"
                                    name="stockQuantityChange"
                                    value={stockQuantityChange}
                                    onChange={(e) => setStockQuantityChange(e.target.value)}
                                    placeholder="e.g., 10 or -5"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowStockModal(false)}>Cancel</button>
                                <button type="submit">Update Stock</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarehouseZones;