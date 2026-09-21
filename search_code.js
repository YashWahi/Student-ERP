import fs from 'fs';
import path from 'path';

function searchDir(dir, term) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, term);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(term)) {
        console.log(`FOUND "${term}" IN FILE: ${fullPath}`);
      }
    }
  }
}

searchDir('c:/Users/manik/Desktop/erp/school-erp/src', 'AdminLayout');
searchDir('c:/Users/manik/Desktop/erp/school-erp/src', 'StudentLayout');
