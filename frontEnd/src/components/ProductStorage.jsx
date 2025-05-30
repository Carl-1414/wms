import React, { useState } from 'react';
import './ProductStorage.css';

const ProductStorage = () => {
  const [products, setProducts] = useState([
    { id: 'SKU-001', name: 'Laptop Computer', category: 'Electronics', zone: 'A1', shelf: 'A1-001', quantity: 45, minStock: 20, maxStock: 100, lastUpdated: '2024-01-15' },
    { id: 'SKU-002', name: 'Wireless Mouse', category: 'Electronics', zone: 'A1', shelf: 'A1-025', quantity: 156, minStock: 50, maxStock: 200, lastUpdated: '2024-01-14' },
    { id: 'SKU-003', name: 'Glass Vase', category: 'Fragile', zone: 'B2', shelf: 'B2-010', quantity: 12, minStock: 15, maxStock: 50, lastUpdated: '2024-01-13' },
    { id: 'SKU-004', name: 'Industrial Cable', category: 'Bulk', zone: 'C3', shelf: 'C3-045', quantity: 234, minStock: 100, maxStock: 500, lastUpdated: '2024-01-12' },
    { id: 'SKU-005', name: 'Frozen Food Items', category: 'Perishable', zone: 'D4', shelf: 'D4-008', quantity: 78, minStock: 30, maxStock: 150, lastUpdated: '2024-01-11' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = ['Electronics', 'Fragile', 'Bulk', 'Perishable', 'Hazardous'];
  const zones = ['A1', 'B2', 'C3', 'D4', 'E5', 'F6'];

  const filteredProducts = products.filter(product => {
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase())
    ) &&
    (filterCategory === '' || product.category === filterCategory) &&
    (filterZone === '' || product.zone === filterZone);
  });

  const getStockStatus = (quantity, minStock, maxStock) => {
    if (quantity <= minStock) return 'low';
    if (quantity >= maxStock * 0.9) return 'high';
    return 'normal';
  };

  const lowStockCount = products.filter(p => p.quantity <= p.minStock).length;
  const totalValue = products.reduce((acc, p) => acc + p.quantity, 0);

  return (
    <div className="product-storage">
      <div className="page-header">
        <h1>Product Storage</h1>
        <button className="add-btn" onClick={() => setShowAddForm(true)}>
          + Add Product
        </button>
      </div>

      <div className="storage-overview">
        <div className="overview-card">
          <h3>Total SKUs</h3>
          <div className="overview-value">{products.length}</div>
        </div>
        <div className="overview-card">
          <h3>Total Quantity</h3>
          <div className="overview-value">{totalValue.toLocaleString()}</div>
        </div>
        <div className="overview-card">
          <h3>Low Stock Items</h3>
          <div className="overview-value">{lowStockCount}</div>
        </div>
        <div className="overview-card">
          <h3>Categories</h3>
          <div className="overview-value">{categories.length}</div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
          >
            <option value="">All Zones</option>
            {zones.map(zone => (
              <option key={zone} value={zone}>Zone {zone}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="products-table">
        <div className="table-header">
          <div>SKU</div>
          <div>Product Name</div>
          <div>Category</div>
          <div>Location</div>
          <div>Stock Level</div>
          <div>Status</div>
          <div>Last Updated</div>
        </div>
        {filteredProducts.map(product => (
          <div key={product.id} className="table-row">
            <div className="sku">{product.id}</div>
            <div className="product-name">{product.name}</div>
            <div className="category">
              <span className={`category-badge ${product.category.toLowerCase()}`}>
                {product.category}
              </span>
            </div>
            <div className="location">
              Zone {product.zone} - {product.shelf}
            </div>
            <div className="stock-level">
              <div className="stock-info">
                <span className="current">{product.quantity}</span>
                <span className="range">({product.minStock}-{product.maxStock})</span>
              </div>
              <div className="stock-bar">
                <div 
                  className={`stock-fill ${getStockStatus(product.quantity, product.minStock, product.maxStock)}`}
                  style={{ width: `${Math.min((product.quantity / product.maxStock) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className={`status ${getStockStatus(product.quantity, product.minStock, product.maxStock)}`}>
              {getStockStatus(product.quantity, product.minStock, product.maxStock).toUpperCase()}
            </div>
            <div className="last-updated">{product.lastUpdated}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductStorage;
