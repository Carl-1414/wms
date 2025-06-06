import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WarehouseZones from './components/WarehouseZones';
import ProductStorage from './components/ProductStorage';
import IncomingShipments from './components/IncomingShipments';
import OutgoingShipments from './components/OutgoingShipments';
import InventoryAudits from './components/InventoryAudits';
import Orders from './components/Orders';
import Reports from './components/Reports';
import Settings from './components/Settings';
import NotificationBell from './components/NotificationBell';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'zones':
        return <WarehouseZones />;
      case 'storage':
        return <ProductStorage />;
      case 'incoming':
        return <IncomingShipments />;
      case 'outgoing':
        return <OutgoingShipments />;
      case 'audits':
        return <InventoryAudits />;
      case 'orders':
        return <Orders />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} onPageChange={handlePageChange} currentPage={currentPage} />
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="main-content-header-utils">
          <NotificationBell />
        </div>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
