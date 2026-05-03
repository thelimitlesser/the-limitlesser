import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

function getHtmlEntries() {
  const entries = {};
  const root = resolve(__dirname);
  
  function findHtml(dir, base = '') {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = resolve(dir, file);
      const relativePath = base ? `${base}/${file}` : file;
      
      if (fs.statSync(fullPath).isDirectory()) {
        if (file !== 'node_modules' && file !== 'dist' && !file.startsWith('.')) {
          findHtml(fullPath, relativePath);
        }
      } else if (file.endsWith('.html')) {
        const name = relativePath.replace(/\.html$/, '').replace(/\//g, '_');
        entries[name] = fullPath;
      }
    });
  }
  
  findHtml(root);
  return entries;
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: getHtmlEntries()
    }
  }
});
