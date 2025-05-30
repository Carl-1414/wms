import React, { useState } from 'react';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([
    { id: 'ORD-001', customer: 'ABC Corp', status: 'Processing', items: 15, value: 12500, date: '2024-01-15', priority: 'High' },
    { id: 'ORD-002', customer: 'XYZ Ltd', status: 'Shipped', items: 8, value: 6800, date: '2024-01-14', priority: 'Medium' },
    { id: 'ORD-003', customer: 'Tech Solutions', status: 'Pending', items: 22, value: 18900, date: '2024-01-13', priority: 'Low' },
    { id: 'ORD-004', customer: 'Global Industries', status: 'Delivered', items: 35, value: 29500, date: '2024-01-12', priority: 'High' },
    { id: 'ORD-005', customer: 'MegaCorp Inc', status: 'Cancelled', items: 0, value: 0, date: '2024-01-11', priority: 'Medium' },
  ]);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const priorities = ['High', 'Medium', 'Low'];

  const filteredOrders = orders.filter(order => {
    return (filterStatus === '' || order.status === filterStatus) &&
           (filterPriority === '' || order.priority === filterPriority);
  });

  const totalValue = orders.reduce((acc, order) => acc + order.value, 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const processingOrders = orders.filter(o => o.status === 'Processing').length;

  return (
    <div className="orders">
      <div className="page-header">
        <h1>Orders Management</h1>
        <button className="add-btn">+ New Order</button>
      </div>

      <div className="orders-overview">
        <div className="overview-card">
          <h3>Total Orders</h3>
          <div className="overview-value">{orders.length}</div>
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
          <div className="overview-value">${totalValue.toLocaleString()}</div>
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
        {filteredOrders.map(order => (
          <div key={order.id} className="table-row">
            <div className="order-id">{order.id}</div>
            <div className="customer">{order.customer}</div>
            <div className={`status ${order.status.toLowerCase()}`}>
              {order.status}
            </div>
            <div className={`priority ${order.priority.toLowerCase()}`}>
              {order.priority}
            </div>
            <div className="items">{order.items}</div>
            <div className="value">${order.value.toLocaleString()}</div>
            <div className="date">{order.date}</div>
            <div className="actions">
              <button className="action-btn view">View</button>
              <button className="action-btn edit">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
