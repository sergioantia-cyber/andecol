import React, { useState } from 'react';
import { 
  Users, 
  Trash2, 
  History, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Settings,
  TrendingUp,
  Package,
  Box,
  ShoppingCart,
  BarChart2,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Sidebar.css';

const Sidebar = ({ activeTab, onTabChange }) => {
  const [collapsed, setCollapsed] = useState(true);

  const menuItems = [
    { id: 'dashboard', icon: <TrendingUp size={20} />, label: 'Dashboard' },
    { id: 'catalog', icon: <Package size={20} />, label: 'Catálogo' },
    { id: 'analytics', icon: <BarChart2 size={20} />, label: 'Analítica' },
    { id: 'inventory', icon: <Box size={20} />, label: 'Inventario' },
    { id: 'orders', icon: <ShoppingCart size={20} />, label: 'Pedidos' },
    { id: 'clients', icon: <Users size={20} />, label: 'Clientes' },
    { id: 'waste', icon: <Trash2 size={20} />, label: 'Mermas' },
    { id: 'audit', icon: <History size={20} />, label: 'Auditoría' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleNavClick = (id) => {
    onTabChange && onTabChange(id);
    setCollapsed(true); // auto-close on mobile after selecting
  };

  return (
    <>
      {/* Floating toggle button — always visible outside the panel */}
      {collapsed && (
        <button className="toggle-btn" onClick={() => setCollapsed(false)} aria-label="Abrir menú">
          <ChevronRight size={18} />
        </button>
      )}

      {/* Backdrop: clicking outside closes the panel */}
      {!collapsed && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 199,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(2px)'
          }}
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <span className="brand-name">Andecol</span>
          <button className="toggle-btn" onClick={() => setCollapsed(true)} aria-label="Cerrar menú">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div 
              key={item.id} 
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            <span className="nav-icon"><Settings size={20} /></span>
            <span className="nav-label">Configuración</span>
          </div>
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon"><LogOut size={20} /></span>
            <span className="nav-label">Cerrar Sesión</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
