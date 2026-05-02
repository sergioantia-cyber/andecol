import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './MainLayout.css';

const MainLayout = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <div className="main-wrapper">
        <Topbar />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
