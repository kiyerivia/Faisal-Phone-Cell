const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Ambil token dari environment atau dari file 'token git.txt'
let token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const tokenFile = path.join(__dirname, '../token git.txt');

if (!token && fs.existsSync(tokenFile)) {
  token = fs.readFileSync(tokenFile, 'utf8').trim();
}

if (!token) {
  console.error('\x1b[31m[ERROR]\x1b[0m GitHub Personal Access Token (GH_TOKEN) tidak ditemukan!');
  console.error('Silakan simpan token di file "token git.txt" atau atur environment variable GH_TOKEN.');
  process.exit(1);
}

process.env.GH_TOKEN = token;
console.log('\x1b[32m[INFO]\x1b[0m GitHub Token berhasil dibaca.');
console.log('[INFO] Memulai proses kompilasi & upload rilis ke GitHub Releases...');

try {
  execSync('npm run build && electron-builder --win --publish always', {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('\x1b[32m[SUKSES]\x1b[0m Build dan rilis berhasil dipublikasikan ke GitHub Releases!');
} catch (error) {
  process.exit(error.status || 1);
}
