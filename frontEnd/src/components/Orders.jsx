import React, { useState, useEffect } from 'react';
import './Orders.css'; // Original CSS import

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
    date: new Date().toISOString().split('T')[0], // 'date' for form
    priority: 'Low'
  });
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = 'http://localhost:3000/api/orders';

  const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const priorities = ['High', 'Medium', 'Low'];

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setOrders(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    return (filterStatus === '' || order.status === filterStatus) &&
           (filterPriority === '' || order.priority === filterPriority);
  });

  const totalValue = filteredOrders.reduce((acc, order) => acc + parseFloat(order.value || 0), 0);
  const pendingOrdersCount = filteredOrders.filter(o => o.status === 'Pending').length;
  const processingOrdersCount = filteredOrders.filter(o => o.status === 'Processing').length;

  const handleNewOrderChange = (e) => {
    const { name, value, type } = e.target;
    setNewOrder(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = { ...newOrder, order_date: newOrder.date }; // Map form 'date' to 'order_date'
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const createdOrder = await response.json();
      setOrders(prevOrders => [...prevOrders, createdOrder]);
      setNewOrder({ customer: '', status: 'Pending', items: 0, value: 0, date: new Date().toISOString().split('T')[0], priority: 'Low' });
      setIsModalOpen(false);
      alert('Order created successfully!');
    } catch (err) {
      console.error('Failed to create order:', err);
      setError(`Failed to create order: ${err.message}`);
    }
  };

  const handleEditOrder = (orderId) => {
    const orderToEdit = orders.find(order => order.id === orderId);
    if (orderToEdit) {
      setIsEditMode(true);
      setEditingOrder(orderToEdit);
      const formDate = orderToEdit.order_date ? new Date(orderToEdit.order_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      setNewOrder({
        customer: orderToEdit.customer,
        status: orderToEdit.status,
        items: orderToEdit.items,
        value: orderToEdit.value,
        date: formDate, // Use 'date' for form field
        priority: orderToEdit.priority
      });
      setError(null);
      setIsModalOpen(true);
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    setError(null);
    if (!editingOrder) return;
    const payload = { ...newOrder, order_date: newOrder.date }; // Map form 'date' to 'order_date'
    try {
      const response = await fetch(`${API_BASE_URL}/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const updatedOrder = await response.json();
      setOrders(prevOrders => prevOrders.map(order => order.id === updatedOrder.id ? updatedOrder : order));
      setIsEditMode(false);
      setEditingOrder(null);
      setIsModalOpen(false);
      alert('Order updated successfully!');
    } catch (err) {
      console.error('Failed to update order:', err);
      setError(`Failed to update order: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete order ${orderId}? This action cannot be undone.`)) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${orderId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      alert('Order deleted successfully!');
    } catch (err) {
      console.error('Failed to delete order:', err);
      setError(`Failed to delete order ${orderId}: ${err.message}`);
      alert(`Error deleting order: ${err.message}`);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingOrder(null);
    setError(null);
    setNewOrder({ customer: '', status: 'Pending', items: 0, value: 0, date: new Date().toISOString().split('T')[0], priority: 'Low' });
  };

  return (
    <div className="orders">
      <div className="page-header">
        <h1>Orders Management</h1>
        <button className="add-btn" onClick={() => {
          setIsEditMode(false);
          setNewOrder({ customer: '', status: 'Pending', items: 0, value: 0, date: new Date().toISOString().split('T')[0], priority: 'Low' });
          setError(null);
          setIsModalOpen(true);
        }}>+ New Order</button>
      </div>

      {loading && <div className="loading-message">Loading orders...</div>}
      {error && !isModalOpen && <div className="error-message page-error">{error}</div>}

      <div className="orders-overview">
        <div className="overview-card">
          <h3>Total Orders</h3>
          <div className="overview-value">{filteredOrders.length}</div>
        </div>
        <div className="overview-card">
          <h3>Pending Orders</h3>
          <div className="overview-value">{pendingOrdersCount}</div>
        </div>
        <div className="overview-card">
          <h3>Processing</h3>
          <div className="overview-value">{processingOrdersCount}</div>
        </div>
        <div className="overview-card">
          <h3>Total Value</h3>
          <div className="overview-value">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {statuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {priorities.map(priority => <option key={priority} value={priority}>{priority}</option>)}
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
              <div className={`status ${order.status ? order.status.toLowerCase() : ''}`}>{order.status}</div>
              <div className={`priority ${order.priority ? order.priority.toLowerCase() : ''}`}>{order.priority}</div>
              <div className="items">{order.items}</div>
              <div className="value">${parseFloat(order.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="date">{order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}</div>
              <div className="actions">
                <button className="action-btn edit" onClick={() => handleEditOrder(order.id)}>Edit</button>
                <button className="action-btn delete" onClick={() => handleDeleteOrder(order.id)}>Delete</button>
              </div>
            </div>
          ))
        ) : (
          !loading && !error && null
        )}
      </div>

      {isModalOpen && (
        <div className="orders-modal-overlay-new"> {/* Original modal class */}
          <div className="orders-modal-content-new"> {/* Original modal class */}
            <div className="orders-modal-header-new">
                <h2 className="orders-modal-title-new">{isEditMode ? 'Edit Order' : 'Create New Order'}</h2>
                <button onClick={closeModal} className="orders-modal-close-btn-new">&times;</button>
            </div>
            {error && <div className="orders-modal-error-new">{error}</div>}
            <form onSubmit={isEditMode ? handleUpdateOrder : handleCreateOrder} className="orders-modal-form-new">
              <div className="orders-form-group-new">
                <label htmlFor="customer" className="orders-form-label-new">Customer:</label>
                <input type="text" id="customer" name="customer" value={newOrder.customer} onChange={handleNewOrderChange} required className="orders-form-input-new" />
              </div>
              <div className="orders-form-group-new">
                <label htmlFor="status" className="orders-form-label-new">Status:</label>
                <select id="status" name="status" value={newOrder.status} onChange={handleNewOrderChange} className="orders-form-input-new">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="orders-form-group-new">
                <label htmlFor="items" className="orders-form-label-new">Items:</label>
                <input type="number" id="items" name="items" value={newOrder.items} onChange={handleNewOrderChange} min="0" required className="orders-form-input-new" />
              </div>
              <div className="orders-form-group-new">
                <label htmlFor="value" className="orders-form-label-new">Value:</label>
                <input type="number" id="value" name="value" value={newOrder.value} onChange={handleNewOrderChange} step="0.01" min="0" required className="orders-form-input-new" />
              </div>
              <div className="orders-form-group-new">
                <label htmlFor="orderDate" className="orders-form-label-new">Order Date:</label>
                <input type="date" id="orderDate" name="date" value={newOrder.date} onChange={handleNewOrderChange} required className="orders-form-input-new" />
              </div>
              <div className="orders-form-group-new">
                <label htmlFor="priority" className="orders-form-label-new">Priority:</label>
                <select id="priority" name="priority" value={newOrder.priority} onChange={handleNewOrderChange} className="orders-form-input-new">
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="orders-modal-actions-new">
                <button type="submit" className="orders-btn-primary-new">{isEditMode ? 'Update Order' : 'Create Order'}</button>
                <button type="button" className="orders-btn-secondary-new" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;