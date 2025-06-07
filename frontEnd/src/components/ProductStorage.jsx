import React, { useState, useEffect, useCallback } from 'react';
import './StandardModal.css';
import './ProductStorage.css';

const ProductStorage = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [availableZones, setAvailableZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [error, setError] = useState(null);

  const categories = ['Electronics', 'Fragile', 'Bulk', 'Perishable', 'Hazardous'];

  const fetchProducts = async () => {
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/products');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setError("Failed to load products from the server.");
    }
  };

  const fetchZones = async () => {
    setLoadingZones(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/warehouse-zones');
      if (!response.ok) {
        throw new Error('Network response for zones was not ok');
      }
      const data = await response.json();
      setAvailableZones(data.map(zone => zone.id));
    } catch (error) {
      console.error("Failed to fetch zones:", error);
      setError("Failed to load available zones from the server.");
    } finally {
      setLoadingZones(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchZones();
  }, []);

  const filteredProducts = products.filter(product => {
    return (
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterCategory === '' || product.category === filterCategory) &&
      (filterZone === '' || product.zone === filterZone)
    );
  });

  const getStockStatus = (quantity, minStock, maxStock) => {
    if (quantity <= minStock) return 'low';
    if (quantity >= maxStock * 0.9) return 'high';
    return 'normal';
  };

  const lowStockCount = products.filter(p => p.quantity <= p.minStock).length;
  const totalValue = products.reduce((acc, p) => acc + p.quantity, 0);

  const handleDeleteProduct = async (productId) => {
    if (window.confirm(`Are you sure you want to delete product ${productId}? This action will attempt to remove it permanently.`)) {
      setError(null);
      try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
          alert(`Product ${productId} deleted successfully.`);
          console.log(`Product ${productId} deleted successfully from backend and frontend.`);
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.message || `Failed to delete product ${productId}. Status: ${response.status}`;
          console.error('Failed to delete product:', errorMessage, errorData);
          alert(errorMessage);
          setError(errorMessage);
        }
      } catch (err) {
        console.error('Error connecting to the backend for product deletion:', err);
        const connectError = 'Error connecting to the server to delete product. Please check your connection or try again later.';
        alert(connectError);
        setError(connectError);
      }
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError(null);

    const newProduct = {
      id: e.target.elements.id.value,
      name: e.target.elements.name.value,
      category: e.target.elements.category.value,
      zone: e.target.elements.zone.value,
      shelf: e.target.elements.shelf.value,
      quantity: Number(e.target.elements.quantity.value),
      minStock: Number(e.target.elements.minStock.value),
      maxStock: Number(e.target.elements.maxStock.value),
    };

    try {
      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduct)
      });

      if (response.ok) {
        setShowAddForm(false);
        fetchProducts();
        alert('Product added successfully!');
      } else {
        const errorData = await response.json();
        alert('Failed to add product: ' + (errorData.message || 'Unknown error'));
        setError('Failed to add product: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error connecting to the backend:', err);
      alert('Error connecting to the backend: ' + err.message);
      setError('Error connecting to the backend: ' + err.message);
    }
  };

  return (
    <div className="product-storage">
      <div className="page-header">
        <h1>Product Storage</h1>
        <button className="add-btn" onClick={() => setShowAddForm(true)}>+ Add Product</button>
      </div>

      {error && <div className="error-message" style={{ color: 'red', textAlign: 'center', margin: '1rem 0' }}>{error}</div>}

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
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
            <option value="">All Zones</option>
            {loadingZones ? (
              <option disabled>Loading Zones...</option>
            ) : (
              availableZones.map(zoneId => (
                <option key={zoneId} value={zoneId}>Zone {zoneId}</option>
              ))
            )}
          </select>
        </div>
      </div>

      {showAddForm && (
        <div className="standard-modal-overlay">
          <div className="standard-modal-content add-product-form">
            <div className="standard-modal-header">
              <h2>Add New Product</h2>
              <button onClick={() => setShowAddForm(false)} className="standard-modal-close-button">&times;</button>
            </div>
            <form onSubmit={handleAddProduct}>
              <div className="standard-form-group">
                <label htmlFor="id">SKU ID</label>
                <input type="text" id="id" name="id" required />
              </div>
              <div className="standard-form-group">
                <label htmlFor="name">Product Name</label>
                <input type="text" id="name" name="name" required />
              </div>
              <div className="standard-form-group">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" required>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="standard-form-group">
                <label htmlFor="zone">Zone</label>
                {loadingZones ? (
                  <p>Loading zones...</p>
                ) : error ? (
                  <p style={{ color: 'red' }}>Error loading zones.</p>
                ) : (
                  <select id="zone" name="zone" required>
                    {availableZones.map(zoneId => <option key={zoneId} value={zoneId}>Zone {zoneId}</option>)}
                  </select>
                )}
              </div>
              <div className="standard-form-group">
                <label htmlFor="shelf">Shelf (e.g. A1, B2)</label>
                <input type="text" id="shelf" name="shelf" required />
              </div>
              <div className="standard-form-group">
                <label htmlFor="quantity">Quantity</label>
                <input type="number" id="quantity" name="quantity" required min="0" />
              </div>
              <div className="standard-form-group">
                <label htmlFor="minStock">Min Stock</label>
                <input type="number" id="minStock" name="minStock" required min="0" />
              </div>
              <div className="standard-form-group">
                <label htmlFor="maxStock">Max Stock</label>
                <input type="number" id="maxStock" name="maxStock" required min="0" />
              </div>
              <div className="standard-modal-actions">
                <button type="submit" className="confirm-button">Add Product</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="cancel-button">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="products-table">
        <div className="table-header">
          <div>SKU</div>
          <div>Product Name</div>
          <div>Category</div>
          <div>Location</div>
          <div>Stock Level</div>
          <div>Status</div>
          <div>Last Updated</div>
          <div>Actions</div>
        </div>
        {products.length === 0 && !loadingZones && !error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>No products found.</div>
        ) : filteredProducts.map(product => (
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
            <div className="last-updated">{new Date(product.lastUpdated).toLocaleString()}</div>
            <div className="product-action-cell">
              <button
                onClick={() => handleDeleteProduct(product.id)}
                className="delete-product-btn"
                title={`Delete ${product.name}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductStorage;