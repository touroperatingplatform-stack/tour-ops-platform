const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'super-admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the exact corrupted line (literal string match)
const corruptedLine = String.raw`<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\s+{/* Navigation Tabs */}\s+<div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">\s+<nav className="flex gap-2 overflow-x-auto p-2">`;

const cleanLines = `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
          <nav className="flex gap-2 overflow-x-auto p-2">`;

content = content.replace(corruptedLine, cleanLines);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed corruption!');
