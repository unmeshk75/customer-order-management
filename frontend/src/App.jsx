import React, { useState } from 'react';
import Navigation from './components/Navigation';
import CustomerList from './components/CustomerList';
import ProductList from './components/ProductList';
import OrderList from './components/OrderList';

function App() {
  const [currentView, setCurrentView] = useState('customers');

  return (
    <div className="app">
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />

      <main className="main-content">
        {currentView === 'customers' && <CustomerList />}
        {currentView === 'products' && <ProductList />}
        {currentView === 'orders' && <OrderList />}
      </main>
    </div>
  );
}

export default App;
