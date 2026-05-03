import fs from 'fs';
import path from 'path';

// 1. Fix index.css
const indexCssPath = path.join(process.cwd(), 'src/index.css');
let indexCss = fs.readFileSync(indexCssPath, 'utf8');
indexCss = indexCss.replace(/--primary-900:\s*#[0-9a-fA-F]+;\s*\/\*.*?\*\//, '--primary-900: #003061;');
indexCss = indexCss.replace(/--primary-900:\s*#[0-9a-fA-F]+;/, '--primary-900: #003061;');
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
    
    // Change subtitle color to be readable on the bright cyan background
    content = content.replace(/\.subtitle\s*{[^}]*color:\s*var\(--text-muted\);/g, (match) => {
      return match.replace('var(--text-muted)', 'var(--primary-800)');
    });
    
    content = content.replace(/\.subtitle\s*{[^}]*color:\s*[^;]+;/g, (match) => {
      if (!match.includes('var(--primary-800)')) {
        return match.replace(/color:\s*[^;]+;/, 'color: var(--primary-800);');
      }
      return match;
    });

    fs.writeFileSync(filepath, content);
  }
});
