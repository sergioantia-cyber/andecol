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
      // Si la clase existe en el archivo
      if (content.includes(container + ' {')) {
        // Agregamos el background si no existe
        if (!content.match(new RegExp(`${container}\\s*{[^}]*background-color:`))) {
          content = content.replace(new RegExp(`(${container}\\s*{)`), '$1\n  background-color: #19324D;\n  min-height: 100vh;\n  box-shadow: 0 0 20px rgba(0,0,0,0.15);\n  border-radius: 12px;');
        }
      }
    });

    fs.writeFileSync(filepath, content);
  }
});
