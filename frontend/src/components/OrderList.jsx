import React, { useState, useEffect } from 'react';
import { orderAPI } from '../api';
import OrderForm from './OrderForm';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getAll();
      setOrders(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load orders: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      await orderAPI.delete(id);
      await loadOrders();
    } catch (err) {
      setError('Failed to delete order: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCreate = () => {
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    loadOrders();
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div data-testid="order-list" className="entity-container">
      <h2>Orders</h2>

      {error && <div id="order-list-error" className="error">{error}</div>}

      {!showForm && (
        <>
          <button
            id="create-order-btn"
            className="btn-primary"
            onClick={handleCreate}
            data-testid="create-order-btn"
          >
            Create Order
          </button>

          <table id="orders-table" className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Customer Type</th>
                <th>Order Date</th>
                <th>Status</th>
                <th>Total Amount</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} data-order-id={order.id}>
                  <td data-testid={`order-id-${order.id}`}>{order.id}</td>
                  <td data-testid={`order-customer-${order.id}`}>{order.customer_name}</td>
                  <td data-testid={`order-customer-type-${order.id}`}>{order.customer_type}</td>
                  <td data-testid={`order-date-${order.id}`}>
                    {new Date(order.order_date).toLocaleDateString()}
                  </td>
                  <td data-testid={`order-status-${order.id}`}>{order.status}</td>
                  <td data-testid={`order-total-${order.id}`}>${order.total_amount.toFixed(2)}</td>
                  <td data-testid={`order-products-${order.id}`}>
                    {order.products.map((p, idx) => (
                      <div key={idx}>
                        {p.product_name} ({p.seats} seats)
                      </div>
                    ))}
                  </td>
                  <td>
                    <button
                      id={`delete-order-${order.id}`}
                      className="btn-danger"
                      onClick={() => handleDelete(order.id)}
                      data-testid={`delete-order-${order.id}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <p className="no-data">No orders found. Create one to get started.</p>
          )}
        </>
      )}

      {showForm && (
        <OrderForm onClose={handleFormClose} />
      )}
    </div>
  );
};

export default OrderList;
