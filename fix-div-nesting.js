const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'super-admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The header section closes BOTH divs but should only close the inner one
// Remove the extra </div> that closes the main wrapper too early
const oldPattern = `        </div>
      </div>

      {/* Tabs */}`;

const newPattern = `        </div>

      {/* Tabs */}`;

content = content.replace(oldPattern, newPattern);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed div nesting - removed premature main wrapper close!');
