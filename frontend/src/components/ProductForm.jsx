import React, { useState, useEffect } from 'react';
import { productAPI } from '../api';

const ProductForm = ({ product, onClose }) => {
  const isEdit = !!product;

  const [formData, setFormData] = useState({
    name: '',
    product_type: '',
    description: '',
    price_per_seat: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        product_type: product.product_type || '',
        description: product.description || '',
        price_per_seat: product.price_per_seat || '',
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate price
    const price = parseFloat(formData.price_per_seat);
    if (isNaN(price) || price <= 0) {
      setError('Price per seat must be a positive number');
      setLoading(false);
      return;
    }

    const data = {
      ...formData,
      price_per_seat: price,
    };

    try {
      if (isEdit) {
        await productAPI.update(product.id, data);
      } else {
        await productAPI.create(data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>{isEdit ? 'Edit Product' : 'Create Product'}</h3>

      {error && <div id="product-form-error" className="error">{error}</div>}

      <form id="product-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="product-name">Name *</label>
          <input
            id="product-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            data-testid="product-name-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="product-type">Product Type *</label>
          <select
            id="product-type"
            name="product_type"
            value={formData.product_type}
            onChange={handleChange}
            required
            data-testid="product-type-select"
          >
            <option value="">Select Type</option>
            <option value="Basic">Basic</option>
            <option value="Professional">Professional</option>
            <option value="Teams">Teams</option>
            <option value="Ultra-Enterprise">Ultra-Enterprise</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="product-description">Description</label>
          <textarea
            id="product-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            data-testid="product-description-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="product-price">Price per Seat *</label>
          <input
            id="product-price"
            name="price_per_seat"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.price_per_seat}
            onChange={handleChange}
            required
            data-testid="product-price-input"
          />
        </div>

        <div className="form-actions">
          <button
            id="submit-product-btn"
            type="submit"
            className="btn-primary"
            disabled={loading}
            data-testid="submit-product-btn"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
          <button
            id="cancel-product-btn"
            type="button"
            className="btn-secondary"
            onClick={onClose}
            data-testid="cancel-product-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
