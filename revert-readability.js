import fs from 'fs';
import path from 'path';

const indexCssPath = path.join(process.cwd(), 'src/index.css');
let indexCss = fs.readFileSync(indexCssPath, 'utf8');
indexCss = indexCss.replace(/--primary-900: #003061;/g, '--primary-900: #00AEEF;');
fs.writeFileSync(indexCssPath, indexCss);

const cssFiles = [
  'src/App.css',
  'src/pages/Inventory.css',
  'src/pages/Catalog.css'
];

cssFiles.forEach(file => {
  const filepath = path.join(process.cwd(), file);
  if (fs.existsSync(filepath)) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Revert subtitle color back to muted light blue
    content = content.replace(/color:\s*var\(--primary-800\);/g, 'color: var(--text-muted);');

    fs.writeFileSync(filepath, content);
  }
});
