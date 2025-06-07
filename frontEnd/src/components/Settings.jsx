import React, { useState, useEffect } from 'react';
import './Settings.css';
import { useSettings } from '../contexts/SettingsContext.jsx';

const timeZoneOptions = [
  { value: 'Etc/GMT+12', label: 'GMT-12:00 International Date Line West' },
  { value: 'Pacific/Honolulu', label: 'GMT-10:00 Hawaii Standard Time' },
  { value: 'America/Anchorage', label: 'GMT-09:00 Alaska Standard Time' },
  { value: 'America/Los_Angeles', label: 'GMT-08:00 Pacific Standard Time (PST)' },
  { value: 'America/Denver', label: 'GMT-07:00 Mountain Standard Time (MST)' },
  { value: 'America/Chicago', label: 'GMT-06:00 Central Standard Time (CST)' },
  { value: 'America/New_York', label: 'GMT-05:00 Eastern Standard Time (EST)' },
  { value: 'Etc/UTC', label: 'GMT+00:00 Coordinated Universal Time (UTC)' },
  { value: 'Europe/London', label: 'GMT+00:00 Greenwich Mean Time (GMT)' },
  { value: 'Europe/Berlin', label: 'GMT+01:00 Central European Time (CET)' },
  { value: 'Europe/Athens', label: 'GMT+02:00 Eastern European Time (EET)' },
  { value: 'Asia/Kolkata', label: 'GMT+05:30 Indian Standard Time (IST)' },
  { value: 'Asia/Shanghai', label: 'GMT+08:00 China Standard Time (CST)' },
  { value: 'Asia/Tokyo', label: 'GMT+09:00 Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'GMT+10:00 Australian Eastern Standard Time (AEST)' },
  { value: 'Pacific/Auckland', label: 'GMT+12:00 New Zealand Standard Time (NZST)' },
];

const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'GBP', label: 'GBP - British Pound Sterling' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CNY', label: 'CNY - Chinese Yuan Renminbi' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { settings: globalSettings, loadingSettings, errorSettings, refreshSettings } = useSettings();

  const [warehouseName, setWarehouseName] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Staff');
  const [editingUser, setEditingUser] = useState(null);

  const [defaultStorageTemp, setDefaultStorageTemp] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [autoReorderPoint, setAutoReorderPoint] = useState('');
  const [auditFrequency, setAuditFrequency] = useState('Monthly');
  const [loadingWarehouseSettings, setLoadingWarehouseSettings] = useState(false);
  const [errorWarehouseSettings, setErrorWarehouseSettings] = useState(null);

  const [notifyLowStockEmail, setNotifyLowStockEmail] = useState(false);
  const [notifyCriticalIssueEmail, setNotifyCriticalIssueEmail] = useState(false);
  const [notifyDailyReportEmail, setNotifyDailyReportEmail] = useState(false);
  const [notifyShipmentUpdateEmail, setNotifyShipmentUpdateEmail] = useState(false);
  const [loadingNotificationSettings, setLoadingNotificationSettings] = useState(false);
  const [errorNotificationSettings, setErrorNotificationSettings] = useState(null);

  const [notifyLowStockInApp, setNotifyLowStockInApp] = useState(false);
  const [notifyCriticalIssueInApp, setNotifyCriticalIssueInApp] = useState(false);
  const [notifyShipmentUpdateInApp, setNotifyShipmentUpdateInApp] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(null);

  const handleGeneralSettingsSave = async () => {
    console.log('Attempting to save general settings:', { warehouseName, timeZone, defaultCurrency });
    try {
      const response = await fetch('http://localhost:3000/api/settings/general', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warehouseName: warehouseName,
          timeZone: timeZone,
          defaultCurrency: defaultCurrency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert('General settings saved successfully!');
      refreshSettings();
    } catch (error) {
      console.error('Failed to save general settings:', error);
      alert(`Failed to save general settings: ${error.message}`);
    }
  };

  useEffect(() => {
    if (globalSettings && Object.keys(globalSettings).length > 0) {
      console.log('Settings.jsx useEffect: globalSettings CHANGED or loaded:', globalSettings);
      setWarehouseName(globalSettings.warehouse_name || '');
      setTimeZone(globalSettings.time_zone || '');
      setDefaultCurrency(globalSettings.default_currency || '');
    } else if (!loadingSettings && !errorSettings && globalSettings && Object.keys(globalSettings).length === 0) {
      console.log('Settings.jsx useEffect: globalSettings LOADED but EMPTY:', globalSettings);
      setWarehouseName('');
      setTimeZone('');
      setDefaultCurrency('');
    }
  }, [globalSettings, loadingSettings, errorSettings]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const response = await fetch('http://localhost:3000/api/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setErrorUsers(error.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchWarehouseSettings = async () => {
    setLoadingWarehouseSettings(true);
    setErrorWarehouseSettings(null);
    try {
      const response = await fetch('http://localhost:3000/api/settings/warehouse');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Data received from /api/settings/warehouse:', data);
      setDefaultStorageTemp(data.default_storage_temperature || '');
      setLowStockThreshold(data.low_stock_threshold || '');
      setAutoReorderPoint(data.auto_reorder_point || '');
      setAuditFrequency(data.audit_frequency || 'Monthly');
    } catch (error) {
      console.error('Failed to fetch warehouse settings:', error);
      setErrorWarehouseSettings(error.message);
    } finally {
      setLoadingWarehouseSettings(false);
    }
  };

  const fetchNotificationSettings = async () => {
    setLoadingNotificationSettings(true);
    setErrorNotificationSettings(null);
    try {
      const response = await fetch('http://localhost:3000/api/settings/notifications');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotifyLowStockEmail(data.notification_low_stock_email || false);
      setNotifyCriticalIssueEmail(data.notification_critical_issue_email || false);
      setNotifyDailyReportEmail(data.notification_daily_report_email || false);
      setNotifyShipmentUpdateEmail(data.notification_shipment_update_email || false);
      setNotifyLowStockInApp(data.notification_low_stock_in_app || false);
      setNotifyCriticalIssueInApp(data.notification_critical_issue_in_app || false);
      setNotifyShipmentUpdateInApp(data.notification_shipment_update_in_app || false);
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      setErrorNotificationSettings(error.message);
    } finally {
      setLoadingNotificationSettings(false);
    }
  };

  const handleSaveWarehouseConfig = async () => {
    const configData = {
      default_storage_temperature: defaultStorageTemp,
      low_stock_threshold: lowStockThreshold,
      auto_reorder_point: autoReorderPoint,
      audit_frequency: auditFrequency,
    };
    try {
      const response = await fetch('http://localhost:3000/api/settings/warehouse', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      alert('Warehouse configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save warehouse configuration:', error);
      alert(`Failed to save warehouse configuration: ${error.message}`);
    }
  };

  const handleSaveGeneralSettings = async () => {
    const updatedSettings = {
      warehouseName: warehouseName,
      timeZone: timeZone,
      defaultCurrency: defaultCurrency,
    };

    try {
      const response = await fetch('http://localhost:3000/api/settings/general', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert('General settings saved successfully!');
      refreshSettings();
    } catch (error) {
      console.error('Failed to save general settings:', error);
      alert(`Failed to save general settings: ${error.message}`);
    }
  };

  const handleSaveNotificationSettings = async () => {
    const settingsData = {
      notification_low_stock_email: notifyLowStockEmail,
      notification_critical_issue_email: notifyCriticalIssueEmail,
      notification_daily_report_email: notifyDailyReportEmail,
      notification_shipment_update_email: notifyShipmentUpdateEmail,
      notification_low_stock_in_app: notifyLowStockInApp,
      notification_critical_issue_in_app: notifyCriticalIssueInApp,
      notification_shipment_update_in_app: notifyShipmentUpdateInApp,
    };
    try {
      const response = await fetch('http://localhost:3000/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      alert('Notification settings saved successfully!');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      alert(`Failed to save notification settings: ${error.message}`);
    }
  };

  const handleEditUserClick = (user) => {
    setEditingUser(user);
    setNewUserName(user.name);
    setNewUserEmail(user.email);
    setNewUserRole(user.role);
    setNewUserPassword('');
    setShowAddUserForm(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || (!newUserPassword && !editingUser) || !newUserRole) {
      alert('Please fill in all required fields.');
      return;
    }

    const userData = {
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      ...(editingUser ? {} : (newUserPassword ? { password: newUserPassword } : {})),
      ...(editingUser && editingUser.status ? { status: editingUser.status } : {}),
    };

    let url = 'http://localhost:3000/api/users';
    let method = 'POST';

    if (editingUser) {
      url = `http://localhost:3000/api/users/${editingUser.id}`;
      method = 'PUT';
      delete userData.password;
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert(`User ${editingUser ? 'updated' : 'added'} successfully!`);
      setShowAddUserForm(false);
      setEditingUser(null);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('Staff');
      fetchUsers();
    } catch (error) {
      console.error(`Failed to ${editingUser ? 'update' : 'add'} user:`, error);
      alert(`Failed to ${editingUser ? 'update' : 'add'} user: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        alert('User deleted successfully!');
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert(`Failed to delete user: ${error.message}`);
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordLoading(true);
    setChangePasswordError(null);
    setChangePasswordSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError('New passwords do not match.');
      setChangePasswordLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setChangePasswordError('New password must be at least 8 characters long.');
      setChangePasswordLoading(false);
      return;
    }
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        setChangePasswordError('Please fill in all password fields.');
        setChangePasswordLoading(false);
        return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      setChangePasswordSuccess(data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      if (error instanceof SyntaxError) {
        setChangePasswordError('Received an invalid response from the server. Please try again.');
      } else {
        setChangePasswordError(error.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'warehouse', name: 'Warehouse', icon: '🏢' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security', icon: '🔒' },
  ];

  const auditFrequencyOptions = [
    { value: 'Daily', label: 'Daily' },
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Bi-Weekly', label: 'Bi-Weekly' },
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Quarterly', label: 'Quarterly' },
    { value: 'Annually', label: 'Annually' },
  ];

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers();
    } else if (activeTab === 'warehouse') {
      fetchWarehouseSettings();
    } else if (activeTab === 'notifications') {
      fetchNotificationSettings();
    }
  }, [activeTab]);

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h2>General Settings</h2>
      {loadingSettings && <p>Loading settings...</p>}
      {errorSettings && <p style={{ color: 'red' }}>Error loading settings: {errorSettings}</p>}
      {!loadingSettings && !errorSettings && (
        <>
          <div className="setting-group">
            <label>Warehouse Name</label>
            <input type="text" value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} />
          </div>
          <div className="setting-group">
            <label>Time Zone</label>
            <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
              <option value="" disabled>Select Time Zone</option>
              {timeZoneOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="setting-group">
            <label>Default Currency</label>
            <select value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)}>
              <option value="" disabled>Select Currency</option>
              {currencyOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <button onClick={handleGeneralSettingsSave} className="save-btn">Save Changes</button>
        </>
      )}
    </div>
  );

  const renderWarehouseSettings = () => (
    <div className="settings-section">
      <h2>Warehouse Configuration</h2>
      {loadingWarehouseSettings && <p>Loading warehouse settings...</p>}
      {errorWarehouseSettings && <p style={{ color: 'red' }}>Error: {errorWarehouseSettings}</p>}
      {!loadingWarehouseSettings && !errorWarehouseSettings && (
        <>
          <div className="setting-group">
            <label>Default Storage Temperature (°C)</label>
            <input type="number" value={defaultStorageTemp} onChange={(e) => setDefaultStorageTemp(e.target.value)} />
          </div>
          <div className="setting-group">
            <label>Low Stock Threshold (items)</label>
            <input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
          </div>
          <div className="setting-group">
            <label>Auto Reorder Point (items)</label>
            <input type="number" value={autoReorderPoint} onChange={(e) => setAutoReorderPoint(e.target.value)} />
          </div>
          <div className="setting-group">
            <label>Audit Frequency</label>
            <select value={auditFrequency} onChange={(e) => setAuditFrequency(e.target.value)}>
              {auditFrequencyOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button onClick={handleSaveWarehouseConfig} className="save-btn">Save Configuration</button>
        </>
      )}
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h2>Notification Preferences</h2>
      {loadingNotificationSettings && <p>Loading notification settings...</p>}
      {errorNotificationSettings && <p style={{ color: 'red' }}>Error: {errorNotificationSettings}</p>}
      {!loadingNotificationSettings && !errorNotificationSettings && (
        <>
          <h3>Email Notifications</h3>
          <div className="notification-group">
            <div className="notification-item">
              <label>
                <input
                  type="checkbox"
                  checked={notifyLowStockEmail}
                  onChange={(e) => setNotifyLowStockEmail(e.target.checked)}
                />
                Email notifications for low stock
              </label>
            </div>
            <div className="notification-item">
              <label>
                <input
                  type="checkbox"
                  checked={notifyCriticalIssueEmail}
                  onChange={(e) => setNotifyCriticalIssueEmail(e.target.checked)}
                />
                Email notifications for critical system issues
              </label>
            </div>
            <div className="notification-item">
              <label>
                <input
                  type="checkbox"
                  checked={notifyDailyReportEmail}
                  onChange={(e) => setNotifyDailyReportEmail(e.target.checked)}
                />
                Receive daily inventory reports via email
              </label>
            </div>
            <div className="notification-item">
              <label>
                <input
                  type="checkbox"
                  checked={notifyShipmentUpdateEmail}
                  onChange={(e) => setNotifyShipmentUpdateEmail(e.target.checked)}
                />
                Email notifications for shipment status updates
              </label>
            </div>
          </div>

          <h3>In-App Notifications</h3>
          <div className="notification-group">
            <div className="notification-item">
              <label>
                <input
                  type="checkbox"
                  checked={notifyLowStockInApp}
                  onChange={(e) => setNotifyLowStockInApp(e.target.checked)}
                />
                Low stock alerts
              </label>
            </div>
            <div className="notification-item">
              <label>
                <input
                  type="checkbox"
                  checked={notifyCriticalIssueInApp}
                  onChange={(e) => setNotifyCriticalIssueInApp(e.target.checked)}
                />
                Critical system issue alerts
              </label>
            </div>
            <div className="notification-item">
              <label>
                <input
                  type="checkbox"
                  checked={notifyShipmentUpdateInApp}
                  onChange={(e) => setNotifyShipmentUpdateInApp(e.target.checked)}
                />
                Shipment status update alerts
              </label>
            </div>
          </div>

          <button onClick={handleSaveNotificationSettings} className="save-btn">Save Preferences</button>
        </>
      )}
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h2>Security Settings</h2>
      <form onSubmit={handleChangePassword} className="settings-form">
        <h3>Change Password</h3>
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="confirmNewPassword">Confirm New Password</label>
          <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
        </div>
        {changePasswordLoading && <p className="loading-message">Changing password...</p>}
        {changePasswordError && <p className="error-message">{changePasswordError}</p>}
        {changePasswordSuccess && <p className="success-message">{changePasswordSuccess}</p>}
        <button type="submit" className="save-btn" disabled={changePasswordLoading}>
          {changePasswordLoading ? 'Saving...' : 'Change Password'}
        </button>
      </form>
    </div>
  );

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
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'users' && (
            <div className="settings-section">
              <h2>User Management</h2>
              {loadingUsers && <p>Loading users...</p>}
              {errorUsers && <p style={{ color: 'red' }}>Error loading users: {errorUsers}</p>}
              {!loadingUsers && !errorUsers && (
                <div className="users-table">
                  <div className="table-header">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>
                  {users.length > 0 ? (
                    users.map(user => (
                      <div className="table-row" key={user.id}>
                        <div>{user.name}</div>
                        <div>{user.email}</div>
                        <div>{user.role}</div>
                        <div className={`status ${user.status ? user.status.toLowerCase() : ''}`}>{user.status}</div>
                        <div className="actions">
                          <button className="action-btn edit" onClick={() => handleEditUserClick(user)}>Edit</button>
                          <button className="action-btn delete" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="table-row">
                      <div colSpan="5" style={{ textAlign: 'center' }}>No users found.</div>
                    </div>
                  )}
                </div>
              )}

              {!showAddUserForm && (
                <button className="add-user-btn" onClick={() => setShowAddUserForm(true)}>+ Add New User</button>
              )}

              {showAddUserForm && (
                <form onSubmit={handleSaveUser} className="add-user-form">
                  <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
                  <div className="setting-group">
                    <label>Name</label>
                    <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
                  </div>
                  <div className="setting-group">
                    <label>Email</label>
                    <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
                  </div>
                  <div className="setting-group">
                    <label>Password</label>
                    <input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required={!editingUser} disabled={!!editingUser} />
                    {editingUser && <small style={{display: 'block', marginTop: '5px'}}>Password cannot be changed from this form.</small>}
                  </div>
                  <div className="setting-group">
                    <label>Role</label>
                    <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn">Save User</button>
                    <button type="button" className="cancel-btn" onClick={() => { setShowAddUserForm(false); setEditingUser(null); }}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}
          {activeTab === 'warehouse' && renderWarehouseSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
        </div>
      </div>
    </div>
  );
};

export default Settings;