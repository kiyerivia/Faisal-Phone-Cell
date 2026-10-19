const fs = require('fs');
const path = require('path');

function installGitHook() {
  const hookDir = path.join(__dirname, '../.git/hooks');
  const hookPath = path.join(hookDir, 'pre-commit');

  const hookContent = `#!/bin/sh
if [ "$SKIP_BUMP" = "1" ]; then
  exit 0
fi

node scripts/bump.js
git add package.json package-lock.json
`;

  try {
    if (fs.existsSync(hookDir)) {
      fs.writeFileSync(hookPath, hookContent, { mode: 0o777 });
      console.log('\x1b[32m[HOOK]\x1b[0m Git pre-commit auto-bump hook aktif di .git/hooks/pre-commit');
    }
  } catch (err) {
    console.warn('[WARN] Tidak dapat memasang git hook otomatis:', err.message);
  }
}

if (require.main === module) {
  installGitHook();
}

module.exports = { installGitHook };
