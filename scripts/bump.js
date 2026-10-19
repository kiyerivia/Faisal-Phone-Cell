const fs = require('fs');
const path = require('path');

function bumpPatchVersion() {
  if (process.env.SKIP_BUMP === '1') {
    return null;
  }

  const pkgPath = path.join(__dirname, '../package.json');
  const lockPath = path.join(__dirname, '../package-lock.json');

  if (!fs.existsSync(pkgPath)) {
    console.error('[ERROR] package.json tidak ditemukan.');
    process.exit(1);
  }

  const pkgRaw = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgRaw);
  const currentVersion = pkg.version || '1.0.0';

  const parts = currentVersion.split('.');
  if (parts.length < 3) {
    console.error(`[ERROR] Format versi tidak valid: ${currentVersion}`);
    process.exit(1);
  }

  const major = parseInt(parts[0], 10) || 1;
  const minor = parseInt(parts[1], 10) || 0;
  const patch = parseInt(parts[2], 10) || 0;
  const nextPatch = patch + 1;
  const nextVersion = `${major}.${minor}.${nextPatch}`;

  // 1. Update package.json
  pkg.version = nextVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  // 2. Update package-lock.json jika ada
  if (fs.existsSync(lockPath)) {
    try {
      const lockRaw = fs.readFileSync(lockPath, 'utf8');
      const lock = JSON.parse(lockRaw);
      lock.version = nextVersion;
      if (lock.packages && lock.packages['']) {
        lock.packages[''].version = nextVersion;
      }
      fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n', 'utf8');
    } catch (e) {
      console.warn('[WARN] Gagal memperbarui package-lock.json:', e.message);
    }
  }

  console.log(`\x1b[32m[AUTO-VERSION]\x1b[0m Versi patch berhasil dinaikkan: \x1b[33m${currentVersion}\x1b[0m -> \x1b[32m${nextVersion}\x1b[0m`);
  return { currentVersion, nextVersion };
}

if (require.main === module) {
  bumpPatchVersion();
}

module.exports = { bumpPatchVersion };
