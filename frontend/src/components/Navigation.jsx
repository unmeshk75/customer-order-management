import React from 'react';

const Navigation = ({ currentView, setCurrentView }) => {
  return (
    <nav className="navigation">
      <h1>Customer Order Management</h1>
      <div className="nav-buttons">
        <button
          id="nav-customers"
          className={currentView === 'customers' ? 'active' : ''}
          onClick={() => setCurrentView('customers')}
          data-testid="nav-customers"
        >
          Customers
        </button>
        <button
          id="nav-products"
          className={currentView === 'products' ? 'active' : ''}
          onClick={() => setCurrentView('products')}
          data-testid="nav-products"
        >
          Products
        </button>
        <button
          id="nav-orders"
          className={currentView === 'orders' ? 'active' : ''}
          onClick={() => setCurrentView('orders')}
          data-testid="nav-orders"
        >
          Orders
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
