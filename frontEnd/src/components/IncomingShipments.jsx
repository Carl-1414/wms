import React, { useState, useEffect } from 'react';
import './IncomingShipments.css';
import './StandardModal.css'; // Import standard modal styles

const IncomingShipments = () => {
    const [shipments, setShipments] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false); // State to control visibility of edit form
    const [newShipmentData, setNewShipmentData] = useState({
        supplier: '',
        eta: '',
        items: '',
        value: '',
        tracking: '',
        status: 'Scheduled',
    });
    const [editingShipment, setEditingShipment] = useState(null); // State to hold shipment being edited
    const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
    const [selectedShipmentForDetails, setSelectedShipmentForDetails] = useState(null);
    const [error, setError] = useState(null); // For displaying API errors

    useEffect(() => {
        fetchShipments();
    }, []);

    const fetchShipments = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/incoming-shipments');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setShipments(data);
        } catch (error) {
            console.error("Failed to fetch shipments:", error);
            setError("Failed to load shipments from the server.");
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'In Transit': return '🚛';
            case 'Arrived': return '✅';
            case 'Processing': return '⚙️';
            case 'Scheduled': return '�';
            case 'Delayed': return '⚠️';
            case 'Cancelled': return '❌'; // Added cancelled icon
            default: return '📦';
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (showAddForm) {
            setNewShipmentData(prevData => ({
                ...prevData,
                [name]: value
            }));
        } else if (showEditForm) {
            setEditingShipment(prevData => ({
                ...prevData,
                [name]: value
            }));
        }
    };

    const handleAddShipment = async (e) => {
        e.preventDefault();

        if (!newShipmentData.supplier || !newShipmentData.eta || newShipmentData.items === '' || newShipmentData.value === '' || !newShipmentData.tracking) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/incoming-shipments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    supplier: newShipmentData.supplier,
                    eta: newShipmentData.eta,
                    items: Number(newShipmentData.items),
                    value: Number(newShipmentData.value),
                    tracking: newShipmentData.tracking,
                    status: newShipmentData.status
                })
            });

            if (response.ok) {
                fetchShipments();
                setShowAddForm(false);
                setNewShipmentData({
                    supplier: '',
                    eta: '',
                    items: '',
                    value: '',
                    tracking: '',
                    status: 'Scheduled',
                });
                alert('New shipment added successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to add shipment: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Error adding shipment:', error);
            alert(`Error connecting to the backend: ${error.message}`);
        }
    };

    // Function to open the edit form with pre-filled data
    const handleEditClick = (shipment) => {
        setEditingShipment({
            ...shipment,
            // Format ETA for datetime-local input
            eta: new Date(shipment.eta).toISOString().slice(0, 16)
        });
        setShowEditForm(true);
        setShowAddForm(false); // Ensure add form is closed
    };

    // Handler for submitting the edited shipment form
    const handleUpdateShipment = async (e) => {
        e.preventDefault();

        if (!editingShipment.supplier || !editingShipment.eta || editingShipment.items === '' || editingShipment.value === '' || !editingShipment.tracking) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/incoming-shipments/${editingShipment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    supplier: editingShipment.supplier,
                    eta: editingShipment.eta,
                    items: Number(editingShipment.items),
                    value: Number(editingShipment.value),
                    tracking: editingShipment.tracking,
                    status: editingShipment.status
                })
            });

            if (response.ok) {
                fetchShipments(); // Re-fetch to show updated data
                setShowEditForm(false); // Close the edit form
                setEditingShipment(null); // Clear editing state
                alert('Shipment updated successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to update shipment: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Error updating shipment:', error);
            alert(`Error connecting to the backend: ${error.message}`);
        }
    };

    const handleDeleteShipment = async (id) => {
        const confirmed = window.confirm("Are you sure you want to delete this shipment? This action cannot be undone.");
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/incoming-shipments/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const contentType = response.headers.get("content-type");
                let successMessage = 'Shipment deleted successfully!'; // Default success message
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    try {
                        const result = await response.json();
                        successMessage = result.message || successMessage;
                    } catch (parseError) {
                        console.error('Failed to parse successful JSON response (body might be HTML):', parseError);
                        // successMessage remains the default. The backend might have processed the delete.
                    }
                }
                alert(successMessage);
                fetchShipments(); // Re-fetch to show updated data
            } else {
                // Handle error responses more carefully
                let alertMessage;
                const responseText = await response.text(); // Get body as text first
                try {
                    const errorData = JSON.parse(responseText); // Try to parse the text we got
                    alertMessage = `Failed to delete shipment: ${errorData.message || response.statusText}`;
                } catch (parseError) {
                    // Parsing failed, responseText is not JSON (likely HTML or plain text)
                    console.error('Error response was not valid JSON. Status:', response.status, 'Body snippet:', responseText.substring(0, 200));
                    alertMessage = `Failed to delete shipment: ${response.statusText} (Server returned a non-JSON error).`;
                }
                alert(alertMessage);
                setError(alertMessage); // Set the error state for display in the error bar
            }
        } catch (error) {
            // This catch handles network errors or other unexpected errors during fetch/processing
            console.error('Network or other error deleting shipment:', error);
            let displayMessage = `An error occurred: ${error.message}`;
            if (error instanceof SyntaxError && error.message.toLowerCase().includes('json')) {
                displayMessage = 'Error: The server returned an unexpected response (likely HTML instead of JSON). Please check backend server logs for errors and ensure it is running correctly.';
            } else if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
                displayMessage = 'Error: Could not connect to the backend server. Please ensure it is running and accessible at http://localhost:3000.';
            }
            alert(displayMessage);
            setError(displayMessage);
        }
    };

    const handleViewDetailsClick = (shipment) => {
        setSelectedShipmentForDetails(shipment);
        setShowViewDetailsModal(true);
        setShowAddForm(false); // Ensure other modals are closed
        setShowEditForm(false);
    };

    // Calculations for overview cards (now based on fetched data)
    const totalShipments = shipments.length;
    const arrivedToday = shipments.filter(s => {
        const etaDate = new Date(s.eta);
        const today = new Date();
        return s.status === 'Arrived' &&
               etaDate.getFullYear() === today.getFullYear() &&
               etaDate.getMonth() === today.getMonth() &&
               etaDate.getDate() === today.getDate();
    }).length;
    const inTransit = shipments.filter(s => s.status === 'In Transit').length;
    const totalValue = shipments.reduce((acc, shipment) => acc + shipment.value, 0);

    return (
        <div className="incoming-shipments">
            <div className="page-header">
                <h1>Incoming Shipments</h1>
                <button className="add-btn" onClick={() => { setShowAddForm(true); setShowEditForm(false); setEditingShipment(null); }}>+ New Shipment</button>
            </div>

            <div className="shipments-overview">
                <div className="overview-card">
                    <h3>Total Shipments</h3>
                    <div className="overview-value">{totalShipments}</div>
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

            {/* Add New Incoming Shipment Modal */}
            {showAddForm && (
                <div className="standard-modal-overlay">
                    <div className="standard-modal-content">
                        <div className="standard-modal-header">
                            <h2>Add New Incoming Shipment</h2>
                            <button onClick={() => setShowAddForm(false)} className="standard-modal-close-button">&times;</button>
                        </div>
                        <form onSubmit={handleAddShipment}>
                            <div className="standard-form-group">
                                <label htmlFor="supplier">Supplier:</label>
                                <input type="text" id="supplier" name="supplier" value={newShipmentData.supplier} onChange={handleInputChange} placeholder="e.g., TechCorp Industries" required />
                            </div>
                            <div className="standard-form-group">
                                <label htmlFor="eta">Estimated Arrival (ETA):</label>
                                <input type="datetime-local" id="eta" name="eta" value={newShipmentData.eta} onChange={handleInputChange} required />
                            </div>
                            <div className="standard-form-group">
                                <label htmlFor="items">Number of Items:</label>
                                <input type="number" id="items" name="items" value={newShipmentData.items} onChange={handleInputChange} placeholder="e.g., 165" required />
                            </div>
                            <div className="standard-form-group">
                                <label htmlFor="value">Total Value ($):</label>
                                <input type="number" id="value" name="value" value={newShipmentData.value} onChange={handleInputChange} placeholder="e.g., 25000" required />
                            </div>
                            <div className="standard-form-group">
                                <label htmlFor="tracking">Tracking Number:</label>
                                <input type="text" id="tracking" name="tracking" value={newShipmentData.tracking} onChange={handleInputChange} placeholder="e.g., TC123456789" required />
                            </div>
                            <div className="standard-form-group">
                                <label htmlFor="status">Status:</label>
                                <select id="status" name="status" value={newShipmentData.status} onChange={handleInputChange}>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="In Transit">In Transit</option>
                                    <option value="Arrived">Arrived</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Delayed">Delayed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="standard-modal-actions">
                                <button type="submit" className="confirm-button">Add Shipment</button>
                                <button type="button" onClick={() => setShowAddForm(false)} className="cancel-button">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Shipment Form Modal */}
            {showEditForm && editingShipment && (
                <div className="standard-modal-overlay">
                    <div className="standard-modal-content">
                        <div className="standard-modal-header">
                            <h2>Edit Incoming Shipment (ID: {editingShipment.id})</h2>
                            <button onClick={() => setShowEditForm(false)} className="standard-modal-close-button">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateShipment}>
                            <div className="standard-form-group">
                                <label htmlFor="edit-supplier">Supplier:</label>
                                <input type="text" id="edit-supplier" name="supplier" value={editingShipment.supplier} onChange={handleInputChange} required />
                            </div>
                            <div className="standard-form-group">
                                <label htmlFor="edit-eta">Estimated Arrival (ETA):</label>
                                <input type="datetime-local" id="edit-eta" name="eta" value={editingShipment.eta} onChange={handleInputChange} required />
                            </div>
                            <div className="standard-form-group">
                                <label htmlFor="edit-items">Number of Items:</label>
                                <input type="number" id="edit-items" name="items" value={editingShipment.items} onChange={handleInputChange} required />
                            </div>
                            <div className="standard-form-group">
                                <label htmlFor="edit-value">Total Value ($):</label>
                                <input type="number" id="edit-value" name="value" value={editingShipment.value} onChange={handleInputChange} required />
                            </div>
                            <div className="standard-form-group">
                                <label htmlFor="edit-tracking">Tracking Number:</label>
                                <input type="text" id="edit-tracking" name="tracking" value={editingShipment.tracking} onChange={handleInputChange} required />
                            </div>
                            <div className="standard-form-group">
                                <label htmlFor="edit-status">Status:</label>
                                <select id="edit-status" name="status" value={editingShipment.status} onChange={handleInputChange}>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="In Transit">In Transit</option>
                                    <option value="Arrived">Arrived</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Delayed">Delayed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="standard-modal-actions">
                                <button type="submit" className="confirm-button">Update Shipment</button>
                                <button type="button" onClick={() => setShowEditForm(false)} className="cancel-button">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Shipments List */}
            <div className="shipment-list">
                {shipments.map(shipment => (
                    <div key={shipment.id} className="shipment-card">
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
                                <span className="value tracking">{shipment.tracking}</span>
                            </div>
                        </div>

                        <div className="shipment-actions">
                            <button className="action-btn primary" onClick={() => handleViewDetailsClick(shipment)}>View Details</button>
                            <button className="action-btn secondary" onClick={() => handleEditClick(shipment)}>Edit</button>
                            <button className="action-btn delete-shipment-btn" onClick={() => handleDeleteShipment(shipment.id)} title="Delete Shipment">
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {error && <div className="error-message-bar">Error: {error}</div>}
            {/* View Details Modal */}
            {showViewDetailsModal && selectedShipmentForDetails && (
                <div className="add-shipment-modal-overlay" onClick={() => setShowViewDetailsModal(false)}>
                    <div className="add-shipment-modal shipment-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Shipment Details (ID: {selectedShipmentForDetails.id})</h2>
                            <button className="close-btn" onClick={() => setShowViewDetailsModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-item"><span className="detail-label">Supplier:</span> {selectedShipmentForDetails.supplier}</div>
                            <div className="detail-item"><span className="detail-label">ETA:</span> {new Date(selectedShipmentForDetails.eta).toLocaleString()}</div>
                            <div className="detail-item"><span className="detail-label">Items:</span> {selectedShipmentForDetails.items}</div>
                            <div className="detail-item"><span className="detail-label">Value:</span> ${selectedShipmentForDetails.value.toLocaleString()}</div>
                            <div className="detail-item"><span className="detail-label">Tracking #:</span> {selectedShipmentForDetails.tracking}</div>
                            <div className="detail-item">
                                <span className="detail-label">Status:</span> 
                                <span className={`status-badge-detail ${selectedShipmentForDetails.status.toLowerCase().replace(' ', '-')}`}>
                                    {getStatusIcon(selectedShipmentForDetails.status)} {selectedShipmentForDetails.status}
                                </span>
                            </div>
                            {/* Add more details as needed */}
                        </div>
                        <div className="form-actions">
                            <button type="button" className="action-btn secondary" onClick={() => setShowViewDetailsModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomingShipments;