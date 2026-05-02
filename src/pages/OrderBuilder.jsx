import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  FileText, 
  User, 
  Calendar,
  Search,
  ShoppingCart
} from 'lucide-react';
import './OrderBuilder.css';

const OrderBuilder = () => {
  const [items, setItems] = useState([
    { id: 1, name: 'Limpiador de Pisos Industrial', price: 25.50, quantity: 2, total: 51.00 },
    { id: 2, name: 'Escoba Industrial Premium', price: 12.00, quantity: 5, total: 60.00 }
  ]);

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const tax = subtotal * 0.19; // Ejemplo 19% IVA
  const total = subtotal + tax;

  return (
    <div className="order-builder-page">
      <div className="order-header">
        <div className="header-info">
          <h1>Constructor de Pedidos</h1>
          <p className="subtitle">Crea y gestiona remisiones para clientes y servicios.</p>
        </div>
        <div className="order-meta-chips">
          <div className="meta-chip">
            <Calendar size={14} />
            <span>01 May 2026</span>
          </div>
          <div className="meta-chip active">
            <span>Borrador #001</span>
          </div>
        </div>
      </div>

      <div className="order-grid">
        <div className="order-main">
          <div className="client-selector-card">
            <div className="card-header">
              <User size={18} />
              <h3>Información del Cliente</h3>
            </div>
            <div className="client-search">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Buscar cliente por nombre o NIT..." />
            </div>
            <div className="client-details">
              <div className="detail">
                <span className="label">Cliente:</span>
                <span className="value">Edificio Residencial Horizonte</span>
              </div>
              <div className="detail">
                <span className="label">Dirección:</span>
                <span className="value">Calle 45 # 12-34, Bogotá</span>
              </div>
            </div>
          </div>

          <div className="items-card">
            <div className="card-header">
              <ShoppingCart size={18} />
              <h3>Ítems del Pedido</h3>
              <button className="add-item-btn">
                <Plus size={16} /> Añadir Producto
              </button>
            </div>
            
            <div className="items-table-wrapper">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>P. Unitario</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="item-name-cell">{item.name}</div>
                      </td>
                      <td>
                        <input type="number" className="qty-input" value={item.quantity} onChange={() => {}} />
                      </td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>${item.total.toFixed(2)}</td>
                      <td>
                        <button className="delete-item-btn">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="order-summary-sidebar">
          <div className="summary-card">
            <h3>Resumen Financiero</h3>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>IVA (19%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="divider"></div>
              <div className="summary-row total">
                <span>Total Final</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button className="action-btn primary full-width">
              <FileText size={18} /> Generar Remisión
            </button>
            <button className="action-btn outline full-width">
              Guardar como Borrador
            </button>
          </div>

          <div className="notes-card">
            <h3>Notas Internas</h3>
            <textarea placeholder="Agregar observaciones sobre el pedido..."></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBuilder;
