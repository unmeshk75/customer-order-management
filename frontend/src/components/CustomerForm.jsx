import React, { useState, useEffect } from 'react';
import { customerAPI } from '../api';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const CustomerForm = ({ customer, onClose }) => {
  const isEdit = !!customer;

  const [formData, setFormData] = useState({
    name: '',
    customer_type: '',
    email: '',
    phone: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    company_name: '',
    account_status: 'Active',
    contact_preference: 'Email',
  });

  const [stateEnabled, setStateEnabled] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        customer_type: customer.customer_type || '',
        email: customer.email || '',
        phone: customer.phone || '',
        street_address: customer.street_address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip_code: customer.zip_code || '',
        country: customer.country || '',
        company_name: customer.company_name || '',
        account_status: customer.account_status || 'Active',
        contact_preference: customer.contact_preference || 'Email',
      });
      setStateEnabled(customer.country === 'US');
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (e) => {
    const country = e.target.value;
    setFormData(prev => ({
      ...prev,
      country,
      state: country === 'US' ? prev.state : ''
    }));
    setStateEnabled(country === 'US');
  };

  const requiresCompany = formData.customer_type === 'SMB' || formData.customer_type === 'Enterprise';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (requiresCompany && !formData.company_name.trim()) {
      setError('Company Name is required for SMB and Enterprise customers');
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        await customerAPI.update(customer.id, formData);
      } else {
        await customerAPI.create(formData);
      }
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg).join('; '));
      } else {
        setError(detail || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>{isEdit ? 'Edit Customer' : 'Create Customer'}</h3>

      {error && <div id="customer-form-error" className="error">{error}</div>}

      <form id="customer-form" onSubmit={handleSubmit}>
        <fieldset className="form-fieldset">
          <legend>Basic Information</legend>

          <div className="form-group">
            <label htmlFor="customer-name">Name *</label>
            <input
              id="customer-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              data-testid="customer-name-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="customer-type">Customer Type *</label>
            <select
              id="customer-type"
              name="customer_type"
              value={formData.customer_type}
              onChange={handleChange}
              required
              data-testid="customer-type-select"
            >
              <option value="">Select Type</option>
              <option value="Consumer">Consumer</option>
              <option value="SMB">SMB (Small &amp; Medium Business)</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          {requiresCompany && (
            <div className="form-group" data-testid="company-name-group">
              <label htmlFor="customer-company">Company Name *</label>
              <input
                id="customer-company"
                name="company_name"
                type="text"
                value={formData.company_name}
                onChange={handleChange}
                required={requiresCompany}
                placeholder="Enter company or organization name"
                data-testid="customer-company-input"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="customer-email">Email *</label>
            <input
              id="customer-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              data-testid="customer-email-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="customer-phone">Phone</label>
            <input
              id="customer-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., +1-555-123-4567"
              data-testid="customer-phone-input"
            />
          </div>
        </fieldset>

        <fieldset className="form-fieldset">
          <legend>Account Settings</legend>

          <div className="form-group">
            <label htmlFor="customer-account-status">Account Status</label>
            <select
              id="customer-account-status"
              name="account_status"
              value={formData.account_status}
              onChange={handleChange}
              data-testid="customer-account-status-select"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="customer-contact-preference">Contact Preference</label>
            <select
              id="customer-contact-preference"
              name="contact_preference"
              value={formData.contact_preference}
              onChange={handleChange}
              data-testid="customer-contact-preference-select"
            >
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </fieldset>

        <fieldset className="form-fieldset">
          <legend>Address</legend>

          <div className="form-group">
            <label htmlFor="customer-street">Street Address</label>
            <input
              id="customer-street"
              name="street_address"
              type="text"
              value={formData.street_address}
              onChange={handleChange}
              data-testid="customer-street-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customer-city">City</label>
              <input
                id="customer-city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                data-testid="customer-city-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer-zip">ZIP / Postal Code</label>
              <input
                id="customer-zip"
                name="zip_code"
                type="text"
                value={formData.zip_code}
                onChange={handleChange}
                data-testid="customer-zip-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="customer-country">Country</label>
            <input
              id="customer-country"
              name="country"
              type="text"
              value={formData.country}
              onChange={handleCountryChange}
              placeholder="e.g., US, Canada, UK"
              data-testid="customer-country-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="customer-state">State {stateEnabled && '*'}</label>
            {stateEnabled ? (
              <select
                id="customer-state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required={stateEnabled}
                data-testid="customer-state-select"
              >
                <option value="">Select State</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            ) : (
              <input
                id="customer-state"
                name="state"
                type="text"
                value={formData.state}
                disabled
                placeholder="Only for US addresses"
                data-testid="customer-state-input"
              />
            )}
          </div>
        </fieldset>

        <div className="form-actions">
          <button
            id="submit-customer-btn"
            type="submit"
            className="btn-primary"
            disabled={loading}
            data-testid="submit-customer-btn"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Customer' : 'Create Customer')}
          </button>
          <button
            id="cancel-customer-btn"
            type="button"
            className="btn-secondary"
            onClick={onClose}
            data-testid="cancel-customer-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
