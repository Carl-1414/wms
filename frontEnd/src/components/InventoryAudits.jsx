// InventoryAudits.js
import React, { useEffect, useState } from 'react';
import './InventoryAudits.css'; // Assuming you have a CSS file for styling

const InventoryAudits = () => {
    const [audits, setAudits] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAudit, setNewAudit] = useState({
        zone: '',
        scheduledDate: '', // Frontend state uses camelCase for form inputs
        auditor: '',
        auditType: '',     // Frontend state uses camelCase for form inputs
    });
    const [warehouseZones, setWarehouseZones] = useState([]); // State for warehouse zones

    // State for displaying messages to the user (replaces alert())
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    // Function to display temporary messages
    const showMessage = (msg, type = 'info') => {
        setMessage(msg);
        setMessageType(type);
        // Hide message after 3 seconds
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 3000); 
    };

    // Fetch audits on component mount
    useEffect(() => {
        const fetchAudits = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/inventory-audits');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
                }
                const data = await response.json();
                setAudits(data);
            } catch (error) {
                console.error('Error fetching audits:', error);
                showMessage(`Failed to load audits: ${error.message}`, 'error'); // Display error to the user
            }
        };

        fetchAudits();
    }, []);

    // Fetch warehouse zones on component mount
    useEffect(() => {
        const fetchWarehouseZones = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/warehouse-zones');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
                }
                const data = await response.json();
                setWarehouseZones(data); // Populate the warehouseZones state
            } catch (error) {
                console.error('Error fetching warehouse zones:', error);
                showMessage(`Failed to load warehouse zones: ${error.message}`, 'error'); // Display error to the user
            }
        };

        fetchWarehouseZones();
    }, []); // Empty dependency array means this runs once on mount

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewAudit(prevAudit => ({
            ...prevAudit,
            [name]: value
        }));
    };

    const handleAddAudit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!newAudit.zone || !newAudit.scheduledDate || !newAudit.auditor || !newAudit.auditType) {
            showMessage('Please fill in all required fields.', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/inventory-audits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send the new audit data to the server
                body: JSON.stringify(newAudit),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }

            // The backend should return the newly created audit object with its generated ID and default values
            // The backend's response uses snake_case for database column names like 'scheduled_date' and 'audit_type'
            const addedAudit = await response.json();
            
            // Add the new audit to the state to update the UI
            setAudits(prevAudits => [...prevAudits, addedAudit]); 
            setNewAudit({ // Reset form fields
                zone: '',
                scheduledDate: '',
                auditor: '',
                auditType: '',
            });
            setShowAddForm(false); // Close the modal
            showMessage('New Audit Scheduled Successfully!', 'success');
        } catch (error) {
            console.error('Error scheduling audit:', error);
            showMessage(`Failed to schedule audit: ${error.message}`, 'error');
        }
    };

    // Helper function to get status color for styling audit cards
    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return '#38a169'; // Green
            case 'Scheduled': return '#d69e2e'; // Orange
            case 'Overdue': return '#e53e3e'; // Red
            case 'In Progress': return '#3182ce'; // Blue
            default: return '#718096'; // Gray
        }
    };

    // Calculate overview statistics based on current audits data
    const totalAudits = audits.length;
    const completedAudits = audits.filter(audit => audit.status === 'Completed').length;
    // Calculate overdue audits: those scheduled in the past and still 'Scheduled' or 'In Progress'
    const overdueAudits = audits.filter(audit => 
        new Date(audit.scheduled_date) < new Date() && 
        (audit.status === 'Scheduled' || audit.status === 'In Progress')
    ).length;
    const avgAccuracy = audits.length > 0
        // Ensure accuracy property exists and is a number before summing
        ? (audits.reduce((acc, audit) => acc + (audit.accuracy || 0), 0) / audits.length).toFixed(2)
        : 'N/A';

    return (
        <div className="inventory-audits">
            {/* Message display container */}
            {message && (
                <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${messageType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {message}
                </div>
            )}

            <div className="page-header">
                <h1>Inventory Audits</h1>
                <button className="add-btn" onClick={() => setShowAddForm(true)}>
                    + Schedule New Audit
                </button>
            </div>

            <div className="audits-overview">
                <div className="overview-card">
                    <h3>Total Audits</h3>
                    <div className="overview-value">{totalAudits}</div>
                </div>
                <div className="overview-card">
                    <h3>Completed Audits</h3>
                    <div className="overview-value">{completedAudits}</div>
                </div>
                <div className="overview-card">
                    <h3>Overdue Audits</h3>
                    <div className="overview-value">{overdueAudits}</div>
                </div>
                <div className="overview-card">
                    <h3>Average Accuracy</h3>
                    <div className="overview-value">{avgAccuracy}%</div>
                </div>
            </div>

            <div className="audits-grid">
                {audits.length === 0 ? (
                    <p className="no-audits-message">No inventory audits scheduled yet. Click "Schedule New Audit" to add one.</p>
                ) : (
                    audits.map((audit) => (
                        <div key={audit.id} className="audit-card">
                            <div className="audit-header">
                                <h3>Audit {audit.id}</h3>
                                <span className="audit-status" style={{ backgroundColor: getStatusColor(audit.status) }}>
                                    {audit.status}
                                </span>
                            </div>
                            <p><strong>Zone:</strong> {audit.zone}</p>
                            {/* Use audit.scheduled_date as returned from the backend */}
                            <p><strong>Scheduled Date:</strong> {new Date(audit.scheduled_date).toLocaleDateString()}</p>
                            <p><strong>Auditor:</strong> {audit.auditor}</p>
                            {/* Use audit.audit_type as returned from the backend */}
                            <p><strong>Type:</strong> {audit.audit_type}</p>
                            <p><strong>Discrepancies:</strong> {audit.discrepancies}</p>
                            <p><strong>Accuracy:</strong> {audit.accuracy}%</p>
                        </div>
                    ))
                )}
            </div>

            {/* Modal for adding new audit */}
            {showAddForm && (
                <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Schedule New Inventory Audit</h2>
                            <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddAudit}>
                            <div className="form-group">
                                <label>Zone</label>
                                <select
                                    name="zone"
                                    value={newAudit.zone}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Zone</option>
                                    {warehouseZones.map((zone) => (
                                        <option key={zone.id} value={zone.id}>
                                            {zone.name} ({zone.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Scheduled Date</label>
                                <input
                                    type="date"
                                    name="scheduledDate"
                                    value={newAudit.scheduledDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Auditor</label>
                                <input
                                    type="text"
                                    name="auditor"
                                    value={newAudit.auditor}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Audit Type</label>
                                <select
                                    name="auditType"
                                    value={newAudit.auditType}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Audit Type</option>
                                    <option value="Full">Full Audit</option>
                                    <option value="Cycle Count">Cycle Count</option>
                                    <option value="Spot Check">Spot Check</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
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
