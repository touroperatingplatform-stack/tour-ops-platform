const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'super-admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add missing </nav> closing tag
const oldPattern = `        </button>
        </div>
      </div>

      {/* Content */}`;

const newPattern = `        </button>
        </nav>
      </div>
      </div>

      {/* Content */}`;

content = content.replace(oldPattern, newPattern);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Added missing </nav> closing tag!');
