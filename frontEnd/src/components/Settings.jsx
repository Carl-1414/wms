import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'warehouse', name: 'Warehouse', icon: '🏢' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security', icon: '🔒' },
  ];

  return (
    <div className="settings">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>General Settings</h2>
              <div className="setting-group">
                <label>Warehouse Name</label>
                <input type="text" defaultValue="Main Distribution Center" />
              </div>
              <div className="setting-group">
                <label>Time Zone</label>
                <select defaultValue="EST">
                  <option value="EST">Eastern Time</option>
                  <option value="CST">Central Time</option>
                  <option value="PST">Pacific Time</option>
                </select>
              </div>
              <div className="setting-group">
                <label>Default Currency</label>
                <select defaultValue="USD">
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
              <button className="save-btn">Save Changes</button>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="settings-section">
              <h2>User Management</h2>
              <div className="users-table">
                <div className="table-header">
                  <div>Name</div>
                  <div>Email</div>
                  <div>Role</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                <div className="table-row">
                  <div>John Smith</div>
                  <div>john.smith@company.com</div>
                  <div>Administrator</div>
                  <div className="status active">Active</div>
                  <div className="actions">
                    <button className="action-btn edit">Edit</button>
                    <button className="action-btn delete">Delete</button>
                  </div>
                </div>
                <div className="table-row">
                  <div>Sarah Johnson</div>
                  <div>sarah.johnson@company.com</div>
                  <div>Manager</div>
                  <div className="status active">Active</div>
                  <div className="actions">
                    <button className="action-btn edit">Edit</button>
                    <button className="action-btn delete">Delete</button>
                  </div>
                </div>
              </div>
              <button className="add-user-btn">+ Add New User</button>
            </div>
          )}

          {activeTab === 'warehouse' && (
            <div className="settings-section">
              <h2>Warehouse Configuration</h2>
              <div className="setting-group">
                <label>Default Storage Temperature</label>
                <input type="number" defaultValue="20" />
                <span className="unit">°C</span>
              </div>
              <div className="setting-group">
                <label>Low Stock Threshold</label>
                <input type="number" defaultValue="10" />
                <span className="unit">items</span>
              </div>
              <div className="setting-group">
                <label>Auto-reorder Point</label>
                <input type="number" defaultValue="5" />
                <span className="unit">items</span>
              </div>
              <div className="setting-group">
                <label>Audit Frequency</label>
                <select defaultValue="monthly">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <button className="save-btn">Save Configuration</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <div className="notification-group">
                <div className="notification-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Email notifications for low stock
                  </label>
                </div>
                <div className="notification-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    SMS alerts for critical issues
                  </label>
                </div>
                <div className="notification-item">
                  <label>
                    <input type="checkbox" />
                    Daily inventory reports
                  </label>
                </div>
                <div className="notification-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Shipment status updates
                  </label>
                </div>
              </div>
              <button className="save-btn">Save Preferences</button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              <div className="setting-group">
                <label>Session Timeout</label>
                <select defaultValue="30">
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              <div className="setting-group">
                <label>Password Requirements</label>
                <div className="checkbox-group">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Minimum 8 characters
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked />
                    Require uppercase letters
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked />
                    Require numbers
                  </label>
                  <label>
                    <input type="checkbox" />
                    Require special characters
                  </label>
                </div>
              </div>
              <button className="save-btn">Update Security</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
