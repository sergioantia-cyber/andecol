import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Search, Filter, FileText, Package, AlertCircle, XCircle, RefreshCw, X, ShoppingCart, Share2 } from 'lucide-react';
import './Catalog.css';

const Catalog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Perfiles completados guardados en local storage
  const [completedProfiles, setCompletedProfiles] = useState(() => {
    const saved = localStorage.getItem('andecol_completed_profiles');
    return saved ? JSON.parse(saved) : {};
  });

  const sheetId = '1VpPu3RV4owV8GeFeultha-93ldNrSJEq';
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

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
          
          // Solo mostrar en catálogo los que tienen perfil completado
          const catalogItems = items.filter(item => completedProfiles[item.sku.trim()]?.completed);
          setProducts(catalogItems);
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
  }, []);

  const getStatusBadge = (status) => {
    if (status.includes('Existencia')) return <span className="badge success-badge"><Package size={12} /> En Stock</span>;
    if (status.includes('Bajo')) return <span className="badge warning-badge"><AlertCircle size={12} /> Bajo Stock</span>;
    return <span className="badge danger-badge"><XCircle size={12} /> Sin Stock</span>;
  };

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

      {loading ? (
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
