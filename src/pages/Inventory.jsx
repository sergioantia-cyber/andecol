import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  Search, 
  Plus, 
  Download, 
  Filter, 
  Package, 
  Droplets, 
  Wrench, 
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Edit3,
  Link,
  ExternalLink,
  X,
  Database,
  CloudUpload
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Inventory.css';

const Inventory = ({ onUpdate, initialCategory = 'Todas las categorías', initialTab = 'nuevos' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState(['Todas las categorías']);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Perfiles completados sincronizados con Supabase
  const [completedProfiles, setCompletedProfiles] = useState({});
  const [dbLoading, setDbLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Estados para el Modal de Completar/Editar Ficha
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [tempName, setTempName] = useState('');
  const [tempPhoto, setTempPhoto] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [tempMaxStock, setTempMaxStock] = useState('');
  const [tempCurrentStock, setTempCurrentStock] = useState('');
  const [tempLowStockAlert, setTempLowStockAlert] = useState('');
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // La URL de exportación de tu Google Sheet
  const [sheetId, setSheetId] = useState(() => localStorage.getItem('andecol_sheet_id') || '1VpPu3RV4owV8GeFeultha-93ldNrSJEq');
  const isDev = import.meta.env.DEV;
  // Usar el proxy seguro en producción (Vercel) para evitar SSRF, o el enlace directo en desarrollo local
  const sheetUrl = isDev 
    ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv` 
    : `/api/sheets/inventory?sheetId=${sheetId}`;
  const sheetViewUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  // Estado del modal de configuración del link
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [tempSheetInput, setTempSheetInput] = useState('');

  const fetchInventoryFromSheets = () => {
    setLoading(true);
    setError(null);

    Papa.parse(sheetUrl, {
      download: true,
      header: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          // Filtrar filas vacías
          const newItems = results.data
            .filter(row => row['ID SKU'] || row['Descripción del Producto'])
            .map(row => {
              return {
                sku: (row['ID SKU'] || 'N/A').trim(),
                name: row['Descripción del Producto'] || 'Sin nombre',
                category: row['Categoría'] || row['Categoria'] || 'Sin categoría',
                price: row['Precio Unitario (COP)'] || '-',
                stock: parseFloat((row['Cantidad (Unidades)'] || '0').toString().replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '')) || 0,
                location: row['Bodega/Pasillo'] || '-',
                status: row['Estado Stock'] || '-',
                icon: <Package size={18} /> // Icono por defecto
              };
            });

          const uniqueCategories = ['Todas las categorías', ...new Set(newItems.map(item => item.category).filter(Boolean))];
          
          setInventoryItems(newItems);
          setCategories(uniqueCategories);
        }
        setLoading(false);
      },
      error: (error) => {
        console.error('Error al descargar el Excel:', error);
        setError('No se pudo acceder al Google Sheet. Asegúrate de que los permisos estén en "Cualquier persona con el enlace".');
        setLoading(false);
        if (onUpdate) onUpdate(); // Notificar al dashboard
      },
    });
  };

  // Sincronizar props con estado interno cuando cambian (para navegación desde Dashboard)
  useEffect(() => {
    setActiveCategory(initialCategory);
    setActiveTab(initialTab);
  }, [initialCategory, initialTab]);

  // Cargar datos al iniciar
  useEffect(() => {
    fetchInventoryFromSheets();
    fetchProfilesFromSupabase();
  }, []);

  const fetchProfilesFromSupabase = async () => {
    setDbLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_profiles')
        .select('*');
      
      if (error) throw error;

      if (data) {
        const profilesMap = {};
        data.forEach(profile => {
          profilesMap[profile.sku] = {
            ...profile,
            completed: true
          };
        });
        setCompletedProfiles(profilesMap);
      }
    } catch (err) {
      console.error('Error al cargar perfiles de Supabase:', err);
      // Fallback a localStorage si falla (opcional)
      const saved = localStorage.getItem('andecol_completed_profiles');
      if (saved) setCompletedProfiles(JSON.parse(saved));
    } finally {
      setDbLoading(false);
    }
  };

  const syncLocalToSupabase = async () => {
    const saved = localStorage.getItem('andecol_completed_profiles');
    if (!saved) {
      alert('No se encontraron datos locales para sincronizar.');
      return;
    }

    const localData = JSON.parse(saved);
    const skus = Object.keys(localData);
    
    if (skus.length === 0) return;

    setLoading(true);
    let successCount = 0;

    for (const sku of skus) {
      const profile = localData[sku];
      try {
        const { error } = await supabase
          .from('product_profiles')
          .upsert({
            sku: sku,
            name: profile.name,
            photo: profile.photo,
            description: profile.description,
            max_stock: parseFloat(profile.maxStock) || 0,
            current_stock: parseFloat(profile.currentStock) || 0,
            low_stock_alert: parseFloat(profile.lowStockAlert) || 10,
            completed: true,
            updated_at: new Date().toISOString()
          });
        
        if (!error) successCount++;
      } catch (err) {
        console.error(`Error sincronizando SKU ${sku}:`, err);
      }
    }

    alert(`Sincronización completada: ${successCount} productos subidos a Supabase.`);
    fetchProfilesFromSupabase();
    setLoading(false);
  };

  const markAsCompleted = async (sku, customData = {}) => {
    const trimmedSku = sku.trim();
    
    // Optimistic UI update
    const updated = {
      ...completedProfiles,
      [trimmedSku]: {
        completed: true,
        ...customData
      }
    };
    setCompletedProfiles(updated);
    
    try {
      const { error } = await supabase
        .from('product_profiles')
        .upsert({
          sku: trimmedSku,
          name: customData.name,
          photo: customData.photo,
          description: customData.description,
          max_stock: parseFloat(customData.maxStock) || 0,
          current_stock: parseFloat(customData.currentStock) || 0,
          low_stock_alert: parseFloat(customData.lowStockAlert) || 10,
          completed: true,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // También guardar en localStorage como respaldo local rápido
      localStorage.setItem('andecol_completed_profiles', JSON.stringify(updated));
    } catch (err) {
      console.error('Error al guardar en Supabase:', err);
      alert('Error al sincronizar con la nube, pero se guardó localmente.');
      localStorage.setItem('andecol_completed_profiles', JSON.stringify(updated));
    }

    setIsModalOpen(false);
    if (onUpdate) onUpdate(); // Actualizar dashboard con el nuevo conteo
  };

  const openCompletionModal = (item, existingData = null) => {
    setEditingItem(item);
    setIsEditingExisting(!!existingData);
    setTempName(existingData?.name || item.name);
    setTempPhoto(existingData?.photo || '');
    setTempDescription(existingData?.description || '');
    setTempMaxStock(existingData?.maxStock || '');
    setTempCurrentStock(existingData?.currentStock || item.stock);
    setTempLowStockAlert(existingData?.lowStockAlert || '10');
    setIsModalOpen(true);
  };

  const handleSaveProfile = () => {
    if (editingItem) {
      markAsCompleted(editingItem.sku, {
        name: tempName,
        photo: tempPhoto,
        description: tempDescription,
        maxStock: tempMaxStock,
        currentStock: tempCurrentStock,
        lowStockAlert: tempLowStockAlert
      });
    }
  };

  const getCompletedData = (sku) => {
    return completedProfiles[sku?.trim()] || null;
  };

  const currentTabItems = inventoryItems.filter(item => {
    const completedData = getCompletedData(item.sku);
    const isCompleted = completedData && completedData.completed;
    return activeTab === 'catalogo' ? isCompleted : !isCompleted;
  });

  const filteredItems = currentTabItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Todas las categorías' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1>Gestión de Inventario (Sincronizado)</h1>
        <p className="subtitle">Conectado en vivo con Google Sheets.</p>
        
        <div className="global-actions">
          <button className="action-btn outline" onClick={syncLocalToSupabase} title="Sincronizar datos locales con la nube">
            <CloudUpload size={18} /> Migrar Datos Locales
          </button>
          <button className="action-btn outline" onClick={() => { setTempSheetInput(sheetViewUrl); setIsSheetModalOpen(true); }}>
            <Link size={18} /> Configurar Excel
          </button>
          <button className="action-btn outline" onClick={fetchInventoryFromSheets} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} /> 
            {loading ? ' Sincronizando...' : ' Sincronizar Excel'}
          </button>
          <button className="action-btn primary">
            <Plus size={18} /> Nuevo Ítem Manual
          </button>
        </div>
      </div>

      <div className="inventory-tabs">
        <button 
          className={`tab-btn ${activeTab === 'nuevos' ? 'active' : ''}`}
          onClick={() => setActiveTab('nuevos')}
        >
          Nuevos por Completar <span className="badge">{inventoryItems.length - Object.keys(completedProfiles).length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'catalogo' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalogo')}
        >
          Catálogo Principal <span className="badge">{Object.keys(completedProfiles).length}</span>
        </button>
      </div>

      {error && (
        <div className="error-banner" style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="search-filter-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por SKU o Nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-section">
          <div className="category-list">
            {categories.map((cat) => (
              <button 
                key={cat} 
                className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="inventory-grid-container">
        {(loading || dbLoading) ? (
          <div className="loading-state">
            <RefreshCw size={32} className="spinning" />
            <p>Sincronizando catálogo desde la nube...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <p>No hay productos para mostrar. Revisa tu archivo de Excel.</p>
          </div>
        ) : (
          <div className="inventory-grid">
            {filteredItems.map((item, index) => {
              const completedData = getCompletedData(item.sku);
              const displayName = completedData?.name || item.name;
              const displayPhoto = completedData?.photo;

              return (
                <div className="product-card" key={index}>
                  <div className="card-top">
                    <span className="sku-badge">{item.sku}</span>
                    <div className={`status-indicator ${item.status === 'En Existencia' ? 'in-stock' : 'out-of-stock'}`}>
                      {item.status}
                    </div>
                  </div>
                  
                  <div className="card-icon-area">
                    {displayPhoto ? (
                      <div className="product-photo-preview">
                        <img src={displayPhoto} alt={displayName} />
                      </div>
                    ) : (
                      <div className="big-icon-bg">
                        {item.icon}
                      </div>
                    )}
                  </div>

                  <div className="card-content">
                    <h3 className="product-title">{displayName}</h3>
                    <span className="category-tag">{item.category}</span>
                  </div>

                  <div className="card-divider"></div>

                  <div className="card-metrics">
                    <div className="metric">
                      <span className="metric-label">Precio (COP)</span>
                      <span className="metric-value price">{item.price}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Inventario</span>
                      <span className={`metric-value stock ${(completedData?.currentStock || item.stock) > 0 ? 'high' : 'low'}`}>
                        {completedData?.currentStock || item.stock}
                      </span>
                    </div>
                  </div>
                  
                  {activeTab === 'nuevos' ? (
                    <button 
                      className="complete-profile-btn" 
                      onClick={() => openCompletionModal(item)}
                    >
                      Completar Ficha (Foto/Nombre)
                    </button>
                  ) : (
                    <button 
                      className="edit-profile-btn" 
                      onClick={() => openCompletionModal(item, completedData)}
                    >
                      <Edit3 size={16} /> Editar Información
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Completar/Editar Ficha */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{isEditingExisting ? 'Editar Ficha del Producto' : 'Completar Ficha'}</h2>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}><PlusCircle style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            
            <div className="modal-body">
              <div className="photo-upload-section">
                <div className="photo-placeholder">
                  {tempPhoto ? <img src={tempPhoto} alt="Preview" /> : <Package size={40} />}
                </div>
                <div className="photo-actions">
                  <label className="photo-btn">
                    {tempPhoto ? 'Cambiar Foto' : 'Subir Foto'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setTempPhoto(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <p className="photo-hint">Selecciona una imagen clara del producto.</p>
                </div>
              </div>

              <div className="form-group">
                <label>Nombre del Producto</label>
                <input 
                  type="text" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Ej: Escoba Premium"
                />
              </div>

              <div className="form-group">
                <label>Descripción Breve</label>
                <textarea 
                  value={tempDescription} 
                  onChange={(e) => setTempDescription(e.target.value)}
                  placeholder="Describe brevemente las características del producto..."
                  rows="3"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '1rem', outline: 'none', resize: 'none' }}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
                <div className="form-group">
                  <label>Stock Actual</label>
                  <input 
                    type="number" 
                    value={tempCurrentStock} 
                    onChange={(e) => setTempCurrentStock(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Stock Máximo</label>
                  <input 
                    type="number" 
                    value={tempMaxStock} 
                    onChange={(e) => setTempMaxStock(e.target.value)}
                    placeholder="Máx"
                  />
                </div>
                <div className="form-group">
                  <label>Alerta Re-producción</label>
                  <input 
                    type="number" 
                    value={tempLowStockAlert} 
                    onChange={(e) => setTempLowStockAlert(e.target.value)}
                    placeholder="Mín"
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button className="save-btn" onClick={handleSaveProfile}>
                  {isEditingExisting ? 'Guardar Cambios' : 'Guardar y Completar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Configurar Link del Excel */}
      {isSheetModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSheetModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link size={20} /> Fuente de Datos — Google Sheets
              </h2>
              <button className="modal-close-btn" onClick={() => setIsSheetModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
                El inventario se sincroniza desde la siguiente hoja de cálculo de Google Sheets. Puedes abrirla o cambiarla pegando un nuevo ID o URL.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  LINK ACTUAL
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <a
                    href={sheetViewUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--primary)', fontSize: '0.8rem', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                  >
                    {sheetViewUrl}
                  </a>
                  <a href={sheetViewUrl} target="_blank" rel="noreferrer" className="action-btn outline" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    <ExternalLink size={14} /> Abrir
                  </a>
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  CAMBIAR A UNA NUEVA HOJA (pega el ID o la URL completa)
                </label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Ej: 1VpPu3RV4owV8GeFeultha-93ldNrSJEq"
                  value={tempSheetInput}
                  onChange={(e) => setTempSheetInput(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: '16px' }}>
              <button className="cancel-btn" onClick={() => setIsSheetModalOpen(false)}>Cancelar</button>
              <button
                className="save-btn"
                onClick={() => {
                  // Extraer el ID de la URL si pegaron la URL completa
                  let newId = tempSheetInput.trim();
                  const match = newId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                  if (match) newId = match[1];
                  if (newId) {
                    localStorage.setItem('andecol_sheet_id', newId);
                    setSheetId(newId);
                  }
                  setIsSheetModalOpen(false);
                }}
              >
                Guardar y Reconectar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
