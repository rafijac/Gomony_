// Script to download 8 unique public domain avatars from DiceBear
const fs = require('fs');
const https = require('https');
const path = require('path');

const seeds = ['alice','bob','carol','dave','eve','frank','grace','heidi'];
const outDir = path.join(__dirname, '../frontend/public/avatars');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

seeds.forEach(seed => {
  const url = `https://api.dicebear.com/7.x/adventurer/png?seed=${seed}`;
  const file = fs.createWriteStream(path.join(outDir, `${seed}.png`));
  https.get(url, res => {
    res.pipe(file);
    file.on('finish', () => file.close());
  });
});

console.log('Avatar download started. Check frontend/public/avatars/ for results.');
