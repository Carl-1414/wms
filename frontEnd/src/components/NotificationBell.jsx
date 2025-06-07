import React, { useState, useEffect, useRef } from 'react';
import './NotificationBell.css';

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    <path d="M21.66 16.5A1 1 0 0 1 21 16H3a1 1 0 0 1-.66-1.5 10.06 10.06 0 0 1 1.5-2.9"></path>
  </svg>
);

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const notificationRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/notifications');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let data = await response.json();
      data = data.map(n => ({
        ...n,
        read: n.is_read,
        timestamp: n.created_at
      }));
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
      setError(e.message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && notifications.length === 0 && !loading && !error) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/notifications/${id}/mark-read`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/notifications/mark-all-read', {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  };

  const handleClearAll = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/notifications', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNotifications([]);
      setIsOpen(false);
    } catch (e) {
      console.error("Failed to clear notifications:", e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="notification-bell-container" ref={notificationRef}>
      <button onClick={toggleDropdown} className="notification-bell-button">
        <BellIcon />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">Mark all as read</button>
            )}
          </div>
          {loading && <p className="loading-notifications">Loading notifications...</p>}
          {error && <p className="error-notifications">Error: {error}</p>}
          {!loading && !error && notifications.length === 0 ? (
            <p className="no-notifications">No new notifications.</p>
          ) : (
            <ul className="notification-list">
              {notifications.map(notification => (
                <li key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}`}>
                  <div className="notification-content">
                    <p>{notification.message}</p>
                    <span className="notification-timestamp">{new Date(notification.timestamp).toLocaleString()}</span>
                  </div>
                  {!notification.read && (
                    <button onClick={() => handleMarkAsRead(notification.id)} className="mark-read-btn" title="Mark as read">✓</button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {notifications.length > 0 && (
            <div className="notification-dropdown-footer">
              <button onClick={handleClearAll} className="clear-all-btn">Clear All</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
