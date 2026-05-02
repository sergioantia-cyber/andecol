import React from 'react';
import logo from '../assets/logo.png';
import './Topbar.css';
import { Bell, User } from 'lucide-react';

const Topbar = () => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="page-title">Panel de Control</h2>
      </div>
      
      <div className="topbar-center">
        <img src={logo} alt="Andecol Logo" className="header-logo" />
      </div>
      
      <div className="topbar-right">
        <button className="icon-btn">
          <Bell size={20} />
          <span className="notification-badge"></span>
        </button>
        <div className="user-profile">
          <div className="avatar">
            <User size={18} />
          </div>
          <span className="user-name">Administrador</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
