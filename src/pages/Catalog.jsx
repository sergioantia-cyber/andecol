import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Search, Filter, FileText, Package, AlertCircle, XCircle, RefreshCw, X, ShoppingCart, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Catalog.css';

const Catalog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [rawProducts, setRawProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Perfiles completados sincronizados con Supabase
  const [completedProfiles, setCompletedProfiles] = useState({});
  const [dbLoading, setDbLoading] = useState(false);

  const sheetId = '1VpPu3RV4owV8GeFeultha-93ldNrSJEq';
  const isDev = import.meta.env.DEV;
  // Usar el proxy seguro en producción (Vercel) para evitar SSRF, o el enlace directo en desarrollo local
  const sheetUrl = isDev 
    ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv` 
    : `/api/sheets/inventory?sheetId=${sheetId}`;

  const fetchProducts = () => {
    setLoading(true);
    Papa.parse(sheetUrl, {
      download: true,
      header: true,
      complete: (results) => {
        if (results.data) {
          const items = results.data
            .filter(row => row['ID SKU'] || row['Descripción del Producto'])
            .map(row => ({
              sku: (row['ID SKU'] || 'N/A').trim(),
              name: row['Descripción del Producto'] || 'Sin nombre',
              category: row['Categoría'] || 'General',
              price: row['Precio Unitario (COP)'] || '-',
              stock: row['Cantidad (Unidades)'] || '0',
              status: row['Estado Stock'] || 'Desconocido'
            }));
          
          setRawProducts(items);
        }
        setLoading(false);
      },
      error: (err) => {
        setError('Error al sincronizar catálogo.');
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchProducts();
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
      // Fallback a localStorage
      const saved = localStorage.getItem('andecol_completed_profiles');
      if (saved) setCompletedProfiles(JSON.parse(saved));
    } finally {
      setDbLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status.includes('Existencia')) return <span className="badge success-badge"><Package size={12} /> En Stock</span>;
    if (status.includes('Bajo')) return <span className="badge warning-badge"><AlertCircle size={12} /> Bajo Stock</span>;
    return <span className="badge danger-badge"><XCircle size={12} /> Sin Stock</span>;
  };

  // Filtrar primero por completados y luego por búsqueda
  const products = rawProducts.filter(item => completedProfiles[item.sku.trim()]?.completed);

  const filteredProducts = products.filter(p => {
    const profile = completedProfiles[p.sku.trim()] || {};
    const name = profile.name || p.name;
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.sku.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleOpenDetail = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>Catálogo de Productos</h1>
        <p className="subtitle">Visualización de artículos con perfiles completados.</p>
        
        <div className="search-filter-container">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar producto, SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="filter-btn" onClick={fetchProducts} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {(loading || dbLoading) ? (
        <div className="loading-state-catalog">
          <RefreshCw size={40} className="spinning" />
          <p>Cargando catálogo dinámico...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state-catalog">
          <Package size={60} />
          <p>Aún no hay productos en el catálogo.</p>
          <span>Completa la ficha de un producto en la sección de Inventario para que aparezca aquí.</span>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product, index) => {
            const profile = completedProfiles[product.sku] || {};
            const displayName = profile.name || product.name;
            const displayPhoto = profile.photo || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400';
            const displayDesc = profile.description || 'Sin descripción disponible.';

            return (
              <div key={index} className="product-card" onClick={() => handleOpenDetail(product)}>
                <div className="product-image-container">
                  <img src={displayPhoto} alt={displayName} className="product-image" />
                  <div className="status-overlay">
                    {getStatusBadge(product.status)}
                  </div>
                </div>
                <div className="product-details">
                  <p className="product-sku">SKU: {product.sku}</p>
                  <h3 className="product-name">{displayName}</h3>
                  <p className="product-desc line-clamp-2">{displayDesc}</p>
                  <div className="product-footer">
                    <span className="units-text">
                      {product.stock} unidades
                    </span>
                    <button className="tech-sheet-btn">
                      Ver Detalle <FileText size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle de Producto */}
      {selectedProduct && (
        <div className="detail-modal-overlay" onClick={handleCloseDetail}>
          <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-detail-btn" onClick={handleCloseDetail}>
              <X size={24} />
            </button>
            
            <div className="detail-grid">
              <div className="detail-image-section">
                <img 
                  src={completedProfiles[selectedProduct.sku]?.photo || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400'} 
                  alt={completedProfiles[selectedProduct.sku]?.name || selectedProduct.name} 
                  className="detail-large-image"
                />
              </div>
              
              <div className="detail-info-section">
                <div className="detail-header">
                  <span className="detail-sku-badge">SKU: {selectedProduct.sku}</span>
                  {getStatusBadge(selectedProduct.status)}
                </div>
                
                <h2 className="detail-title">
                  {completedProfiles[selectedProduct.sku]?.name || selectedProduct.name}
                </h2>
                <span className="detail-category">{selectedProduct.category}</span>
                
                <div className="detail-price-section">
                  <span className="detail-price-label">Precio Estimado</span>
                  <span className="detail-price-value">{selectedProduct.price}</span>
                </div>

                <div className="detail-description-box">
                  <h4>Descripción del Producto</h4>
                  <p>{completedProfiles[selectedProduct.sku]?.description || 'Este producto es parte de la línea premium de Andecol, diseñado para ofrecer durabilidad y eficiencia en labores industriales y del hogar.'}</p>
                </div>

                <div className="detail-stock-info">
                  <div className="stock-metric">
                    <span className="metric-num">{selectedProduct.stock}</span>
                    <span className="metric-txt">Unidades Disponibles</span>
                  </div>
                </div>

                <div className="detail-actions-footer">
                  <button className="add-order-btn">
                    <ShoppingCart size={18} /> Agregar a Pedido
                  </button>
                  <button className="share-btn">
                    <Share2 size={18} /> Compartir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
