import fs from 'fs';
import path from 'path';

// 1. Update index.css for global 3D shadows and larger border-radii
const indexCssPath = path.join(process.cwd(), 'src/index.css');
if (fs.existsSync(indexCssPath)) {
  let indexCss = fs.readFileSync(indexCssPath, 'utf8');
  
  // Replace spacing/radius
  indexCss = indexCss.replace(/--radius-sm:.*?;/g, '--radius-sm: 12px;');
  indexCss = indexCss.replace(/--radius-md:.*?;/g, '--radius-md: 16px;');
  indexCss = indexCss.replace(/--radius-lg:.*?;/g, '--radius-lg: 24px;');
  if (!indexCss.includes('--radius-xl')) {
    indexCss = indexCss.replace(/--radius-lg: 24px;/, '--radius-lg: 24px;\n  --radius-xl: 32px;');
  }

  // Replace shadows for a 3D glass/tech effect
  indexCss = indexCss.replace(/--shadow-sm:.*?;/g, '--shadow-sm: 0 4px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);');
  indexCss = indexCss.replace(/--shadow-md:.*?;/g, '--shadow-md: 0 8px 15px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.1);');
  indexCss = indexCss.replace(/--shadow-lg:.*?;/g, '--shadow-lg: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.15);');
  if (!indexCss.includes('--shadow-glow')) {
    indexCss = indexCss.replace(/--shadow-lg:.*?;/, '$&\n  --shadow-glow: 0 0 20px rgba(0, 174, 239, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);');
  }

  fs.writeFileSync(indexCssPath, indexCss);
}

// 2. Update specific CSS files for extreme rounded borders and 3D shadows
const cssFiles = [
  'src/App.css',
  'src/pages/Inventory.css',
  'src/pages/Catalog.css',
  'src/pages/OrderBuilder.css',
  'src/components/Topbar.css',
  'src/components/Sidebar.css',
  'src/components/BottomNav.css'
];

cssFiles.forEach(file => {
  const filepath = path.join(process.cwd(), file);
  if (fs.existsSync(filepath)) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Update hardcoded 12px or 16px border radii to var(--radius-lg) or var(--radius-xl)
    content = content.replace(/border-radius:\s*(12px|16px|20px);/g, 'border-radius: var(--radius-lg);');
    
    // Ensure product cards have 3D shadows
    content = content.replace(/box-shadow:\s*0 4px 6px[^;]+;/g, 'box-shadow: var(--shadow-md);');
    
    // Ensure hover effects pop with 3D glow
    content = content.replace(/box-shadow:\s*0 10px 25px[^;]+;/g, 'box-shadow: var(--shadow-glow); transform: translateY(-5px) scale(1.02);');

    // Update the main container backgrounds applied previously
    const containers = ['.catalog-page', '.inventory-page', '.dashboard-page', '.order-builder'];
    containers.forEach(container => {
      if (content.includes(container + ' {')) {
        content = content.replace(new RegExp(`box-shadow:\\s*0 0 20px rgba\\(0,0,0,0\\.15\\);\\s*border-radius:\\s*12px;`), 'box-shadow: var(--shadow-lg);\n  border-radius: var(--radius-xl);\n  border: 1px solid rgba(255,255,255,0.05);');
      }
    });

    // Make Topbar floating
    if (file.includes('Topbar.css')) {
      content = content.replace(/border-bottom:\s*1px solid var\(--border\);/, 'border: 1px solid rgba(255,255,255,0.1);\n  border-radius: var(--radius-xl);\n  margin: 16px;\n  box-shadow: var(--shadow-md);');
    }
    
    // Make BottomNav floating
    if (file.includes('BottomNav.css')) {
      content = content.replace(/border-top:\s*1px solid var\(--border\);/, 'border: 1px solid rgba(255,255,255,0.1);\n  border-radius: var(--radius-xl) var(--radius-xl) 0 0;\n  box-shadow: 0 -10px 30px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255, 255, 255, 0.1);');
    }

    fs.writeFileSync(filepath, content);
  }
});
