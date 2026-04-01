import React, { useState, useEffect } from 'react';
import { customerAPI, orderAPI } from '../api';
import CustomerForm from './CustomerForm';
import Modal from './Modal';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [customerOrders, setCustomerOrders] = useState(null); // null = not loaded yet
  const [modal, setModal] = useState({ open: false });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll();
      setCustomers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load customers: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (customer) => {
    setModal({
      open: true,
      type: 'confirm-delete-customer',
      title: 'Delete Customer',
      message: `Delete "${customer.name}"? All associated orders will also be deleted.`,
      onConfirm: async () => {
        setModal({ open: false });
        try {
          await customerAPI.delete(customer.id);
          await loadCustomers();
          setCustomerOrders(null); // reset order cache
        } catch (err) {
          setError('Failed to delete customer: ' + (err.response?.data?.detail || err.message));
        }
      },
    });
  };

  const handleEdit = (customer) => { setEditingCustomer(customer); setShowForm(true); };
  const handleCreate = () => { setEditingCustomer(null); setShowForm(true); };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCustomer(null);
    loadCustomers();
  };

  const toggleExpand = async (id) => {
    const wasExpanded = expandedRows.has(id);
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

    if (!wasExpanded && customerOrders === null) {
      try {
        const res = await orderAPI.getAll();
        // Build a map of customer_id -> orders
        const map = {};
        res.data.forEach(o => {
          if (!map[o.customer_id]) map[o.customer_id] = [];
          map[o.customer_id].push(o);
        });
        setCustomerOrders(map);
      } catch {
        setCustomerOrders({});
      }
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading customers...</div>;

  return (
    <div data-testid="customer-list" className="entity-container">
      <h2>Customers</h2>

      {error && <div id="customer-list-error" className="error">{error}</div>}

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
              id="create-customer-btn"
              className="btn-primary"
              onClick={handleCreate}
              data-testid="create-customer-btn"
            >
              Create Customer
            </button>

            <div className="filter-bar" data-testid="customer-filter-bar">
              <input
                id="customer-search"
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input"
                data-testid="customer-search-input"
              />
              <span className="filter-count">
                Showing {filteredCustomers.length} of {customers.length} customers
              </span>
            </div>
          </div>

          <table id="customers-table" className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Status</th>
                <th>Contact Pref.</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const expanded = expandedRows.has(customer.id);
                const orders = customerOrders?.[customer.id] || [];
                return (
                  <React.Fragment key={customer.id}>
                    <tr
                      data-customer-id={customer.id}
                      data-expanded={expanded ? 'true' : 'false'}
                      className={expanded ? 'row-expanded' : ''}
                    >
                      <td>
                        <button
                          className={`expand-btn${expanded ? ' expanded' : ''}`}
                          data-testid={`expand-row-${customer.id}`}
                          onClick={() => toggleExpand(customer.id)}
                          aria-expanded={expanded}
                        >
                          {expanded ? '▼' : '▶'}
                        </button>
                      </td>
                      <td data-testid={`customer-id-${customer.id}`}>{customer.id}</td>
                      <td data-testid={`customer-name-${customer.id}`}>
                        <div>{customer.name}</div>
                        {customer.company_name && (
                          <div className="customer-company" data-testid={`customer-company-${customer.id}`}>
                            {customer.company_name}
                          </div>
                        )}
                      </td>
                      <td data-testid={`customer-type-${customer.id}`}>{customer.customer_type}</td>
                      <td data-testid={`customer-email-${customer.id}`}>{customer.email}</td>
                      <td data-testid={`customer-phone-${customer.id}`}>{customer.phone || '-'}</td>
                      <td data-testid={`customer-location-${customer.id}`}>
                        {customer.city && customer.country ? `${customer.city}, ${customer.country}` : '-'}
                      </td>
                      <td data-testid={`customer-status-${customer.id}`}>
                        <span className={`status-badge status-${(customer.account_status || 'active').toLowerCase()}`}>
                          {customer.account_status || 'Active'}
                        </span>
                      </td>
                      <td data-testid={`customer-contact-pref-${customer.id}`}>
                        {customer.contact_preference || 'Email'}
                      </td>
                      <td>
                        <button
                          id={`edit-customer-${customer.id}`}
                          className="btn-secondary"
                          onClick={() => handleEdit(customer)}
                          data-testid={`edit-customer-${customer.id}`}
                        >
                          Edit
                        </button>
                        <button
                          id={`delete-customer-${customer.id}`}
                          className="btn-danger"
                          onClick={() => handleDelete(customer)}
                          data-testid={`delete-customer-${customer.id}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>

                    {expanded && (
                      <tr
                        className="detail-row"
                        data-parent-id={customer.id}
                        data-testid={`detail-row-${customer.id}`}
                      >
                        <td colSpan={10}>
                          {orders.length === 0 ? (
                            <p className="no-data" style={{ padding: '0.75rem 1rem', margin: 0 }}>
                              {customerOrders === null ? 'Loading orders...' : 'No orders for this customer.'}
                            </p>
                          ) : (
                            <table
                              className="detail-table"
                              data-testid={`detail-table-${customer.id}`}
                            >
                              <thead>
                                <tr>
                                  <th data-col="order-id">Order ID</th>
                                  <th data-col="date">Date</th>
                                  <th data-col="status">Status</th>
                                  <th data-col="priority">Priority</th>
                                  <th data-col="total">Final Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orders.map(o => (
                                  <tr key={o.id} data-order-id={o.id}>
                                    <td data-col="order-id">#{o.id}</td>
                                    <td data-col="date">{new Date(o.order_date).toLocaleDateString()}</td>
                                    <td data-col="status">
                                      <span className={`status-badge status-${o.status.toLowerCase()}`}>
                                        {o.status}
                                      </span>
                                    </td>
                                    <td data-col="priority">
                                      <span className={`priority-badge priority-${(o.priority || 'medium').toLowerCase()}`}>
                                        {o.priority || 'Medium'}
                                      </span>
                                    </td>
                                    <td data-col="total">${o.discounted_total.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <p className="no-data">
              {searchTerm ? 'No customers match your search.' : 'No customers found. Create one to get started.'}
            </p>
          )}
        </>
      )}

      {showForm && (
        <CustomerForm customer={editingCustomer} onClose={handleFormClose} />
      )}
    </div>
  );
};

export default CustomerList;
