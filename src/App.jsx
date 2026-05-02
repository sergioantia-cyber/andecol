import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import MainLayout from './components/MainLayout';
import BottomNav from './components/BottomNav';
import Catalog from './pages/Catalog';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import OrderBuilder from './pages/OrderBuilder';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  RefreshCw
} from 'lucide-react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import './App.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completedProfiles, setCompletedProfiles] = useState({});
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todas las categorías');
  const [targetInventoryTab, setTargetInventoryTab] = useState('nuevos');
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartY = React.useRef(0);
  const PULL_THRESHOLD = 70;

  useEffect(() => {
    // Verificar la sesión consultando el endpoint que lee la cookie HttpOnly
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/user');
        const data = await res.json();
        setSession(data.user ? { user: data.user } : null);
      } catch (err) {
        console.error('Error fetching session', err);
        setSession(null);
      }
    };
    
    checkSession();
  }, []);

  const sheetId = localStorage.getItem('andecol_sheet_id') || '1VpPu3RV4owV8GeFeultha-93ldNrSJEq';
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  const fetchData = () => {
    setLoading(true);
    const saved = localStorage.getItem('andecol_completed_profiles');
    const profiles = saved ? JSON.parse(saved) : {};
    setCompletedProfiles(profiles);

    Papa.parse(sheetUrl, {
      download: true,
      header: true,
      complete: (results) => {
        if (results.data) {
          const items = results.data
            .filter(row => row['ID SKU'] || row['Descripción del Producto'])
            .map(row => {
              const rawStock = row['Cantidad (Unidades)'] || '0';
              const cleanStock = rawStock.toString().replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
              const numericStock = parseFloat(cleanStock) || 0;
              return {
                sku: row['ID SKU'] || 'N/A',
                name: row['Descripción del Producto'] || 'Sin nombre',
                category: row['Categoría'] || 'General',
                stock: numericStock,
                status: row['Estado Stock'] || 'Desconocido'
              };
            });
          setInventoryData(items);
        }
        setLoading(false);
      },
      error: () => setLoading(false)
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalStock = inventoryData.reduce((acc, item) => {
    const profile = completedProfiles[item.sku];
    const actualStock = (profile && profile.currentStock !== undefined && profile.currentStock !== '') 
      ? parseFloat(profile.currentStock) 
      : item.stock;
    return acc + actualStock;
  }, 0);
  
  const lowStockItems = inventoryData.filter(item => {
    const profile = completedProfiles[item.sku];
    const threshold = profile?.lowStockAlert ? parseInt(profile.lowStockAlert) : 10;
    return item.stock < threshold;
  }).length;

  const completedCount = Object.keys(completedProfiles).length;
  const pendingCount = inventoryData.filter(item => !completedProfiles[item.sku]?.completed).length;

  const stats = [
    { label: 'Stock Total', value: totalStock.toLocaleString(), icon: <Package />, color: '#0ea5e9' },
    { label: 'Por Completar', value: pendingCount, icon: <RefreshCw />, color: '#f59e0b' },
    { label: 'Alertas Stock', value: lowStockItems, icon: <AlertTriangle />, color: '#ef4444' },
    { label: 'Catálogo Activo', value: completedCount, icon: <TrendingUp />, color: '#10b981' },
  ];

  const categories = [...new Set(inventoryData.map(item => item.category))];
  const stockByCategory = categories.map(cat => {
    return inventoryData
      .filter(item => item.category === cat)
      .reduce((acc, item) => {
        const profile = completedProfiles[item.sku];
        const actualStock = (profile && profile.currentStock !== undefined && profile.currentStock !== '') 
          ? parseFloat(profile.currentStock) 
          : item.stock;
        return acc + actualStock;
      }, 0);
  });

  const colors = [
    '#0ea5e9', // Recogedores (Cyan)
    '#ef4444', // Escobas (Red)
    '#22c55e', // Baldes (Green)
    '#f59e0b', // Escurridores (Amber)
    '#8b5cf6', // Cepillos (Purple)
    '#ec4899', // Traperos (Pink)
    '#64748b', // Palos (Slate)
    '#eab308'  // Mobiliario (Yellow)
  ];

  const chartData = {
    labels: ['', ...categories],
    datasets: [{
      label: 'Unidades en Stock',
      data: [0, ...stockByCategory],
      fill: true,
      borderColor: '#0ea5e9',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(14, 165, 233, 0.4)');
        gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
        return gradient;
      },
      borderWidth: 3,
      pointRadius: 8,
      pointHoverRadius: 12,
      pointBackgroundColor: (context) => {
        const index = context.dataIndex;
        return index === 0 ? 'transparent' : (colors[index - 1] || '#fff');
      },
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      tension: 0.4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
      axis: 'x',
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        if (index > 0) {
          const category = categories[index - 1];
          setSelectedCategoryFilter(category);
          setActiveTab('inventory');
          setTargetInventoryTab('catalogo');
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#0ea5e9',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex;
            if (idx > 0) return categories[idx - 1];
            return '';
          },
          label: (item) => `Stock: ${item.raw.toLocaleString()} uds`,
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: 'rgba(255, 255, 255, 0.05)', borderDash: [5, 5] },
        ticks: { color: '#94a3b8', font: { size: window.innerWidth < 640 ? 7 : 10 } }
      },
      x: { 
        grid: { display: false },
        ticks: { 
          color: '#94a3b8', 
          font: { size: window.innerWidth < 640 ? 7 : 10 }, 
          maxRotation: window.innerWidth < 640 ? 45 : 0, 
          autoSkip: true 
        }
      }
    }
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="dashboard-header">
              <h1 className="welcome-text">Andecol - Dashboard Real</h1>
              <p className="subtitle">Resumen operativo basado en tu inventario actual.</p>
            </div>
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">{stat.label}</span>
                    <span className="stat-value">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="dashboard-content">
              <div className="content-card dashboard-chart-card trading-style">
                <div className="card-header-flex">
                  <div className="trading-header-left">
                    <h3 className="trading-title-mini">Tendencia de Stock</h3>
                    <div className="trading-status-mini">
                      <span className="live-indicator"></span>
                      LIVE MARKET DATA
                    </div>
                  </div>
                </div>

                <div className="chart-info-mini">
                  <div className="info-item-mini">
                    <span className="label">TENDENCIA</span>
                    <span className="value up">+12.5%</span>
                  </div>
                  <div className="info-item-mini">
                    <span className="label">VOLUMEN</span>
                    <span className="value">{totalStock.toLocaleString()} UN</span>
                  </div>
                </div>

                <div className="chart-container">
                  <Line data={chartData} options={chartOptions} />
                </div>

                <div className="chart-legend-frames">
                  {categories.map((cat, idx) => (
                    <div 
                      key={cat} 
                      className="legend-frame-trading" 
                      onClick={() => {
                        setSelectedCategoryFilter(cat);
                        setActiveTab('inventory');
                        setTargetInventoryTab('catalogo');
                      }}
                    >
                      <span className="dot" style={{ backgroundColor: colors[idx] || '#fff', boxShadow: `0 0 10px ${colors[idx] || '#fff'}` }}></span>
                      <span className="name">{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="content-card side-list">
                <h3>Resumen de Flujo</h3>
                <div className="workflow-summary">
                  <div className="workflow-item">
                    <div className="wf-icon pending"><Package size={18} /></div>
                    <div className="wf-text">
                      <p><strong>{pendingCount} Productos</strong> en espera</p>
                      <span>Nuevos en Excel por completar ficha.</span>
                    </div>
                  </div>
                  <div className="workflow-item">
                    <div className="wf-icon completed"><TrendingUp size={18} /></div>
                    <div className="wf-text">
                      <p><strong>{completedCount} Productos</strong> en Catálogo</p>
                      <span>Listos para mostrar a clientes.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case 'catalog':
        return <Catalog />;
      case 'analytics':
        return (
          <Analytics 
            inventoryData={inventoryData} 
            completedProfiles={completedProfiles} 
            onCategoryClick={(category) => {
              setSelectedCategoryFilter(category);
              setActiveTab('inventory');
              setTargetInventoryTab('catalogo');
            }}
          />
        );
      case 'inventory':
        return <Inventory onUpdate={fetchData} initialCategory={selectedCategoryFilter} initialTab={targetInventoryTab} />;
      case 'orders':
        return <OrderBuilder />;
      default:
        return <Catalog />;
    }
  };

  if (!session) {
    return <Login onLogin={(user) => setSession({ user })} />;
  }

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === 0) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0 && diff < PULL_THRESHOLD * 1.5) {
      setPullY(Math.min(diff, PULL_THRESHOLD));
    }
  };

  const handleTouchEnd = () => {
    if (pullY >= PULL_THRESHOLD) {
      setPulling(true);
      fetchData();
      setTimeout(() => setPulling(false), 1000);
    }
    setPullY(0);
    touchStartY.current = 0;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative' }}
    >
      {/* Indicador de Pull-to-Refresh */}
      {(pullY > 10 || pulling) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          height: '56px',
          background: 'linear-gradient(to bottom, rgba(2,6,23,0.95), transparent)',
          gap: '8px',
          color: '#0ea5e9',
          fontSize: '0.75rem',
          fontWeight: '700',
          letterSpacing: '0.05em',
          pointerEvents: 'none'
        }}>
          <RefreshCw size={16} style={{ animation: pulling ? 'spin 0.8s linear infinite' : `rotate(${(pullY / PULL_THRESHOLD) * 360}deg)` }} />
          {pulling ? 'ACTUALIZANDO...' : 'SUELTA PARA ACTUALIZAR'}
        </div>
      )}
      <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </MainLayout>
    </div>
  );
}

export default App;
