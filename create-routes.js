const fs = require('fs');
const path = require('path');

const dirs = [
  'app/super-admin/companies',
  'app/super-admin/brands', 
  'app/super-admin/users',
  'app/super-admin/demo',
  'app/super-admin/settings'
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log(`✅ Created ${dir}`);
});
