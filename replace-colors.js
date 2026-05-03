import fs from 'fs';
import path from 'path';

const cssFiles = [
  'src/index.css',
  'src/App.css',
  'src/components/Topbar.css',
  'src/components/Sidebar.css',
  'src/components/BottomNav.css',
  'src/pages/Login.css',
  'src/pages/Inventory.css',
  'src/pages/Catalog.css',
  'src/pages/OrderBuilder.css'
];

cssFiles.forEach(file => {
  const filepath = path.join(process.cwd(), file);
  if (fs.existsSync(filepath)) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Cambiar `background: white;` y similares
    content = content.replace(/background(-color)?:\s*(white|#fff|#ffffff|#FFF|#FFFFFF);/g, 'background$1: var(--bg-card);');
    
    // Cambiar `color: white;` y similares por `--text-main` cuando no es fondo
    content = content.replace(/color:\s*(white|#fff|#ffffff|#FFF|#FFFFFF);/g, 'color: var(--text-main);');

    fs.writeFileSync(filepath, content);
  }
});
