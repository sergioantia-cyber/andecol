import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Filler, 
  Legend 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const Analytics = ({ inventoryData = [], completedProfiles = {}, onCategoryClick }) => {
  // Calcular datos reales de stock por categoría
  const categories = [...new Set(inventoryData.map(item => item.category))];
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

  const stockValues = categories.map(cat => {
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
  
  // Total acumulado para mostrar volumen
  const totalVolume = stockValues.reduce((a, b) => a + b, 0);
  
  // Colores definidos arriba

  const data = {
    labels: ['', ...categories], // Empezamos con un vacío para que salga de 0
    datasets: [
      {
        fill: true,
        label: 'Stock Actual',
        data: [0, ...stockValues], // El primer valor es 0 para salir de la esquina
        borderColor: '#00f2fe',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(0, 242, 254, 0.3)');
          gradient.addColorStop(1, 'rgba(0, 242, 254, 0)');
          return gradient;
        },
        borderWidth: 3,
        pointRadius: 10,
        pointHoverRadius: 15,
        pointBackgroundColor: (context) => colors[context.dataIndex] || '#fff',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4, // Suaviza la línea
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        if (onCategoryClick) {
          onCategoryClick(categories[index]);
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#1e293b',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return ` Stock: ${context.parsed.y} unidades`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          }
        }
      }
    }
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1 className="trading-title">Análisis de Mercado Andecol</h1>
        <div className="trading-status">
          <span className="live-indicator"></span>
          LIVE MARKET DATA
        </div>
      </div>

      <div className="trading-chart-wrapper">
        <div className="chart-info">
          <div className="info-item">
            <span className="label">TENDENCIA</span>
            <span className="value up">+12.5%</span>
          </div>
          <div className="info-item">
            <span className="label">VOLUMEN</span>
            <span className="value">{totalVolume.toLocaleString()} UN</span>
          </div>
        </div>
        
        <div className="main-chart">
          <Line data={data} options={options} />
        </div>
        
        <div className="chart-legend">
          {categories.map((cat, idx) => (
            <div 
              key={cat} 
              className="legend-item"
              onClick={() => onCategoryClick && onCategoryClick(cat)}
            >
              <span className="dot" style={{ backgroundColor: colors[idx], color: colors[idx] }}></span>
              <span className="name">{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
