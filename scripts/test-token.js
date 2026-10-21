const fs = require('fs');
const path = require('path');

async function testToken() {
  console.log('\n==================================================');
  console.log('🔍 CEK IZIN TOKEN GITHUB (GITHUB RELEASES)');
  console.log('==================================================\n');

  const tokenFile = path.join(__dirname, '../token git.txt');
  if (!fs.existsSync(tokenFile)) {
    console.error('❌ File "token git.txt" tidak ditemukan di root folder project.');
    process.exit(1);
  }

  const token = fs.readFileSync(tokenFile, 'utf8').trim();
  if (!token) {
    console.error('❌ Isi file "token git.txt" kosong.');
    process.exit(1);
  }

  console.log('1. Memeriksa validitas user GitHub...');
  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'TokenChecker'
      }
    });

    if (userRes.status === 401) {
      console.error('❌ Token tidak valid atau sudah kedaluwarsa (401 Unauthorized).');
      return;
    }

    const userData = await userRes.json();
    console.log(`✅ Login sebagai user GitHub: \x1b[32m@${userData.login}\x1b[0m`);

    console.log('\n2. Memeriksa akses ke repository kiyerivia/Faisal-Phone-Cell...');
    const repoRes = await fetch('https://api.github.com/repos/kiyerivia/Faisal-Phone-Cell', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'TokenChecker'
      }
    });

    if (repoRes.status !== 200) {
      console.error(`❌ Tidak dapat mengakses repository (HTTP ${repoRes.status}).`);
      return;
    }
    console.log('✅ Berhasil mengakses repository.');

    console.log('\n3. Menguji izin pembuatan / rilis GitHub Releases (Contents: write)...');
    // Coba request pembuatan draft rilis dummy untuk tes izin
    const testReleaseRes = await fetch('https://api.github.com/repos/kiyerivia/Faisal-Phone-Cell/releases', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'TokenChecker',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tag_name: '__temp_token_permission_test__',
        name: 'Test Permission Token',
        draft: true
      })
    });

    const testData = await testReleaseRes.json();

    if (testReleaseRes.status === 403 || testReleaseRes.status === 404) {
      console.log('\n\x1b[31m[STATUS: GAGAL / IZIN KURANG]\x1b[0m');
      console.log('Penyebab: Token belum diberi izin "Contents: Read and write" di GitHub.');
      console.log('Pesan GitHub:', testData.message || JSON.stringify(testData));
      console.log('\n\x1b[33m[CARA MEMPERBAIKI]:\x1b[0m');
      console.log('1. Buka: https://github.com/settings/tokens');
      console.log('2. Jika memakai Fine-grained Personal Access Token:');
      console.log('   - Pilih token Anda');
      console.log('   - Pada "Repository access", pilih repository: Faisal-Phone-Cell');
      console.log('   - Pada "Permissions" -> "Repository permissions" -> cari "Contents" -> pilih "Read and write"');
      console.log('   - Simpan (Save Changes).');
      console.log('3. Atau jika memakai Classic Token: Beri centang pada scope "repo".');
      console.log('4. Salin token baru tersebut dan paste ke file "token git.txt".');
      console.log('5. Jalankan kembali: node scripts/test-token.js\n');
      return;
    }

    if (testReleaseRes.status === 201) {
      // Hapus kembali draft release pengujian
      await fetch(`https://api.github.com/repos/kiyerivia/Faisal-Phone-Cell/releases/${testData.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'TokenChecker'
        }
      });
      console.log('\n\x1b[32m🎉 SEMPURNA! Token memiliki izin penuh untuk membuat GitHub Releases!\x1b[0m');
      console.log('Perintah "npm run deploy" sekarang akan berhasil mengunggah file auto-update online.\n');
    } else {
      console.log('Status respon:', testReleaseRes.status, testData);
    }
  } catch (err) {
    console.error('Error saat menghubungi GitHub API:', err.message);
  }
}

testToken();
