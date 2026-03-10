import React, { useState, useEffect } from 'react';
import { productAPI } from '../api';
import ProductForm from './ProductForm';
import Modal from './Modal';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState({ open: false });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll();
      setProducts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load products: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (product) => {
    setModal({
      open: true,
      type: 'confirm-delete-product',
      title: 'Delete Product',
      message: `Delete "${product.name}"? This will fail if the product is used in any orders.`,
      onConfirm: async () => {
        setModal({ open: false });
        try {
          await productAPI.delete(product.id);
          await loadProducts();
        } catch (err) {
          setError('Failed to delete product: ' + (err.response?.data?.detail || err.message));
        }
      },
    });
  };

  const handleEdit = (product) => { setEditingProduct(product); setShowForm(true); };
  const handleCreate = () => { setEditingProduct(null); setShowForm(true); };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  const getStockClass = (qty) => {
    if (qty >= 50) return 'stock-green';
    if (qty >= 10) return 'stock-yellow';
    return 'stock-red';
  };

  const filteredProducts = typeFilter
    ? products.filter(p => p.product_type === typeFilter)
    : products;

  if (loading) return <div>Loading products...</div>;

  return (
    <div data-testid="product-list" className="entity-container">
      <h2>Products</h2>

      {error && <div id="product-list-error" className="error">{error}</div>}

      <Modal
        isOpen={modal.open}
        modalType={modal.type}
        title={modal.title}
        message={modal.message}
        confirmLabel="Delete"
        onConfirm={modal.onConfirm}
        onCancel={() => setModal({ open: false })}
      />

      {!showForm && (
        <>
          <div className="list-header">
            <button
              id="create-product-btn"
              className="btn-primary"
              onClick={handleCreate}
              data-testid="create-product-btn"
            >
              Create Product
            </button>

            <div className="filter-bar" data-testid="product-filter-bar">
              <select
                id="product-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-input"
                data-testid="product-type-filter"
              >
                <option value="">All Types</option>
                <option value="Basic">Basic</option>
                <option value="Professional">Professional</option>
                <option value="Teams">Teams</option>
                <option value="Ultra-Enterprise">Ultra-Enterprise</option>
              </select>
              <span className="filter-count">
                Showing {filteredProducts.length} of {products.length} products
              </span>
            </div>
          </div>

          <table id="products-table" className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Price/Seat</th>
                <th>Stock</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} data-product-id={product.id}>
                  <td data-testid={`product-id-${product.id}`}>{product.id}</td>
                  <td data-testid={`product-name-${product.id}`}>{product.name}</td>
                  <td data-testid={`product-type-${product.id}`}>{product.product_type}</td>
                  <td data-testid={`product-price-${product.id}`}>${product.price_per_seat.toFixed(2)}</td>
                  <td>
                    <span
                      className={`stock-badge ${getStockClass(product.stock_quantity)}`}
                      data-testid={`product-stock-${product.id}`}
                    >
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td data-testid={`product-description-${product.id}`}>{product.description || '-'}</td>
                  <td>
                    <button
                      id={`edit-product-${product.id}`}
                      className="btn-secondary"
                      onClick={() => handleEdit(product)}
                      data-testid={`edit-product-${product.id}`}
                    >
                      Edit
                    </button>
                    <button
                      id={`delete-product-${product.id}`}
                      className="btn-danger"
                      onClick={() => handleDelete(product)}
                      data-testid={`delete-product-${product.id}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <p className="no-data">
              {typeFilter ? `No ${typeFilter} products found.` : 'No products found. Create one to get started.'}
            </p>
          )}
        </>
      )}

      {showForm && (
        <ProductForm product={editingProduct} onClose={handleFormClose} />
      )}
    </div>
  );
};

export default ProductList;
