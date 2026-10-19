const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { bumpPatchVersion } = require('./bump');

console.log('\n==================================================');
console.log('🚀 FAISAL PHONE CELL - AUTO BUMP & DEPLOY PIPELINE');
console.log('==================================================\n');

// 1. Ambil token GitHub jika ada
let token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const tokenFile = path.join(__dirname, '../token git.txt');
if (!token && fs.existsSync(tokenFile)) {
  token = fs.readFileSync(tokenFile, 'utf8').trim();
}
if (token) {
  process.env.GH_TOKEN = token;
}

// 2. Naikkan versi patch di package.json & package-lock.json
const bumpResult = bumpPatchVersion();
if (!bumpResult) {
  console.error('[ERROR] Gagal menaikkan versi.');
  process.exit(1);
}
const { currentVersion, nextVersion } = bumpResult;
console.log(`\x1b[36m[INFO]\x1b[0m Mempersiapkan rilis versi baru: v${nextVersion} (dari v${currentVersion})\n`);

// 3. Git Add & Commit
const userMsg = process.argv.slice(2).join(' ').trim();
const commitMsg = userMsg
  ? `${userMsg} (v${nextVersion})`
  : `chore(release): v${nextVersion} - auto bump patch & deploy`;

try {
  console.log(`\x1b[34m[GIT]\x1b[0m Menambahkan perubahan file & membuat commit...`);
  execSync('git add .', { stdio: 'inherit' });
  
  // Gunakan SKIP_BUMP=1 agar pre-commit hook tidak mendouble-bump
  execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, {
    stdio: 'inherit',
    env: { ...process.env, SKIP_BUMP: '1' }
  });
  console.log(`\x1b[32m[GIT]\x1b[0m Commit tersimpan: "${commitMsg}"`);
} catch (err) {
  console.log('[GIT] Tidak ada perubahan baru untuk di-commit atau commit sudah ada.');
}

// 4. Git Push ke GitHub
try {
  console.log(`\x1b[34m[GIT]\x1b[0m Mendorong (push) commit ke GitHub branch 'main'...`);
  execSync('git push origin main', { stdio: 'inherit' });
  console.log(`\x1b[32m[GIT]\x1b[0m Berhasil push ke origin/main!`);
  
  // Opsional: Buat git tag lokal dan push ke GitHub
  try {
    execSync(`git tag -a v${nextVersion} -m "Release v${nextVersion}"`, { stdio: 'ignore' });
    execSync(`git push origin v${nextVersion}`, { stdio: 'ignore' });
    console.log(`\x1b[32m[GIT]\x1b[0m Tag v${nextVersion} berhasil di-push ke GitHub.`);
  } catch (tagErr) {
    // Abaikan jika tag sudah ada
  }
} catch (err) {
  console.error('\x1b[31m[ERROR]\x1b[0m Gagal push ke GitHub:', err.message);
}

// 5. Build aplikasi (TypeScript + Vite + Electron main/preload)
console.log(`\n\x1b[34m[BUILD]\x1b[0m Mengompilasi aplikasi...`);
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`\x1b[32m[BUILD]\x1b[0m Kompilasi selesai.`);
} catch (err) {
  console.error('\x1b[31m[ERROR]\x1b[0m Gagal melakukan build aplikasi.');
  process.exit(1);
}

// 6. Buat installer Windows (.exe) dan upload jika token valid
console.log(`\n\x1b[34m[PACK]\x1b[0m Mengemas installer Windows (.exe) untuk versi ${nextVersion}...`);
let publishSuccess = false;

if (token) {
  try {
    console.log(`[PACK] Mencoba publikasi otomatis ke GitHub Releases...`);
    execSync('npx electron-builder --win --publish always', {
      stdio: 'inherit',
      env: process.env
    });
    publishSuccess = true;
  } catch (pubErr) {
    console.warn(`\x1b[33m[WARN]\x1b[0m Upload ke GitHub Releases gagal (cek izin token 'contents:write').`);
    console.log(`[PACK] Melanjutkan pembuatan installer offline lokal...`);
    execSync('npx electron-builder --win --x64', {
      stdio: 'inherit',
      env: process.env
    });
  }
} else {
  execSync('npx electron-builder --win --x64', {
    stdio: 'inherit',
    env: process.env
  });
}

console.log('\n==================================================');
console.log(`🎉 SUKSES DEPLOY VERSI \x1b[32mv${nextVersion}\x1b[0m`);
console.log(`📁 File Installer: release/Faisal Phone Cell Setup ${nextVersion}.exe`);
if (publishSuccess) {
  console.log(`🌐 GitHub Release: https://github.com/kiyerivia/Faisal-Phone-Cell/releases/tag/v${nextVersion}`);
}
console.log('==================================================\n');
