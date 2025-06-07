import React, { useState, useEffect } from 'react';
import './OutgoingShipments.css';
import './StandardModal.css';

const OutgoingShipments = () => {
  const [shipments, setShipments] = useState([]);

  const [showAddForm, setShowAddForm] = useState(false);

  const [newShipmentData, setNewShipmentData] = useState({
    customer: '',
    departure: '',
    items: '',
    value: '',
    destination: '',
    status: 'Scheduled',
  });

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);

  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [selectedShipmentForDetails, setSelectedShipmentForDetails] = useState(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOutgoingShipments();
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewShipmentData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingShipment(prevData => ({
        ...prevData,
        [name]: value
    }));
  };

  const handleAddShipment = async (e) => {
    e.preventDefault();

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
          departure: newShipmentData.departure,
          items: Number(newShipmentData.items),
          value: Number(newShipmentData.value),
          destination: newShipmentData.destination,
          status: newShipmentData.status
        })
      });

      if (response.ok) {
        fetchOutgoingShipments();
        setShowAddForm(false);
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

  const handleEditClick = (shipment) => {
    setEditingShipment({
        ...shipment,
        departure: new Date(shipment.departure).toISOString().slice(0, 16)
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleUpdateShipment = async (e) => {
    e.preventDefault();

    if (!editingShipment || !editingShipment.customer || !editingShipment.departure || editingShipment.items === '' || editingShipment.value === '' || !editingShipment.destination) {
        alert("Please fill in all required fields for the shipment.");
        return;
    }

    try {
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
            fetchOutgoingShipments();
            setShowEditForm(false);
            setEditingShipment(null);
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
            fetchOutgoingShipments();
            setError(null);
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

  const handleViewDetailsClick = (shipment) => {
    setSelectedShipmentForDetails(shipment);
    setShowViewDetailsModal(true);
    setShowAddForm(false);
    setShowEditForm(false);
  };

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
                  }
              </script>
          </body>
        </html>
    `);
    labelWindow.document.close();
  };

  const totalShipments = shipments.length;
  const shippedToday = shipments.filter(s => {
      const departureDate = new Date(s.departure);
      const today = new Date();
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

      {showAddForm && (
        <div className="standard-modal-overlay">
          <div className="standard-modal-content">
            <div className="standard-modal-header">
              <h2>Add New Outgoing Shipment</h2>
              <button onClick={() => setShowAddForm(false)} className="standard-modal-close-button">&times;</button>
            </div>
            <form onSubmit={handleAddShipment}>
              <div className="standard-form-group">
                <label htmlFor="customer">Customer:</label>
                <input type="text" id="customer" name="customer" value={newShipmentData.customer} onChange={handleInputChange} placeholder="e.g., Retail Chain A" required />
              </div>
              <div className="standard-form-group">
                <label htmlFor="departure">Departure Time:</label>
                <input type="datetime-local" id="departure" name="departure" value={newShipmentData.departure} onChange={handleInputChange} required />
              </div>
              <div className="standard-form-group">
                <label htmlFor="items">Number of Items:</label>
                <input type="number" id="items" name="items" value={newShipmentData.items} onChange={handleInputChange} placeholder="e.g., 150" required />
              </div>
              <div className="standard-form-group">
                <label htmlFor="value">Total Value ($):</label>
                <input type="number" id="value" name="value" value={newShipmentData.value} onChange={handleInputChange} placeholder="e.g., 28000" required />
              </div>
              <div className="standard-form-group">
                <label htmlFor="destination">Destination:</label>
                <input type="text" id="destination" name="destination" value={newShipmentData.destination} onChange={handleInputChange} placeholder="e.g., New York, NY" required />
              </div>
              <div className="standard-form-group">
                <label htmlFor="status">Status:</label>
                <select id="status" name="status" value={newShipmentData.status} onChange={handleInputChange} required>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready to Ship</option>
                  <option value="Loading">Loading</option>
                  <option value="Shipped">Shipped</option>
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

      {showEditForm && editingShipment && (
        <div className="standard-modal-overlay">
          <div className="standard-modal-content">
            <div className="standard-modal-header">
              <h2>Edit Outgoing Shipment (ID: {editingShipment.id})</h2>
              <button onClick={() => { setShowEditForm(false); setEditingShipment(null); }} className="standard-modal-close-button">&times;</button>
            </div>
            <form onSubmit={handleUpdateShipment}>
              <div className="standard-form-group">
                <label htmlFor="edit-customer">Customer:</label>
                <input
                  type="text"
                  id="edit-customer"
                  name="customer"
                  value={editingShipment.customer}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="standard-form-group">
                <label htmlFor="edit-departure">Departure Time:</label>
                <input
                  type="datetime-local"
                  id="edit-departure"
                  name="departure"
                  value={editingShipment.departure}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="standard-form-group">
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
              <div className="standard-form-group">
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
              <div className="standard-form-group">
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
              <div className="standard-form-group">
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

              <div className="standard-modal-actions">
                <button type="submit" className="confirm-button">Update Shipment</button>
                <button type="button" className="cancel-button" onClick={() => { setShowEditForm(false); setEditingShipment(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

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