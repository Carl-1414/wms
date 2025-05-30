import React from 'react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onToggle, onPageChange, currentPage }) => {
  const menuItems = [
    { icon: '📊', label: 'Dashboard', path: 'dashboard' },
    { icon: '🏢', label: 'Warehouse Zones', path: 'zones' },
    { icon: '📦', label: 'Product Storage', path: 'storage' },
    { icon: '📥', label: 'Incoming Shipments', path: 'incoming' },
    { icon: '📤', label: 'Outgoing Shipments', path: 'outgoing' },
    { icon: '🔍', label: 'Inventory Audits', path: 'audits' },
    { icon: '📋', label: 'Orders', path: 'orders' },
    { icon: '📈', label: 'Reports', path: 'reports' },
    { icon: '⚙️', label: 'Settings', path: 'settings' },
  ];

  const handleNavClick = (e, path) => {
    e.preventDefault();
    onPageChange(path);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        {isOpen && <h2>WMS</h2>}
        <button className="toggle-btn" onClick={onToggle}>
          {isOpen ? '◀' : '▶'}
        </button>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <a
            key={index}
            href={`#${item.path}`}
            className={`nav-item ${currentPage === item.path ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {isOpen && <span className="nav-label">{item.label}</span>}
          </a>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
