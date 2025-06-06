import React, { useState, useEffect } from 'react';
import './OutgoingShipments.css';

const OutgoingShipments = () => {
  // State to hold the fetched outgoing shipments
  const [shipments, setShipments] = useState([]); // Start as empty array for fetching

  // State to control the visibility of the add shipment form
  const [showAddForm, setShowAddForm] = useState(false);

  // State to hold the data for a new outgoing shipment
  const [newShipmentData, setNewShipmentData] = useState({
    customer: '',
    departure: '', // ISO 8601 format (e.g., "YYYY-MM-DDTHH:mm") for datetime-local input
    items: '',
    value: '',
    destination: '',
    status: 'Scheduled', // Default status for new outgoing shipments
  });

  // State for editing a shipment
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null); // Holds the shipment data being edited

  // State for viewing shipment details
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [selectedShipmentForDetails, setSelectedShipmentForDetails] = useState(null);

  // State for error messages
  const [error, setError] = useState(null); // For displaying API errors

  // Fetches outgoing shipments from the backend when the component mounts
  useEffect(() => {
    fetchOutgoingShipments();
  }, []); // Empty dependency array means it runs only once on mount

  const fetchOutgoingShipments = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/outgoing-shipments');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setShipments(data);
    } catch (error) {
      console.error("Failed to fetch outgoing shipments:", error);
      // alert("Failed to load outgoing shipments from the server."); // Uncomment for user feedback
    }
  };

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

  // Handler for input changes in the new outgoing shipment form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewShipmentData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handler for input changes in the EDIT outgoing shipment form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingShipment(prevData => ({
        ...prevData,
        [name]: value
    }));
  };

  // Handler for submitting the new outgoing shipment form
  const handleAddShipment = async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Basic validation
    if (!newShipmentData.customer || !newShipmentData.departure || newShipmentData.items === '' || newShipmentData.value === '' || !newShipmentData.destination) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/outgoing-shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: newShipmentData.customer,
          departure: newShipmentData.departure, // Send as string; MySQL DATETIME handles this
          items: Number(newShipmentData.items), // Ensure numbers are sent as numbers
          value: Number(newShipmentData.value),
          destination: newShipmentData.destination,
          status: newShipmentData.status
        })
      });

      if (response.ok) {
        // If successful, re-fetch all outgoing shipments to update the list
        fetchOutgoingShipments();
        setShowAddForm(false); // Hide the form
        // Reset form fields
        setNewShipmentData({
          customer: '',
          departure: '',
          items: '',
          value: '',
          destination: '',
          status: 'Scheduled',
        });
        alert('New outgoing shipment added successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to add outgoing shipment: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding outgoing shipment:', error);
      alert(`Error connecting to the backend: ${error.message}`);
    }
  };

  // Function to open the edit form with pre-filled data
  const handleEditClick = (shipment) => {
    setEditingShipment({
        ...shipment,
        // Format departure for datetime-local input if it's not already a compatible string
        // Assuming shipment.departure is a valid date string or Date object
        departure: new Date(shipment.departure).toISOString().slice(0, 16)
    });
    setShowEditForm(true);
    setShowAddForm(false); // Ensure add form is closed
  };

  // Handler for submitting the edited shipment form
  const handleUpdateShipment = async (e) => {
    e.preventDefault();

    if (!editingShipment || !editingShipment.customer || !editingShipment.departure || editingShipment.items === '' || editingShipment.value === '' || !editingShipment.destination) {
        alert("Please fill in all required fields for the shipment.");
        return;
    }

    try {
        // ASSUMPTION: Your backend has a PUT endpoint at /api/outgoing-shipments/:id
        const response = await fetch(`http://localhost:3000/api/outgoing-shipments/${editingShipment.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer: editingShipment.customer,
                departure: editingShipment.departure,
                items: Number(editingShipment.items),
                value: Number(editingShipment.value),
                destination: editingShipment.destination,
                status: editingShipment.status
            })
        });

        if (response.ok) {
            fetchOutgoingShipments(); // Re-fetch to show updated data
            setShowEditForm(false); // Close the edit form
            setEditingShipment(null); // Clear editing state
            alert('Outgoing shipment updated successfully!');
        } else {
            const errorData = await response.json();
            alert(`Failed to update outgoing shipment: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        console.error('Error updating outgoing shipment:', error);
        alert(`Error connecting to the backend: ${error.message}`);
    }
  };

  const handleDeleteOutgoingShipment = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this outgoing shipment? This action cannot be undone.");
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/outgoing-shipments/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const contentType = response.headers.get("content-type");
            let successMessage = 'Outgoing shipment deleted successfully!';
            if (contentType && contentType.indexOf("application/json") !== -1) {
                try {
                    const result = await response.json();
                    successMessage = result.message || successMessage;
                } catch (parseError) {
                    console.error('Failed to parse successful JSON response:', parseError);
                }
            }
            alert(successMessage);
            fetchOutgoingShipments(); // Re-fetch to update the list
            setError(null); // Clear any previous errors
        } else {
            let alertMessage;
            const responseText = await response.text();
            try {
                const errorData = JSON.parse(responseText);
                alertMessage = `Failed to delete outgoing shipment: ${errorData.message || response.statusText}`;
            } catch (parseError) {
                console.error('Error response was not valid JSON. Status:', response.status, 'Body snippet:', responseText.substring(0, 200));
                alertMessage = `Failed to delete outgoing shipment: ${response.statusText} (Server returned a non-JSON error).`;
            }
            alert(alertMessage);
            setError(alertMessage);
        }
    } catch (error) {
        console.error('Network or other error deleting outgoing shipment:', error);
        let displayMessage = `An error occurred: ${error.message}`;
        if (error instanceof SyntaxError && error.message.toLowerCase().includes('json')) {
            displayMessage = 'Error: The server returned an unexpected response (likely HTML instead of JSON). Please check backend server logs.';
        } else if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
            displayMessage = 'Error: Could not connect to the backend server. Please ensure it is running.';
        }
        alert(displayMessage);
        setError(displayMessage);
    }
  };

  // Handler for viewing shipment details
  const handleViewDetailsClick = (shipment) => {
    setSelectedShipmentForDetails(shipment);
    setShowViewDetailsModal(true);
    setShowAddForm(false); // Ensure other modals are closed
    setShowEditForm(false);
  };

  // Handler for printing a label
  const handlePrintLabel = (shipment) => {
    const labelWindow = window.open('', '_blank', 'width=400,height=300');
    labelWindow.document.write(`
        <html>
            <head>
                <title>Shipment Label - ${shipment.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h2 { border-bottom: 1px solid #000; padding-bottom: 5px; }
                    p { margin: 5px 0; }
                    .label-item { font-weight: bold; }
                </style>
            </head>
            <body>
                <h2>Shipment Label</h2>
                <p><span class="label-item">ID:</span> ${shipment.id}</p>
                <p><span class="label-item">Customer:</span> ${shipment.customer}</p>
                <p><span class="label-item">Destination:</span> ${shipment.destination}</p>
                <p><span class="label-item">Departure:</span> ${new Date(shipment.departure).toLocaleString()}</p>
                <p><span class="label-item">Items:</span> ${shipment.items}</p>
                <p><span class="label-item">Value:</span> $${shipment.value.toLocaleString()}</p>
                <script>
                    window.onload = function() {
                        window.print();
                        // window.onafterprint = function() { window.close(); }; // Optional: close after printing
                    }
                </script>
            </body>
        </html>
    `);
    labelWindow.document.close();
  };

  // Calculations for overview cards (now based on fetched data)
  const totalShipments = shipments.length;
  // For 'Shipped Today', you need to parse departure and compare dates
  const shippedToday = shipments.filter(s => {
      const departureDate = new Date(s.departure);
      const today = new Date();
      // Compare year, month, and day
      return s.status === 'Shipped' &&
             departureDate.getFullYear() === today.getFullYear() &&
             departureDate.getMonth() === today.getMonth() &&
             departureDate.getDate() === today.getDate();
  }).length;
  const readyToShip = shipments.filter(s => s.status === 'Ready').length;
  const totalValue = shipments.reduce((acc, shipment) => acc + shipment.value, 0);

  return (
    <div className="outgoing-shipments">
      {error && <div className="error-message-bar">Error: {error}</div>}
      <div className="page-header">
        <h1>Outgoing Shipments</h1>
        {/* Button to show the add shipment form */}
        <button className="add-btn" onClick={() => setShowAddForm(true)}>+ New Shipment</button>
      </div>

      <div className="shipments-overview">
        <div className="overview-card">
          <h3>Total Shipments</h3>
          <div className="overview-value">{totalShipments}</div>
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

      {/* Add Shipment Form Modal/Section */}
      {showAddForm && (
        <div className="add-shipment-modal-overlay">
          <div className="add-shipment-modal">
            <h2>Add New Outgoing Shipment</h2>
            <form onSubmit={handleAddShipment}>
              <div className="form-group">
                <label htmlFor="customer">Customer:</label>
                <input
                  type="text"
                  id="customer"
                  name="customer"
                  value={newShipmentData.customer}
                  onChange={handleInputChange}
                  placeholder="e.g., Retail Chain A"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="departure">Departure Time:</label>
                <input
                  type="datetime-local"
                  id="departure"
                  name="departure"
                  value={newShipmentData.departure}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="items">Number of Items:</label>
                <input
                  type="number"
                  id="items"
                  name="items"
                  value={newShipmentData.items}
                  onChange={handleInputChange}
                  placeholder="e.g., 156"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="value">Total Value ($):</label>
                <input
                  type="number"
                  id="value"
                  name="value"
                  value={newShipmentData.value}
                  onChange={handleInputChange}
                  placeholder="e.g., 28000"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="destination">Destination:</label>
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  value={newShipmentData.destination}
                  onChange={handleInputChange}
                  placeholder="e.g., New York, NY"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status:</label>
                <select
                  id="status"
                  name="status"
                  value={newShipmentData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Ready">Ready</option>
                  <option value="Loading">Loading</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="action-btn primary">Add Shipment</button>
                <button type="button" className="action-btn secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shipment Form Modal/Section */}
      {showEditForm && editingShipment && (
        <div className="add-shipment-modal-overlay">
          <div className="add-shipment-modal">
            <h2>Edit Outgoing Shipment (ID: {editingShipment.id})</h2>
            <form onSubmit={handleUpdateShipment}>
              <div className="form-group">
                <label htmlFor="edit-customer">Customer:</label>
                <input
                  type="text"
                  id="edit-customer"
                  name="customer"
                  value={editingShipment.customer}
                  onChange={handleEditInputChange} // Use dedicated handler for edit form
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-departure">Departure Time:</label>
                <input
                  type="datetime-local"
                  id="edit-departure"
                  name="departure"
                  value={editingShipment.departure} // Already formatted in handleEditClick
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-items">Number of Items:</label>
                <input
                  type="number"
                  id="edit-items"
                  name="items"
                  value={editingShipment.items}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-value">Total Value ($):</label>
                <input
                  type="number"
                  id="edit-value"
                  name="value"
                  value={editingShipment.value}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-destination">Destination:</label>
                <input
                  type="text"
                  id="edit-destination"
                  name="destination"
                  value={editingShipment.destination}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-status">Status:</label>
                <select
                  id="edit-status"
                  name="status"
                  value={editingShipment.status}
                  onChange={handleEditInputChange}
                  required
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Ready">Ready</option>
                  <option value="Loading">Loading</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="action-btn primary">Update Shipment</button>
                <button type="button" className="action-btn secondary" onClick={() => { setShowEditForm(false); setEditingShipment(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewDetailsModal && selectedShipmentForDetails && (
        <div className="add-shipment-modal-overlay" onClick={() => setShowViewDetailsModal(false)}>
          <div className="add-shipment-modal shipment-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Outgoing Shipment Details (ID: {selectedShipmentForDetails.id})</h2>
              <button className="close-btn" onClick={() => setShowViewDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-item"><span className="detail-label">Customer:</span> {selectedShipmentForDetails.customer}</div>
              <div className="detail-item"><span className="detail-label">Destination:</span> {selectedShipmentForDetails.destination}</div>
              <div className="detail-item"><span className="detail-label">Departure:</span> {new Date(selectedShipmentForDetails.departure).toLocaleString()}</div>
              <div className="detail-item"><span className="detail-label">Items:</span> {selectedShipmentForDetails.items}</div>
              <div className="detail-item"><span className="detail-label">Value:</span> ${selectedShipmentForDetails.value.toLocaleString()}</div>
              <div className="detail-item">
                <span className="detail-label">Status:</span> 
                <span className={`status-badge-detail ${selectedShipmentForDetails.status.toLowerCase().replace(' ', '-')}`}>
                  {getStatusIcon(selectedShipmentForDetails.status)} {selectedShipmentForDetails.status}
                </span>
              </div>
              {/* Add more details as needed, e.g., tracking if you add it to outgoing shipments */}
            </div>
            <div className="form-actions">
              <button type="button" className="action-btn secondary" onClick={() => setShowViewDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

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
                {/* Ensure date formatting is consistent. MySQL DATETIME might return 'YYYY-MM-DD HH:MM:SS' */}
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
              <button className="action-btn primary" onClick={() => handleViewDetailsClick(shipment)}>View Details</button>
              <button className="action-btn" onClick={() => handleEditClick(shipment)}>Edit</button>
              <button className="action-btn secondary" onClick={() => handlePrintLabel(shipment)}>Print Label</button>
              <button className="action-btn delete-outgoing-shipment-btn" onClick={() => handleDeleteOutgoingShipment(shipment.id)} title="Delete Outgoing Shipment">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutgoingShipments;