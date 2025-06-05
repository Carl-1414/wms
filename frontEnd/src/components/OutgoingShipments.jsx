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