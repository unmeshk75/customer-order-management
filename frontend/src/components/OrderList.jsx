import React, { useState, useEffect } from 'react';
import { orderAPI } from '../api';
import OrderForm from './OrderForm';
import Modal from './Modal';

const FILTER_OPTIONS = {
  status: ['Active', 'Completed', 'Cancelled'],
  priority: ['Low', 'Medium', 'High', 'Critical'],
  customer_type: ['Consumer', 'SMB', 'Enterprise'],
};

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [modal, setModal] = useState({ open: false });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ status: [], priority: [], customer_type: [] });

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

  const handleDelete = (order) => {
    setModal({
      open: true,
      type: 'confirm-delete-order',
      title: 'Delete Order',
      message: `Delete Order #${order.id} for ${order.customer_name}? This action cannot be undone.`,
      onConfirm: async () => {
        setModal({ open: false });
        try {
          await orderAPI.delete(order.id);
          await loadOrders();
        } catch (err) {
          setError('Failed to delete order: ' + (err.response?.data?.detail || err.message));
        }
      },
    });
  };

  const handleCreate = () => { setEditingOrder(null); setShowForm(true); };
  const handleEdit = (order) => { setEditingOrder(order); setShowForm(true); };
  const handleFormClose = () => { setShowForm(false); setEditingOrder(null); loadOrders(); };

  const toggleExpand = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleFilter = (group, value) => {
    setActiveFilters(prev => {
      const current = prev[group];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [group]: next };
    });
  };

  const removeChip = (group, value) => {
    setActiveFilters(prev => ({ ...prev, [group]: prev[group].filter(v => v !== value) }));
  };

  const filteredOrders = orders.filter(o => {
    if (activeFilters.status.length > 0 && !activeFilters.status.includes(o.status)) return false;
    if (activeFilters.priority.length > 0 && !activeFilters.priority.includes(o.priority)) return false;
    if (activeFilters.customer_type.length > 0 && !activeFilters.customer_type.includes(o.customer_type)) return false;
    return true;
  });

  const totalActiveFilters = Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0);
  const allChips = Object.entries(activeFilters).flatMap(([group, values]) =>
    values.map(v => ({ group, value: v }))
  );

  const groupLabel = (group) => {
    if (group === 'customer_type') return 'Type';
    return group.charAt(0).toUpperCase() + group.slice(1);
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div data-testid="order-list" className="entity-container">
      <h2>Orders</h2>

      {error && <div id="order-list-error" className="error">{error}</div>}

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
        <div className="orders-layout" data-sidebar-open={sidebarOpen ? 'true' : 'false'}>
          {/* Filter Sidebar */}
          <aside
            className="filter-sidebar"
            data-open={sidebarOpen ? 'true' : 'false'}
            data-testid="filter-sidebar"
          >
            <div className="sidebar-header">
              <h4>Filters</h4>
              <button className="sidebar-close" data-testid="sidebar-close" onClick={() => setSidebarOpen(false)}>
                &times;
              </button>
            </div>
            {Object.entries(FILTER_OPTIONS).map(([group, options]) => (
              <div key={group} className="filter-group" data-filter={group}>
                <h5 className="filter-group-label">
                  {group === 'customer_type' ? 'Customer Type' : group.charAt(0).toUpperCase() + group.slice(1)}
                </h5>
                {options.map(opt => (
                  <label key={opt} className="filter-option" data-value={opt}>
                    <input
                      type="checkbox"
                      data-filter={group}
                      data-value={opt}
                      checked={activeFilters[group].includes(opt)}
                      onChange={() => toggleFilter(group, opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            ))}
          </aside>

          {/* Main content */}
          <div className="orders-main">
            <div className="list-header">
              <button
                id="create-order-btn"
                className="btn-primary"
                onClick={handleCreate}
                data-testid="create-order-btn"
              >
                Create Order
              </button>
              <button
                data-testid="open-filters-btn"
                className="btn-secondary"
                onClick={() => setSidebarOpen(true)}
              >
                Filters{totalActiveFilters > 0 && (
                  <span className="filter-badge">{totalActiveFilters}</span>
                )}
              </button>
            </div>

            {/* Active filter chips */}
            {allChips.length > 0 && (
              <div className="filter-chips" data-testid="filter-chips">
                {allChips.map(({ group, value }) => (
                  <span
                    key={`${group}-${value}`}
                    className="chip"
                    data-filter={group}
                    data-value={value}
                  >
                    <span className="chip-label">{groupLabel(group)}: {value}</span>
                    <button
                      className="chip-remove"
                      data-testid={`remove-chip-${group}-${value}`}
                      onClick={() => removeChip(group, value)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            <table id="orders-table" className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Customer Type</th>
                  <th>Order Date</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Total</th>
                  <th>Discount</th>
                  <th>Final Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const expanded = expandedRows.has(order.id);
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        data-order-id={order.id}
                        data-expanded={expanded ? 'true' : 'false'}
                        className={expanded ? 'row-expanded' : ''}
                      >
                        <td>
                          <button
                            className={`expand-btn${expanded ? ' expanded' : ''}`}
                            data-testid={`expand-row-${order.id}`}
                            onClick={() => toggleExpand(order.id)}
                            aria-expanded={expanded}
                          >
                            {expanded ? '▼' : '▶'}
                          </button>
                        </td>
                        <td data-testid={`order-id-${order.id}`}>{order.id}</td>
                        <td data-testid={`order-customer-${order.id}`}>{order.customer_name}</td>
                        <td data-testid={`order-customer-type-${order.id}`}>{order.customer_type}</td>
                        <td data-testid={`order-date-${order.id}`}>
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td data-testid={`order-status-${order.id}`}>
                          <span className={`status-badge status-${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </td>
                        <td data-testid={`order-priority-${order.id}`}>
                          <span className={`priority-badge priority-${(order.priority || 'medium').toLowerCase()}`}>
                            {order.priority || 'Medium'}
                          </span>
                        </td>
                        <td data-testid={`order-total-${order.id}`}>${order.total_amount.toFixed(2)}</td>
                        <td data-testid={`order-discount-${order.id}`}>
                          {order.discount_percentage > 0 ? `${order.discount_percentage}%` : '-'}
                        </td>
                        <td data-testid={`order-discounted-total-${order.id}`}>
                          ${order.discounted_total.toFixed(2)}
                        </td>
                        <td>
                          <button
                            id={`edit-order-${order.id}`}
                            className="btn-secondary"
                            onClick={() => handleEdit(order)}
                            data-testid={`edit-order-${order.id}`}
                          >
                            Edit
                          </button>
                          <button
                            id={`delete-order-${order.id}`}
                            className="btn-danger"
                            onClick={() => handleDelete(order)}
                            data-testid={`delete-order-${order.id}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>

                      {expanded && (
                        <tr
                          className="detail-row"
                          data-parent-id={order.id}
                          data-testid={`detail-row-${order.id}`}
                        >
                          <td colSpan={11}>
                            <table
                              className="detail-table"
                              data-testid={`detail-table-${order.id}`}
                            >
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
                                {order.products.map(p => (
                                  <tr key={p.product_id} data-product-id={p.product_id}>
                                    <td data-col="product">{p.product_name}</td>
                                    <td data-col="type">{p.product_type}</td>
                                    <td data-col="seats">{p.seats}</td>
                                    <td data-col="unit-price">
                                      {p.unit_price != null ? `$${p.unit_price.toFixed(2)}` : `$${(p.subtotal / p.seats).toFixed(2)}`}
                                    </td>
                                    <td data-col="subtotal" data-testid={`detail-subtotal-${p.product_id}`}>
                                      ${p.subtotal.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <p className="no-data">
                {totalActiveFilters > 0
                  ? 'No orders match the active filters.'
                  : 'No orders found. Create one to get started.'}
              </p>
            )}
          </div>
        </div>
      )}

      {showForm && <OrderForm order={editingOrder} onClose={handleFormClose} />}
    </div>
  );
};

export default OrderList;
