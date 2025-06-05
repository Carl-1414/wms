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
                    maxCapacity: parseInt(newZone.maxCapacity), // Ensure it's a number
                    temperature: parseInt(newZone.temperature), // Ensure it's a number
                    humidity: parseInt(newZone.humidity) // Ensure it's a number
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }

            const addedZone = await response.json(); // Get the added zone data from the backend response

            // Add the new zone to the state
            setZones(prevZones => [...prevZones, addedZone]);

            // Reset form fields
            setNewZone({
                id: '',
                name: '',
                maxCapacity: '',
                temperature: '',
                humidity: ''
            });
            setShowAddForm(false); // Close the modal
            console.log('New Zone Added:', addedZone);

        } catch (error) {
            console.error('Error adding zone:', error);
            alert(`Failed to add zone: ${error.message}`);
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

    // Calculate total products, critical zones, etc. from the fetched zones
    const totalProducts = zones.reduce((acc, zone) => acc + zone.products, 0);
    const criticalZones = zones.filter(zone => getCapacityStatus(zone.capacity, zone.maxCapacity) === 'Critical').length;
    const avgCapacity = zones.length > 0
        ? Math.round(zones.reduce((acc, zone) => acc + (zone.capacity / zone.maxCapacity) * 100, 0) / zones.length)
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
                    <div key={zone.id} className={`zone-card ${getCapacityStatus(zone.capacity, zone.maxCapacity).toLowerCase()}`}>
                        <div className="zone-header">
                            <h3>Zone {zone.id}</h3>
                            <span className={`zone-status ${getCapacityStatus(zone.capacity, zone.maxCapacity).toLowerCase()}`}>
                                {getCapacityStatus(zone.capacity, zone.maxCapacity)}
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