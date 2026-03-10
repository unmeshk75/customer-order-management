import React, { useState, useEffect } from 'react';
import { orderAPI, customerAPI, productAPI } from '../api';

const PRODUCT_RULES = {
  'Consumer': ['Basic', 'Professional'],
  'SMB': ['Professional', 'Teams'],
  'Enterprise': ['Basic', 'Teams', 'Ultra-Enterprise']
};

const OrderForm = ({ order, onClose }) => {
  const isEdit = !!order;

  const [customers, setCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomerType, setSelectedCustomerType] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [orderStatus, setOrderStatus] = useState('Active');

  const [orderProducts, setOrderProducts] = useState([{ product_id: '', seats: 1 }]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = isEdit ? 2 : 3;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isEdit && allProducts.length > 0 && customers.length > 0) {
      setSelectedCustomerId(String(order.customer_id));
      setOrderStatus(order.status || 'Active');
      setNotes(order.notes || '');
      setPriority(order.priority || 'Medium');
      setDiscountPercentage(order.discount_percentage ?? 0);

      const customer = customers.find(c => c.id === order.customer_id);
      if (customer) {
        setSelectedCustomerType(customer.customer_type);
        const allowedTypes = PRODUCT_RULES[customer.customer_type] || [];
        setAvailableProducts(allProducts.filter(p => allowedTypes.includes(p.product_type)));
      }
    }
  }, [isEdit, allProducts, customers]);

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
        setAvailableProducts(allProducts.filter(p => allowedTypes.includes(p.product_type)));
        setOrderProducts([{ product_id: '', seats: 1 }]);
      }
    } else {
      setSelectedCustomerType('');
      setAvailableProducts([]);
      setOrderProducts([{ product_id: '', seats: 1 }]);
    }
  };

  const handleProductChange = (index, productId) => {
    const updated = [...orderProducts];
    updated[index].product_id = productId;
    setOrderProducts(updated);
    setError('');
  };

  const handleSeatsChange = (index, seats) => {
    const updated = [...orderProducts];
    const parsed = parseInt(seats) || 1;
    updated[index].seats = parsed;
    setOrderProducts(updated);
    const sel = availableProducts.find(p => p.id === parseInt(updated[index].product_id));
    if (sel && parsed > sel.stock_quantity) {
      setError(`Cannot order ${parsed} seats — only ${sel.stock_quantity} in stock for "${sel.name}"`);
    } else {
      setError('');
    }
  };

  const addProductRow = () => setOrderProducts([...orderProducts, { product_id: '', seats: 1 }]);

  const removeProduct = (index) => {
    if (orderProducts.length > 1) {
      setOrderProducts(orderProducts.filter((_, i) => i !== index));
    }
  };

  const rawTotal = orderProducts.reduce((sum, item) => {
    const p = availableProducts.find(p => p.id === parseInt(item.product_id));
    return sum + (p ? p.price_per_seat * (item.seats || 0) : 0);
  }, 0);
  const discountAmount = rawTotal * (discountPercentage / 100);
  const discountedTotal = rawTotal - discountAmount;
  const editFinalTotal = isEdit ? order.total_amount * (1 - discountPercentage / 100) : 0;

  const stepStatus = (step) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'pending';
  };

  const canGoNext = () => {
    if (currentStep === 1 && !isEdit && !selectedCustomerId) return false;
    if (currentStep === 2 && !isEdit) {
      const valid = orderProducts.filter(p => p.product_id && p.seats > 0);
      return valid.length > 0;
    }
    return true;
  };

  const handleNext = () => { setError(''); setCurrentStep(s => s + 1); };
  const handleBack = () => { setError(''); setCurrentStep(s => s - 1); };

  const handleSubmit = async () => {
    setError('');

    if (isEdit) {
      setLoading(true);
      try {
        await orderAPI.update(order.id, {
          status: orderStatus,
          priority,
          notes,
          discount_percentage: discountPercentage,
        });
        onClose();
      } catch (err) {
        const detail = err.response?.data?.detail;
        setError(Array.isArray(detail) ? detail.map(d => d.msg).join('; ') : detail || err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    const validProducts = orderProducts.filter(p => p.product_id && p.seats > 0);
    if (validProducts.length === 0) { setError('Please select at least one product'); return; }

    const productIds = validProducts.map(p => p.product_id);
    if (new Set(productIds).size !== productIds.length) { setError('Cannot add the same product multiple times'); return; }

    for (const item of validProducts) {
      const product = availableProducts.find(p => p.id === parseInt(item.product_id));
      if (product && item.seats > product.stock_quantity) {
        setError(`Insufficient stock for "${product.name}": ${product.stock_quantity} available`);
        return;
      }
    }

    setLoading(true);
    try {
      await orderAPI.create({
        customer_id: parseInt(selectedCustomerId),
        products: validProducts.map(p => ({ product_id: parseInt(p.product_id), seats: p.seats })),
        notes,
        priority,
        discount_percentage: discountPercentage,
      });
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map(d => d.msg).join('; ') : detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wizard-container" data-testid="order-wizard">
      <h3>{isEdit ? `Edit Order #${order.id}` : 'Create Order'}</h3>

      {error && <div id="order-form-error" className="error">{error}</div>}

      {/* Step Indicator */}
      <div className="wizard-steps">
        <div className="step" data-step="1" data-status={stepStatus(1)}>
          <span className="step-number">1</span>
          <span className="step-label">Customer &amp; Settings</span>
        </div>
        {!isEdit && (
          <div className="step" data-step="2" data-status={stepStatus(2)}>
            <span className="step-number">2</span>
            <span className="step-label">Products</span>
          </div>
        )}
        <div className="step" data-step={isEdit ? 2 : 3} data-status={stepStatus(isEdit ? 2 : 3)}>
          <span className="step-number">{isEdit ? 2 : 3}</span>
          <span className="step-label">Review &amp; Confirm</span>
        </div>
      </div>

      {/* Step 1: Customer & Settings */}
      <div className="wizard-panel" data-step="1" data-status={currentStep === 1 ? 'active' : 'inactive'}>
        <fieldset className="form-fieldset">
          <legend>Customer</legend>
          <div className="form-group">
            <label htmlFor="order-customer">Customer *</label>
            {isEdit ? (
              <div className="readonly-field" data-testid="order-customer-readonly">
                <strong>{order.customer_name}</strong> ({order.customer_type})
              </div>
            ) : (
              <select
                id="order-customer"
                value={selectedCustomerId}
                onChange={handleCustomerChange}
                data-testid="order-customer-select"
              >
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customer_type}){c.company_name ? ` — ${c.company_name}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </fieldset>

        <fieldset className="form-fieldset">
          <legend>Order Details</legend>
          {isEdit && (
            <div className="form-group">
              <label htmlFor="order-status">Status</label>
              <select id="order-status" value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} data-testid="order-status-select">
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="order-priority">Priority</label>
            <select id="order-priority" value={priority} onChange={(e) => setPriority(e.target.value)} data-testid="order-priority-select">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="order-discount">Discount (%)</label>
            <input
              id="order-discount"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
              data-testid="order-discount-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="order-notes">Notes</label>
            <textarea
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Any special instructions or notes..."
              data-testid="order-notes-input"
            />
          </div>
        </fieldset>
      </div>

      {/* Step 2: Products (create mode only) */}
      {!isEdit && (
        <div className="wizard-panel" data-step="2" data-status={currentStep === 2 ? 'active' : 'inactive'}>
          <fieldset id="order-products-section" className="form-fieldset">
            <legend>Products *</legend>
            {selectedCustomerId && (
              <p className="info-text">
                Available products for {selectedCustomerType} customers:{' '}
                <strong>{PRODUCT_RULES[selectedCustomerType]?.join(', ')}</strong>
              </p>
            )}
            {orderProducts.map((item, index) => (
              <div key={index} className="product-row" data-product-index={index} data-testid={`product-row-${index}`}>
                <div className="form-group">
                  <label htmlFor={`order-product-${index}`}>Product</label>
                  <select
                    id={`order-product-${index}`}
                    value={item.product_id}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    data-testid={`order-product-${index}`}
                  >
                    <option value="">Select Product</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.product_type}) — ${p.price_per_seat}/seat
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
                    data-testid={`order-seats-${index}`}
                  />
                </div>
                {item.product_id && (() => {
                  const sel = availableProducts.find(p => p.id === parseInt(item.product_id));
                  if (!sel) return null;
                  const stockClass = sel.stock_quantity < 10 ? 'stock-red' : sel.stock_quantity < 50 ? 'stock-yellow' : 'stock-green';
                  return (
                    <div className="stock-indicator-cell">
                      <span className={`stock-indicator ${stockClass}`} data-testid={`stock-indicator-${index}`}>
                        {sel.stock_quantity} in stock
                      </span>
                    </div>
                  );
                })()}
                {orderProducts.length > 1 && (
                  <button
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
            <button type="button" className="btn-secondary" onClick={addProductRow} data-testid="add-product-btn">
              Add Another Product
            </button>
            {rawTotal > 0 && (
              <div className="order-total-summary" data-testid="order-total-summary">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span data-testid="order-subtotal">${rawTotal.toFixed(2)}</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="total-row discount-row">
                    <span>Discount ({discountPercentage}%):</span>
                    <span data-testid="order-discount-amount">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-row total-final">
                  <span>Total:</span>
                  <span data-testid="order-total">${discountedTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </fieldset>
        </div>
      )}

      {/* Final Step: Review & Confirm */}
      <div
        className="wizard-panel"
        data-step={isEdit ? 2 : 3}
        data-status={currentStep === totalSteps ? 'active' : 'inactive'}
      >
        <fieldset className="form-fieldset">
          <legend>Review</legend>
          {isEdit ? (
            <div className="readonly-products" data-testid="order-products-readonly">
              {order.products.map((p, idx) => (
                <div key={idx} className="readonly-product-row">
                  <span className="readonly-product-name">{p.product_name}</span>
                  <span className="readonly-product-type">({p.product_type})</span>
                  <span className="readonly-product-seats">{p.seats} seats</span>
                  <span className="readonly-product-subtotal">${p.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <table className="review-table" data-testid="review-table">
              <thead>
                <tr>
                  <th data-col="product">Product</th>
                  <th data-col="type">Type</th>
                  <th data-col="seats">Seats</th>
                  <th data-col="unit-price">Unit Price</th>
                  <th data-col="subtotal">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orderProducts.filter(i => i.product_id && i.seats > 0).map((item, idx) => {
                  const p = availableProducts.find(p => p.id === parseInt(item.product_id));
                  if (!p) return null;
                  return (
                    <tr key={idx} data-review-row={idx}>
                      <td data-col="product">{p.name}</td>
                      <td data-col="type">{p.product_type}</td>
                      <td data-col="seats">{item.seats}</td>
                      <td data-col="unit-price">${p.price_per_seat.toFixed(2)}</td>
                      <td data-col="subtotal" data-testid={`review-subtotal-${idx}`}>
                        ${(p.price_per_seat * item.seats).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="order-total-summary" data-testid="order-total-summary">
            {isEdit ? (
              <>
                <div className="total-row">
                  <span>Original Total:</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="total-row discount-row">
                    <span>Discount ({discountPercentage}%):</span>
                    <span>-${(order.total_amount * discountPercentage / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="total-row total-final">
                  <span>Final Total:</span>
                  <span data-testid="order-total">${editFinalTotal.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>${rawTotal.toFixed(2)}</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="total-row discount-row">
                    <span>Discount ({discountPercentage}%):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-row total-final">
                  <span>Total:</span>
                  <span data-testid="order-total">${discountedTotal.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </fieldset>
      </div>

      {/* Wizard Navigation */}
      <div className="wizard-nav">
        {currentStep > 1 && (
          <button type="button" className="btn-secondary" onClick={handleBack} data-testid="wizard-back">
            Back
          </button>
        )}
        {currentStep < totalSteps && (
          <button
            type="button"
            className="btn-primary"
            onClick={handleNext}
            disabled={!canGoNext()}
            data-testid="wizard-next"
          >
            Next
          </button>
        )}
        {currentStep === totalSteps && (
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            data-testid="wizard-submit"
            id="submit-order-btn"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Order' : 'Create Order')}
          </button>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
          data-testid="cancel-order-btn"
          id="cancel-order-btn"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default OrderForm;
