const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { bumpPatchVersion } = require('./bump');

async function runDeploy() {
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
    
    // Buat git tag lokal dan push ke GitHub
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

      // Pastikan status release dipublikasikan secara publik (bukan draft)
      try {
        const relRes = await fetch('https://api.github.com/repos/kiyerivia/Faisal-Phone-Cell/releases', {
          headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'DeployPipeline' }
        });
        const rels = await relRes.json();
        const targetRel = Array.isArray(rels) ? rels.find(r => r.tag_name === `v${nextVersion}`) : null;
        if (targetRel && targetRel.draft) {
          await fetch(`https://api.github.com/repos/kiyerivia/Faisal-Phone-Cell/releases/${targetRel.id}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'User-Agent': 'DeployPipeline',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ draft: false })
          });
          console.log(`\x1b[32m[PACK]\x1b[0m Rilis v${nextVersion} berhasil diubah ke mode Live/Publik!`);
        }
      } catch (pubApiErr) {
        // Abaikan jika sudah live
      }
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
    console.log(`✨ Auto-update online sudah aktif untuk semua pengguna!`);
  } else {
    console.log(`\x1b[33m⚠️  CATATAN AUTO-UPDATE ONLINE:\x1b[0m`);
    console.log(`   Installer offline lokal SUDAH BERHASIL dibuat di folder release/`);
    console.log(`   Namun upload ke GitHub Releases belum berhasil karena izin token.`);
    console.log(`   Jalankan: \x1b[36mnpm run check:token\x1b[0m untuk panduan perbaikan token GitHub.`);
  }
  console.log('==================================================\n');
}

if (require.main === module) {
  runDeploy().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
  });
}

module.exports = { runDeploy };
