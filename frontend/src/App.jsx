import React, { useState } from 'react';
import Navigation from './components/Navigation';
import CustomerList from './components/CustomerList';
import ProductList from './components/ProductList';
import OrderList from './components/OrderList';
import Dashboard from './components/Dashboard';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="app">
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />

      <main className="main-content">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'customers' && <CustomerList />}
        {currentView === 'products' && <ProductList />}
        {currentView === 'orders' && <OrderList />}
      </main>
    </div>
  );
}

export default App;
