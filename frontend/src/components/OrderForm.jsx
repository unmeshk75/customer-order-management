import React, { useState, useEffect } from 'react';
import { orderAPI, customerAPI, productAPI } from '../api';

const PRODUCT_RULES = {
  'Consumer': ['Basic', 'Professional'],
  'SMB': ['Professional', 'Teams'],
  'Enterprise': ['Basic', 'Teams', 'Ultra-Enterprise']
};

const OrderForm = ({ onClose }) => {
  const [customers, setCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomerType, setSelectedCustomerType] = useState('');
  const [notes, setNotes] = useState('');

  const [orderProducts, setOrderProducts] = useState([{ product_id: '', seats: 1 }]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        customerAPI.getAll(),
        productAPI.getAll()
      ]);
      setCustomers(customersRes.data);
      setAllProducts(productsRes.data);
    } catch (err) {
      setError('Failed to load data: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setSelectedCustomerId(customerId);

    if (customerId) {
      const customer = customers.find(c => c.id === parseInt(customerId));
      if (customer) {
        setSelectedCustomerType(customer.customer_type);
        const allowedTypes = PRODUCT_RULES[customer.customer_type] || [];
        const filtered = allProducts.filter(p => allowedTypes.includes(p.product_type));
        setAvailableProducts(filtered);

        // Reset product selections
        setOrderProducts([{ product_id: '', seats: 1 }]);
      }
    } else {
      setSelectedCustomerType('');
      setAvailableProducts([]);
      setOrderProducts([{ product_id: '', seats: 1 }]);
    }
  };

  const handleProductChange = (index, productId) => {
    const newOrderProducts = [...orderProducts];
    newOrderProducts[index].product_id = productId;
    setOrderProducts(newOrderProducts);
  };

  const handleSeatsChange = (index, seats) => {
    const newOrderProducts = [...orderProducts];
    newOrderProducts[index].seats = parseInt(seats) || 1;
    setOrderProducts(newOrderProducts);
  };

  const addProductRow = () => {
    setOrderProducts([...orderProducts, { product_id: '', seats: 1 }]);
  };

  const removeProduct = (index) => {
    if (orderProducts.length > 1) {
      const newOrderProducts = orderProducts.filter((_, i) => i !== index);
      setOrderProducts(newOrderProducts);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!selectedCustomerId) {
      setError('Please select a customer');
      return;
    }

    // Filter out empty product selections
    const validProducts = orderProducts.filter(p => p.product_id && p.seats > 0);

    if (validProducts.length === 0) {
      setError('Please select at least one product');
      return;
    }

    // Check for duplicate products
    const productIds = validProducts.map(p => p.product_id);
    if (new Set(productIds).size !== productIds.length) {
      setError('Cannot add the same product multiple times');
      return;
    }

    // Convert product_id to numbers
    const products = validProducts.map(p => ({
      product_id: parseInt(p.product_id),
      seats: p.seats
    }));

    const orderData = {
      customer_id: parseInt(selectedCustomerId),
      products: products,
      notes: notes
    };

    setLoading(true);

    try {
      await orderAPI.create(orderData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>Create Order</h3>

      {error && <div id="order-form-error" className="error">{error}</div>}

      <form id="order-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="order-customer">Customer *</label>
          <select
            id="order-customer"
            value={selectedCustomerId}
            onChange={handleCustomerChange}
            required
            data-testid="order-customer-select"
          >
            <option value="">Select Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.customer_type})
              </option>
            ))}
          </select>
        </div>

        {selectedCustomerId && (
          <div id="order-products-section" className="form-section">
            <h4>Products *</h4>
            <p className="info-text">
              Available products for {selectedCustomerType} customers: {PRODUCT_RULES[selectedCustomerType]?.join(', ')}
            </p>

            {orderProducts.map((item, index) => (
              <div key={index} className="product-row" data-product-index={index}>
                <div className="form-group">
                  <label htmlFor={`order-product-${index}`}>Product</label>
                  <select
                    id={`order-product-${index}`}
                    value={item.product_id}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    required
                    data-testid={`order-product-${index}`}
                  >
                    <option value="">Select Product</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.product_type}) - ${p.price_per_seat}/seat
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor={`order-seats-${index}`}>Seats</label>
                  <input
                    id={`order-seats-${index}`}
                    type="number"
                    min="1"
                    value={item.seats}
                    onChange={(e) => handleSeatsChange(index, e.target.value)}
                    required
                    data-testid={`order-seats-${index}`}
                  />
                </div>

                {orderProducts.length > 1 && (
                  <button
                    id={`remove-product-${index}`}
                    type="button"
                    className="btn-danger btn-small"
                    onClick={() => removeProduct(index)}
                    data-testid={`remove-product-${index}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              id="add-product-btn"
              type="button"
              className="btn-secondary"
              onClick={addProductRow}
              data-testid="add-product-btn"
            >
              Add Another Product
            </button>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="order-notes">Notes</label>
          <textarea
            id="order-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            data-testid="order-notes-input"
          />
        </div>

        <div className="form-actions">
          <button
            id="submit-order-btn"
            type="submit"
            className="btn-primary"
            disabled={loading || !selectedCustomerId}
            data-testid="submit-order-btn"
          >
            {loading ? 'Creating...' : 'Create Order'}
          </button>
          <button
            id="cancel-order-btn"
            type="button"
            className="btn-secondary"
            onClick={onClose}
            data-testid="cancel-order-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
