// Đóng gói web/ -> www/ cho Capacitor.
// - Copy mọi trang .html trong web/ (index, SaoTuVi, KinhDich, gioi-thieu)
// - Chèn app.css + ad-config.js + app.js vào từng trang (KHÔNG sửa logic gốc)
// - Thêm viewport-fit=cover để vùng tai thỏ/thanh hệ thống hiển thị đúng
// - Thay ID quảng cáo bằng biến môi trường ADMOB_BANNER_ID / ADMOB_REWARDED_ID (nếu có)
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'web');
const APP = join(ROOT, 'app');
const OUT = join(ROOT, 'www');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'app'), { recursive: true });

const idRe = /^ca-app-pub-\d+\/\d+$/;
const banner = (process.env.ADMOB_BANNER_ID || '').trim();
const rewarded = (process.env.ADMOB_REWARDED_ID || '').trim();
for (const [k, v] of [['ADMOB_BANNER_ID', banner], ['ADMOB_REWARDED_ID', rewarded]]) {
  if (v && !idRe.test(v)) { console.error(`✖ ${k} sai định dạng (cần ca-app-pub-xxxxxxxx/yyyyyyyy)`); process.exit(1); }
}
let cfg = readFileSync(join(APP, 'ad-config.js'), 'utf8')
  .replace("'__BANNER_ID__'", `'${banner || 'TEST'}'`)
  .replace("'__REWARDED_ID__'", `'${rewarded || 'TEST'}'`);
writeFileSync(join(OUT, 'app', 'ad-config.js'), cfg);
copyFileSync(join(APP, 'app.js'), join(OUT, 'app', 'app.js'));
copyFileSync(join(APP, 'app.css'), join(OUT, 'app', 'app.css'));

const pages = readdirSync(WEB).filter(f => f.toLowerCase().endsWith('.html'));
if (!pages.includes('index.html')) { console.error('✖ Thiếu web/index.html'); process.exit(1); }

for (const p of pages) {
  let html = readFileSync(join(WEB, p), 'utf8');
  html = html.replace(/<meta\s+name="viewport"\s+content="([^"]*)"/i, (m, c) =>
    c.includes('viewport-fit') ? m : `<meta name="viewport" content="${c}, viewport-fit=cover"`);
  const head = '<link rel="stylesheet" href="app/app.css">\n';
  const tail = '\n<script src="app/ad-config.js"></script>\n<script src="app/app.js"></script>\n';
  html = html.replace(/<\/head>/i, head + '</head>');
  const i = html.toLowerCase().lastIndexOf('</body>');
  html = i >= 0 ? html.slice(0, i) + tail + html.slice(i) : html + tail;
  writeFileSync(join(OUT, p), html);
}

console.log(`✔ www/ gồm ${pages.length} trang: ${pages.join(', ')}`);
console.log(`✔ Quảng cáo: ${banner && rewarded ? 'ID THẬT' : 'ID THỬ NGHIỆM của Google'}`);
