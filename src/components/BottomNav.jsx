import React from 'react';
import { LayoutDashboard, ShoppingBag, Package, Truck, LineChart } from 'lucide-react';
import './BottomNav.css';

const BottomNav = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'catalog', icon: <ShoppingBag size={20} />, label: 'Catálogo' },
    { id: 'inventory', icon: <Package size={20} />, label: 'Inventario' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button 
          key={item.id} 
          className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => onTabChange(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
