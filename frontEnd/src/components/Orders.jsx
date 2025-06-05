import React, { useState, useEffect } from 'react';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer: '',
    status: 'Pending',
    items: 0,
    value: 0,
    date: new Date().toISOString().split('T')[0],
    priority: 'Low'
  });
  const [error, setError] = useState(null); // State to store any errors
  const [loading, setLoading] = useState(true); // State for loading indicator

  const API_BASE_URL = 'http://localhost:3000/api/orders'; // Your backend API base URL

  const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const priorities = ['High', 'Medium', 'Low'];

  // --- Fetch Orders from Backend on Component Mount ---
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setOrders(data);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false); // Set loading to false once fetching is complete
      }
    };

    fetchOrders();
  }, []); // Empty dependency array ensures this runs once on mount

  // Filter orders based on selected status and priority
  const filteredOrders = orders.filter(order => {
    return (filterStatus === '' || order.status === filterStatus) &&
           (filterPriority === '' || order.priority === filterPriority);
  });

  // Calculate overview statistics based on filtered orders
  const totalValue = filteredOrders.reduce((acc, order) => acc + parseFloat(order.value), 0);
  const pendingOrders = filteredOrders.filter(o => o.status === 'Pending').length;
  const processingOrders = filteredOrders.filter(o => o.status === 'Processing').length;

  // Handle changes in the new order form
  const handleNewOrderChange = (e) => {
    const { name, value, type } = e.target;
    setNewOrder(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  // --- Handle Creation of a New Order via Backend API ---
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder), // Send newOrder state to the backend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const createdOrder = await response.json(); // Get the created order (with its ID from the backend)
      setOrders(prevOrders => [...prevOrders, createdOrder]); // Add the new order to state
      setNewOrder({ // Reset form
        customer: '',
        status: 'Pending',
        items: 0,
        value: 0,
        date: new Date().toISOString().split('T')[0],
        priority: 'Low'
      });
      setIsModalOpen(false); // Close modal
      alert('Order created successfully!');
    } catch (err) {
      console.error('Failed to create order:', err);
      setError(`Failed to create order: ${err.message}`);
    }
  };

  // Placeholder for future update and delete functions
  const handleEditOrder = (orderId) => {
    alert(`Edit functionality for Order ID: ${orderId} is not yet implemented.`);
    // In a real app, you'd fetch the order data, populate an edit modal,
    // and then make a PUT request to the backend.
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete order ${orderId}?`)) {
      return;
    }
    setError(null); // Clear previous errors
    try {
      const response = await fetch(`${API_BASE_URL}/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      alert(`Order ${orderId} deleted successfully!`);
    } catch (err) {
      console.error('Failed to delete order:', err);
      setError(`Failed to delete order: ${err.message}`);
    }
  };


  return (
    <div className="orders">
      <div className="page-header">
        <h1>Orders Management</h1>
        <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ New Order</button>
      </div>

      {loading && <div className="loading-message" style={{ textAlign: 'center', padding: '1rem' }}>Loading orders...</div>}
      {error && <div className="error-message" style={{ textAlign: 'center', padding: '1rem', color: 'red' }}>{error}</div>}

      <div className="orders-overview">
        <div className="overview-card">
          <h3>Total Orders</h3>
          <div className="overview-value">{filteredOrders.length}</div>
        </div>
        <div className="overview-card">
          <h3>Pending Orders</h3>
          <div className="overview-value">{pendingOrders}</div>
        </div>
        <div className="overview-card">
          <h3>Processing</h3>
          <div className="overview-value">{processingOrders}</div>
        </div>
        <div className="overview-card">
          <h3>Total Value</h3>
          <div className="overview-value">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            {priorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="orders-table">
        <div className="table-header">
          <div>Order ID</div>
          <div>Customer</div>
          <div>Status</div>
          <div>Priority</div>
          <div>Items</div>
          <div>Value</div>
          <div>Date</div>
          <div>Actions</div>
        </div>
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <div key={order.id} className="table-row">
              <div className="order-id">{order.id}</div>
              <div className="customer">{order.customer}</div>
              <div className={`status ${order.status ? order.status.toLowerCase() : ''}`}>
                {order.status}
              </div>
              <div className={`priority ${order.priority ? order.priority.toLowerCase() : ''}`}>
                {order.priority}
              </div>
              <div className="items">{order.items}</div>
              <div className="value">${parseFloat(order.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="date">{order.date}</div>
              <div className="actions">
                <button className="action-btn view">View</button>
                <button className="action-btn edit" onClick={() => handleEditOrder(order.id)}>Edit</button>
                <button className="action-btn delete" onClick={() => handleDeleteOrder(order.id)}>Delete</button>
              </div>
            </div>
          ))
        ) : (
          !loading && !error && (
            <div className="no-orders-message" style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
              No orders found. Click "+ New Order" to add one.
            </div>
          )
        )}
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New Order</h2>
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleCreateOrder}>
              <div className="form-group">
                <label>Customer:</label>
                <input
                  type="text"
                  name="customer"
                  value={newOrder.customer}
                  onChange={handleNewOrderChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Status:</label>
                <select name="status" value={newOrder.status} onChange={handleNewOrderChange}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Items:</label>
                <input
                  type="number"
                  name="items"
                  value={newOrder.items}
                  onChange={handleNewOrderChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Value:</label>
                <input
                  type="number"
                  name="value"
                  value={newOrder.value}
                  onChange={handleNewOrderChange}
                  step="0.01" // Allow decimal values
                  required
                />
              </div>
              <div className="form-group">
                <label>Order Date:</label>
                <input
                  type="date"
                  name="date"
                  value={newOrder.date}
                  onChange={handleNewOrderChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Priority:</label>
                <select name="priority" value={newOrder.priority} onChange={handleNewOrderChange}>
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Create Order</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;