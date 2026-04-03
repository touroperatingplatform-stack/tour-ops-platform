const fs = require('fs');
const path = require('path');

const dir = 'app/admin/(main)';
const tables = ['vehicles', 'tours', 'profiles', 'brands', 'expenses', 'checklists', 'templates', 'guests'];

const files = [];
function walk(d) {
  fs.readdirSync(d, { withFileTypes: true }).forEach(f => {
    const fp = path.join(d, f.name);
    if (f.isDirectory()) walk(fp);
    else if (f.name.endsWith('.tsx')) files.push(fp);
  });
}
walk(dir);

const problems = [];
files.forEach(fp => {
  const c = fs.readFileSync(fp, 'utf8');
  tables.forEach(t => {
    const fromRe = new RegExp(`\\.from\\(['"]${t}['"]\\)`);
    if (fromRe.test(c) && !/\.eq\(['"]company_id['"]/.test(c)) {
      problems.push(`${t} in ${fp.replace(/\\/g, '/')}`);
    }
  });
});

if (problems.length === 0) {
  console.log('All queries have company_id filter');
} else {
  problems.forEach(p => console.log(p));
}
