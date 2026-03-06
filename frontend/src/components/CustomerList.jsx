import React, { useState, useEffect } from 'react';
import { customerAPI } from '../api';
import CustomerForm from './CustomerForm';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? All associated orders will also be deleted.')) {
      return;
    }

    try {
      await customerAPI.delete(id);
      await loadCustomers();
    } catch (err) {
      setError('Failed to delete customer: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCustomer(null);
    loadCustomers();
  };

  if (loading) return <div>Loading customers...</div>;

  return (
    <div data-testid="customer-list" className="entity-container">
      <h2>Customers</h2>

      {error && <div id="customer-list-error" className="error">{error}</div>}

      {!showForm && (
        <>
          <button
            id="create-customer-btn"
            className="btn-primary"
            onClick={handleCreate}
            data-testid="create-customer-btn"
          >
            Create Customer
          </button>

          <table id="customers-table" className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} data-customer-id={customer.id}>
                  <td data-testid={`customer-id-${customer.id}`}>{customer.id}</td>
                  <td data-testid={`customer-name-${customer.id}`}>{customer.name}</td>
                  <td data-testid={`customer-type-${customer.id}`}>{customer.customer_type}</td>
                  <td data-testid={`customer-email-${customer.id}`}>{customer.email}</td>
                  <td data-testid={`customer-phone-${customer.id}`}>{customer.phone || '-'}</td>
                  <td data-testid={`customer-location-${customer.id}`}>
                    {customer.city && customer.country ? `${customer.city}, ${customer.country}` : '-'}
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
                      onClick={() => handleDelete(customer.id)}
                      data-testid={`delete-customer-${customer.id}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {customers.length === 0 && (
            <p className="no-data">No customers found. Create one to get started.</p>
          )}
        </>
      )}

      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default CustomerList;
