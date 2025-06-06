import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext'; // Corrected import path
// You might need to install these if you haven't: npm install react-chartjs-2 chart.js
// import { Doughnut, Line, Bar } from 'react-chartjs-2';
// import {
//     Chart as ChartJS,
//     ArcElement,
//     Tooltip,
//     Legend,
//     CategoryScale,
//     LinearScale,
//     PointElement,
//     LineElement,
//     Title,
//     BarElement,
// } from 'chart.js';
import './Dashboard.css';

// If you're using FontAwesome, ensure you have these installed:
// npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faTruckLoading, faBoxes, faClipboardCheck, faTruckMoving } from '@fortawesome/free-solid-svg-icons';
// import Sidebar from '../components/Sidebar'; // Assuming you have a Sidebar component

// Register Chart.js components (if you use them, otherwise remove this block)
// ChartJS.register(
//     ArcElement,
//     Tooltip,
//     Legend,
//     CategoryScale,
//     LinearScale,
//     PointElement,
//     LineElement,
//     Title,
//     BarElement
// );

const Dashboard = () => {
    const { settings, loadingSettings, errorSettings } = useSettings(); 

    // State for Incoming Shipments - DYNAMICALLY LOADED
    const [incomingShipments, setIncomingShipments] = useState([]);
    const [loadingIncomingShipments, setLoadingIncomingShipments] = useState(true); // Renamed for clarity
    const [errorIncomingShipments, setErrorIncomingShipments] = useState(null);     // Renamed for clarity

    // State for Warehouse Zones - DYNAMICALLY LOADED
    const [warehouseZones, setWarehouseZones] = useState([]);
    const [loadingWarehouseZones, setLoadingWarehouseZones] = useState(true);   // Renamed for clarity
    const [errorWarehouseZones, setErrorWarehouseZones] = useState(null);       // Renamed for clarity

    // NEW: State for Outgoing Shipments - DYNAMICALLY LOADED (changed from hardcoded)
    const [outgoingShipments, setOutgoingShipments] = useState([]);
    const [loadingOutgoingShipments, setLoadingOutgoingShipments] = useState(true);
    const [errorOutgoingShipments, setErrorOutgoingShipments] = useState(null);

    // NEW: State for Recent Audits - DYNAMICALLY LOADED (changed from hardcoded)
    const [recentAudits, setRecentAudits] = useState([]);
    const [loadingRecentAudits, setLoadingRecentAudits] = useState(true);
    const [errorRecentAudits, setErrorRecentAudits] = useState(null);

    // NEW: State for Dashboard Stats - DYNAMICALLY LOADED
    const [dashboardStats, setDashboardStats] = useState({
        totalSkus: 0,
        warehouseZonesCount: 0,
        pendingAuditsCount: 0,
        storageCapacityPercentage: 0,
    });
    const [loadingDashboardStats, setLoadingDashboardStats] = useState(true);
    const [errorDashboardStats, setErrorDashboardStats] = useState(null);

    // Helper to format date/time for display
    const formatDateTime = (dateTimeString, type = 'date') => {
        if (!dateTimeString) return 'N/A';
        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) { // Check for invalid date
                return dateTimeString; // Return original if invalid
            }
            if (type === 'date') {
                const options = { year: 'numeric', month: 'short', day: 'numeric' };
                return date.toLocaleDateString(undefined, options);
            } else if (type === 'time') {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            }
            return dateTimeString; // Fallback
        } catch (e) {
            console.error("Error formatting date/time:", e, dateTimeString);
            return dateTimeString; // Fallback
        }
    };

    // Function to fetch incoming shipments from the backend
    const fetchIncomingShipments = async () => {
        setLoadingIncomingShipments(true);
        setErrorIncomingShipments(null);
        try {
            // CRITICAL FIX: Changed URL to match server.js
            const response = await fetch('http://localhost:3000/api/incoming-shipments');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setIncomingShipments(data); // No need for manual ETA formatting here, use helper in JSX
        } catch (error) {
            console.error('Error fetching incoming shipments:', error);
            setErrorIncomingShipments('Failed to load incoming shipments. Please check server connection.');
        } finally {
            setLoadingIncomingShipments(false);
        }
    };

    // Function to fetch warehouse zones from the backend
    const fetchWarehouseZones = async () => {
        setLoadingWarehouseZones(true);
        setErrorWarehouseZones(null);
        try {
            const response = await fetch('http://localhost:3000/api/warehouse-zones');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setWarehouseZones(data);
        } catch (error) {
            console.error('Error fetching warehouse zones:', error);
            setErrorWarehouseZones('Failed to load warehouse zones. Please check server connection.');
        } finally {
            setLoadingWarehouseZones(false);
        }
    };

    // NEW: Function to fetch outgoing shipments from the backend
    const fetchOutgoingShipments = async () => {
        setLoadingOutgoingShipments(true);
        setErrorOutgoingShipments(null);
        try {
            const response = await fetch('http://localhost:3000/api/outgoing-shipments');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setOutgoingShipments(data);
        } catch (error) {
            console.error('Error fetching outgoing shipments:', error);
            setErrorOutgoingShipments('Failed to load outgoing shipments. Please check server connection.');
        } finally {
            setLoadingOutgoingShipments(false);
        }
    };

    // NEW: Function to fetch recent audits from the backend
    const fetchRecentAudits = async () => {
        setLoadingRecentAudits(true);
        setErrorRecentAudits(null);
        try {
            // CRITICAL FIX: Changed URL to match server.js
            // CORRECTED: Changed URL to the existing '/api/inventory-audits' endpoint and added a limit
            const response = await fetch('http://localhost:3000/api/inventory-audits?limit=5');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setRecentAudits(data);
        } catch (error) {
            console.error('Error fetching recent audits:', error);
            setErrorRecentAudits('Failed to load recent audits. Please check server connection.');
        } finally {
            setLoadingRecentAudits(false);
        }
    };

    // NEW: Function to fetch dashboard summary statistics
    const fetchDashboardStats = async () => {
        setLoadingDashboardStats(true);
        setErrorDashboardStats(null);
        try {
            const response = await fetch('http://localhost:3000/api/dashboard-stats');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setDashboardStats(data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setErrorDashboardStats('Failed to load dashboard statistics.');
        } finally {
            setLoadingDashboardStats(false);
        }
    };

    // useEffect hook to fetch data when the component mounts
    useEffect(() => {
        fetchIncomingShipments();
        fetchWarehouseZones();
        fetchOutgoingShipments(); // Fetch outgoing shipments
        fetchRecentAudits();     // Fetch recent audits
        fetchDashboardStats();   // Fetch dashboard summary stats
    }, []);

    // Function to simulate adding a new incoming shipment (for demonstration purposes)
    const addSampleIncomingShipment = async () => {
        const newShipmentData = {
            supplier: `Supplier ${Math.floor(Math.random() * 100)}`,
            eta: new Date(Date.now() + Math.random() * 3600000 * 6).toISOString().slice(0, 19).replace('T', ' '),
            items: Math.floor(Math.random() * 50) + 1,
            value: (Math.random() * 1000 + 100).toFixed(2),
            tracking: `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            status: ['SCHEDULED', 'IN TRANSIT', 'PROCESSING', 'ARRIVED', 'DELAYED'][Math.floor(Math.random() * 5)],
        };

        try {
            const response = await fetch('http://localhost:3000/api/incoming-shipments', { // Match updated URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newShipmentData),
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                throw new Error(errorDetails.message || 'Failed to add shipment.');
            }

            alert('Incoming shipment added successfully! Updating dashboard...');
            fetchIncomingShipments();

        } catch (error) {
            console.error('Error adding sample incoming shipment:', error);
            alert(`Error adding incoming shipment: ${error.message}`);
        }
    };

    // Function to simulate adding a new warehouse zone (for demonstration purposes)
    const addSampleWarehouseZone = async () => {
        const newZoneData = {
            // Note: Your backend expects 'id', 'name', 'maxCapacity', 'temperature', 'humidity' for POST
            // Adjust this data to match your backend's POST /api/warehouse-zones endpoint
            id: `ZONE-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 9) + 1}`,
            name: `Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 9) + 1}`,
            maxCapacity: Math.floor(Math.random() * 1000) + 100, // Example max capacity
            temperature: Math.floor(Math.random() * 30) + 5,
            humidity: Math.floor(Math.random() * 50) + 30,
            // capacity and status are set by backend on insert
        };

        try {
            const response = await fetch('http://localhost:3000/api/warehouse-zones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newZoneData),
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                throw new Error(errorDetails.message || 'Failed to add warehouse zone.');
            }

            alert('Warehouse zone added successfully! Updating dashboard...');
            fetchWarehouseZones();

        } catch (error) {
            console.error('Error adding sample warehouse zone:', error);
            alert(`Error adding warehouse zone: ${error.message}`);
        }
    };

    // NEW: Function to simulate adding a new outgoing shipment
    const addSampleOutgoingShipment = async () => {
        const newShipmentData = {
            // Note: Your backend expects 'customer', 'departure', 'items', 'value', 'destination' for POST
            customer: `Customer ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            departure: new Date(Date.now() + Math.random() * 3600000 * 3).toISOString().slice(0, 19).replace('T', ' '), // Random departure within next 3 hours
            items: Math.floor(Math.random() * 30) + 1,
            value: (Math.random() * 500 + 50).toFixed(2),
            destination: `City ${String.fromCharCode(65 + Math.floor(Math.random() * 10))}`,
            status: ['SCHEDULED', 'LOADED', 'SHIPPED', 'DELAYED'][Math.floor(Math.random() * 4)],
        };

        try {
            const response = await fetch('http://localhost:3000/api/outgoing-shipments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newShipmentData),
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                throw new Error(errorDetails.message || 'Failed to add outgoing shipment.');
            }

            alert('Outgoing shipment added successfully! Updating dashboard...');
            fetchOutgoingShipments();

        } catch (error) {
            console.error('Error adding sample outgoing shipment:', error);
            alert(`Error adding outgoing shipment: ${error.message}`);
        }
    };

    // NEW: Function to simulate adding a new recent audit
    const addSampleRecentAudit = async () => {
        const newAuditData = {
            // Note: Your backend expects 'zone', 'scheduledDate', 'auditor', 'auditType' for POST
            zone: `ZONE-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 9) + 1}`, // Must be an existing zone ID
            scheduledDate: new Date().toISOString().slice(0, 10), // Current date
            auditor: `Auditor ${String.fromCharCode(65 + Math.floor(Math.random() * 10))}`,
            auditType: ['Full', 'Spot', 'Cycle'][Math.floor(Math.random() * 3)],
            // status, discrepancies, accuracy are set by backend on insert
        };

        try {
            const response = await fetch('http://localhost:3000/api/recent-audits', { // Match updated URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newAuditData),
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                throw new Error(errorDetails.message || 'Failed to add recent audit.');
            }

            alert('Recent audit added successfully! Updating dashboard...');
            fetchRecentAudits();

        } catch (error) {
            console.error('Error adding sample recent audit:', error);
            alert(`Error adding recent audit: ${error.message}`);
        }
    };

    // Determine the title for the dashboard
    let dashboardTitle = "Warehouse Management Dashboard"; // Default title
    if (loadingSettings) {
        dashboardTitle = "Loading Warehouse Name...";
    } else if (errorSettings) {
        dashboardTitle = "Error Loading Warehouse Name";
        console.error("Error loading settings for dashboard title:", errorSettings);
    } else if (settings && settings.warehouseName) {
        dashboardTitle = `${settings.warehouseName} Dashboard`;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>{dashboardTitle}</h1> 
                <div className="date">{new Date().toLocaleDateString()}</div>
            </div>

            <div className="metrics-grid">
                {loadingDashboardStats ? (
                    <div className="loading-message">Loading statistics...</div>
                ) : errorDashboardStats ? (
                    <div className="error-message">{errorDashboardStats}</div>
                ) : (
                    <>
                        <div className="metric-card">
                            <h3>Total SKUs</h3>
                            <div className="metric-value">
                                {dashboardStats.totalSkus !== undefined ? dashboardStats.totalSkus.toLocaleString() : 'N/A'} <span className="unit">products</span>
                            </div>
                            <div className="metric-trend">{/* Placeholder: e.g., +12.5% */}</div>
                        </div>
                        <div className="metric-card">
                            <h3>Warehouse Zones</h3>
                            <div className="metric-value">
                                {dashboardStats.warehouseZonesCount !== undefined ? dashboardStats.warehouseZonesCount.toLocaleString() : 'N/A'} <span className="unit">active</span>
                            </div>
                            <div className="metric-trend">{/* Placeholder: e.g., +0% */}</div>
                        </div>
                        <div className="metric-card">
                            <h3>Pending Audits</h3>
                            <div className="metric-value">
                                {dashboardStats.pendingAuditsCount !== undefined ? dashboardStats.pendingAuditsCount.toLocaleString() : 'N/A'} <span className="unit">zones</span>
                            </div>
                            <div className="metric-trend">{/* Placeholder: e.g., -25% */}</div>
                        </div>
                        <div className="metric-card">
                            <h3>Storage Capacity</h3>
                            <div className="metric-value">
                                {dashboardStats.storageCapacityPercentage !== undefined ? `${dashboardStats.storageCapacityPercentage}%` : 'N/A'} <span className="unit">utilized</span>
                            </div>
                            <div className="metric-trend">{/* Placeholder: e.g., +5.2% */}</div>
                        </div>
                    </>
                )}
            </div>

            <div className="horizontal-widgets">
                {/* Incoming Shipments Widget - Dynamic */}
                <div className="widget">
                    <div>
                        <h3>Incoming Shipments</h3>
                        {/* Uncomment this button to test adding incoming shipments */}
                        {/* <button onClick={addSampleIncomingShipment} style={{ padding: '8px 12px', cursor: 'pointer' }}>Add Sample Incoming Shipment</button> */}
                    </div>
                    <div className="list incoming-shipments-table">
                        {loadingIncomingShipments ? (
                            <div className="loading-message">Loading incoming shipments...</div>
                        ) : errorIncomingShipments ? (
                            <div className="error-message">{errorIncomingShipments}</div>
                        ) : incomingShipments.length === 0 ? (
                            <div className="empty-list-message">
                                No incoming shipments yet. Add one to see it appear here!
                            </div>
                        ) : (
                            incomingShipments.map((shipment) => (
                                <div key={shipment.id} className="shipment-row">
                                    <div className="shipment-col-id">{shipment.id}</div>
                                    <div className="shipment-col-supplier">{shipment.supplier}</div>
                                    <div className="shipment-col-status">
                                        <span className={`status-badge ${shipment.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {shipment.status}
                                        </span>
                                    </div>
                                    <div className="shipment-col-eta">{formatDateTime(shipment.eta, 'time')}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Outgoing Shipments Widget - Now Dynamic */}
                <div className="widget">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3>Outgoing Shipments</h3>
                        {/* Uncomment this button to test adding outgoing shipments */}
                        {/* <button onClick={addSampleOutgoingShipment} style={{ padding: '8px 12px', cursor: 'pointer' }}>Add Sample Outgoing Shipment</button> */}
                    </div>
                    <div className="list horizontal-list">
                        {loadingOutgoingShipments ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#777' }}>Loading outgoing shipments...</div>
                        ) : errorOutgoingShipments ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>{errorOutgoingShipments}</div>
                        ) : outgoingShipments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#777' }}>
                                No outgoing shipments yet. Add one to see it appear here!
                            </div>
                        ) : (
                            outgoingShipments.map((shipment) => (
                                <div key={shipment.id} className="shipment-item">
                                    <div className="shipment-id">{shipment.id}</div>
                                    <div className="shipment-customer">{shipment.customer}</div>
                                    <div className={`shipment-status ${shipment.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {shipment.status}
                                    </div>
                                    <div className="shipment-departure">{formatDateTime(shipment.departure, 'time')}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Warehouse Zones Status Widget - Dynamic */}
                <div className="widget">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3>Warehouse Zones Status</h3>
                        {/* Uncomment this button to test adding warehouse zones */}
                        {/* <button onClick={addSampleWarehouseZone} style={{ padding: '8px 12px', cursor: 'pointer' }}>Add Sample Zone</button> */}
                    </div>
                    <div className="list horizontal-list">
                        {loadingWarehouseZones ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#777' }}>Loading warehouse zones...</div>
                        ) : errorWarehouseZones ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>{errorWarehouseZones}</div>
                        ) : warehouseZones.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#777' }}>
                                No warehouse zone data available. Add a zone to see it here!
                            </div>
                        ) : (
                            warehouseZones.map((zone) => (
                                <div key={zone.id} className="zone-item">
                                    <div className="zone-name">{zone.name}</div> {/* Use zone.name */}
                                    <div className="zone-capacity">{zone.capacity}%</div> {/* Display as percentage */}
                                    <div className="zone-temp">{zone.temperature}°C</div>
                                    <div className={`zone-status ${zone.status.toLowerCase()}`}>
                                        {zone.status}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Audits Widget - Now Dynamic */}
                <div className="widget">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3>Recent Audits</h3>
                        {/* Uncomment this button to test adding recent audits */}
                        {/* <button onClick={addSampleRecentAudit} style={{ padding: '8px 12px', cursor: 'pointer' }}>Add Sample Audit</button> */}
                    </div>
                    <div className="list horizontal-list">
                        {loadingRecentAudits ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#777' }}>Loading recent audits...</div>
                        ) : errorRecentAudits ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>{errorRecentAudits}</div>
                        ) : recentAudits.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#777' }}>
                                No recent audits yet. Add one to see it appear here!
                            </div>
                        ) : (
                            recentAudits.map((audit) => (
                                <div key={audit.id} className="audit-item">
                                    <div className="audit-zone">{audit.zone}</div>
                                    <div className="audit-date">{formatDateTime(audit.date, 'date')}</div>
                                    <div className="audit-discrepancies">{audit.discrepancies} issues</div>
                                    <div className={`audit-status ${audit.status.toLowerCase()}`}>
                                        {audit.status}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;