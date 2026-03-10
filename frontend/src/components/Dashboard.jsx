import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardAPI.get();
        setData(res.data);
      } catch (err) {
        setError('Failed to load dashboard: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="entity-container"><p>Loading dashboard...</p></div>;
  if (error) return <div className="entity-container"><div className="error">{error}</div></div>;

  const totalCustomers = Object.values(data.customers_by_type).reduce((a, b) => a + b, 0);
  const totalOrders = Object.values(data.orders_by_status).reduce((a, b) => a + b, 0);

  return (
    <div data-testid="dashboard" className="entity-container">
      <h2>Dashboard</h2>
      <p className="dashboard-subtitle">Overview of your customer order management system</p>

      <div className="dashboard-grid">

        {/* Customers by Type */}
        <div className="dashboard-card" data-testid="dashboard-card-customers">
          <div className="dashboard-card-header">
            <h3>Customers</h3>
            <span className="dashboard-card-total" data-testid="customer-total">{totalCustomers}</span>
          </div>
          {['Consumer', 'SMB', 'Enterprise'].map(type => (
            <div
              key={type}
              className="customer-type-row"
              data-customer-type={type}
              data-testid="customer-type-row"
            >
              <span className="customer-type-label">{type}</span>
              <span
                className="customer-type-count"
                data-testid={`customer-count-${type.toLowerCase()}`}
              >
                {data.customers_by_type[type] || 0}
              </span>
            </div>
          ))}
        </div>

        {/* Orders by Status */}
        <div className="dashboard-card" data-testid="dashboard-card-orders">
          <div className="dashboard-card-header">
            <h3>Orders</h3>
            <span className="dashboard-card-total" data-testid="order-total">{totalOrders}</span>
          </div>
          {['Active', 'Completed', 'Cancelled'].map(orderStatus => (
            <div
              key={orderStatus}
              className={`order-status-row status-row-${orderStatus.toLowerCase()}`}
              data-order-status={orderStatus}
              data-testid="order-status-row"
            >
              <span className={`status-badge status-${orderStatus.toLowerCase()}`}>
                {orderStatus}
              </span>
              <span data-testid={`order-count-${orderStatus.toLowerCase()}`}>
                {data.orders_by_status[orderStatus] || 0}
              </span>
            </div>
          ))}
        </div>

        {/* Total Revenue */}
        <div className="dashboard-card" data-testid="dashboard-card-revenue">
          <div className="dashboard-card-header">
            <h3>Revenue</h3>
          </div>
          <div className="revenue-amount" data-testid="total-revenue">
            ${data.total_revenue.toFixed(2)}
          </div>
          <p className="revenue-note">From Active &amp; Completed orders</p>
        </div>

        {/* Low Stock Alerts */}
        <div
          className={`dashboard-card ${data.low_stock_products.length > 0 ? 'dashboard-card-alert' : ''}`}
          data-testid="dashboard-card-lowstock"
        >
          <div className="dashboard-card-header">
            <h3>Low Stock Alerts</h3>
            <span
              className={`dashboard-card-total ${data.low_stock_products.length > 0 ? 'alert-count' : ''}`}
              data-testid="low-stock-count"
            >
              {data.low_stock_products.length}
            </span>
          </div>
          {data.low_stock_products.length === 0 ? (
            <p className="no-data" style={{ padding: '1rem 0' }}>All products are well stocked</p>
          ) : (
            data.low_stock_products.map(p => (
              <div
                key={p.id}
                className="low-stock-row"
                data-product-id={p.id}
                data-testid="low-stock-row"
              >
                <div className="low-stock-info">
                  <span className="low-stock-name" data-testid={`low-stock-name-${p.id}`}>{p.name}</span>
                  <span className="low-stock-type">{p.product_type}</span>
                </div>
                <span
                  className="stock-badge stock-red"
                  data-testid={`low-stock-qty-${p.id}`}
                >
                  {p.stock_quantity}
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
