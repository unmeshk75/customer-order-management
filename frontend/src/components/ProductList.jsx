import React, { useState, useEffect } from 'react';
import { productAPI } from '../api';
import ProductForm from './ProductForm';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This will fail if the product is used in any orders.')) {
      return;
    }

    try {
      await productAPI.delete(id);
      await loadProducts();
    } catch (err) {
      setError('Failed to delete product: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div data-testid="product-list" className="entity-container">
      <h2>Products</h2>

      {error && <div id="product-list-error" className="error">{error}</div>}

      {!showForm && (
        <>
          <button
            id="create-product-btn"
            className="btn-primary"
            onClick={handleCreate}
            data-testid="create-product-btn"
          >
            Create Product
          </button>

          <table id="products-table" className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Price/Seat</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} data-product-id={product.id}>
                  <td data-testid={`product-id-${product.id}`}>{product.id}</td>
                  <td data-testid={`product-name-${product.id}`}>{product.name}</td>
                  <td data-testid={`product-type-${product.id}`}>{product.product_type}</td>
                  <td data-testid={`product-price-${product.id}`}>${product.price_per_seat.toFixed(2)}</td>
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
                      onClick={() => handleDelete(product.id)}
                      data-testid={`delete-product-${product.id}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <p className="no-data">No products found. Create one to get started.</p>
          )}
        </>
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default ProductList;
