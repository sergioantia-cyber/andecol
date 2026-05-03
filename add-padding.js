import fs from 'fs';
import path from 'path';

const cssFiles = [
  'src/App.css',
  'src/pages/Inventory.css',
  'src/pages/Catalog.css',
  'src/pages/OrderBuilder.css'
];

cssFiles.forEach(file => {
  const filepath = path.join(process.cwd(), file);
  if (fs.existsSync(filepath)) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Lista de contenedores principales
    const containers = ['.catalog-page', '.inventory-page', '.dashboard-page', '.order-builder'];
    
    containers.forEach(container => {
      if (content.includes(container + ' {')) {
        // Encontrar el bloque del contenedor y añadir padding
        // Si ya hay padding, lo reemplazamos
        const regex = new RegExp(`(${container}\\s*{[^}]*)padding[^;]*;?`, 'g');
        content = content.replace(regex, '$1'); // Remover todos los paddings existentes en ese bloque (muy simplificado)
        
        // Mejor aproximación: Usar un regex seguro o solo insertar padding si no está correcto
        content = content.replace(new RegExp(`(${container}\\s*{)`), '$1\n  padding: 40px;\n  margin-bottom: 100px;\n  margin-top: 24px;\n  max-width: 1200px;');
      }
    });

    fs.writeFileSync(filepath, content);
  }
});
