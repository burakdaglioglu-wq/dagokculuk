// milo_ders_havuzu_30.md dosyasini parse edip migrations_milo/0004 icin SQL INSERT satirlari uretir.
// Elle yazilmiyor -- 30 x 5 alan transkripsiyon hatasi riskini onlemek icin otomatik uretiliyor.
const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'milo_ders_havuzu_30.md');
const text = fs.readFileSync(mdPath, 'utf8');

const lessonRe = /\*\*(\d+)\.\s+(.+?)\*\*\s*\n-\s*Kategori:\s*(.+?)\s*·\s*Seviye:\s*(.+?)\s*\n-\s*Açıklama:\s*(.+?)\s*\n-\s*Kazanım:\s*(.+?)\s*\n/g;

function sqlEsc(s) {
  return String(s).replace(/'/g, "''");
}

let match;
let rows = [];
while ((match = lessonRe.exec(text)) !== null) {
  const [, num, baslik, kategori, seviye, aciklama, kazanim] = match;
  const seviyeNorm = seviye.trim().toLocaleLowerCase('tr')
    .replace('başlangıç', 'baslangic').replace('gelişen', 'gelisen').replace('ileri', 'ileri');
  rows.push({ num: num.padStart(2, '0'), baslik: baslik.trim(), kategori: kategori.trim(), seviye: seviyeNorm, aciklama: aciklama.trim(), kazanim: kazanim.trim() });
}

if (rows.length !== 30) {
  console.error(`UYARI: 30 ders beklenirken ${rows.length} ders bulundu. Regex/format kontrol edilmeli.`);
  process.exit(1);
}

const now = Date.now();
let sql = 'INSERT INTO ders_icerikleri (id, tip, baslik, seviye, kategori, kazanim, gruplar_json, aciklama, adimlar_json, dikkat_json, olusturan, olusturulma, guncelleme) VALUES\n';
sql += rows.map((r, i) => {
  const ts = now + i;
  return `  ('havuz_${r.num}', 'hareket', '${sqlEsc(r.baslik)}', '${sqlEsc(r.seviye)}', '${sqlEsc(r.kategori)}', '${sqlEsc(r.kazanim)}', '["genel"]', '${sqlEsc(r.aciklama)}', '[]', '[]', 'sistem', ${ts}, ${ts})`;
}).join(',\n');
sql += ';\n';

console.log(sql);
fs.writeFileSync(path.join(__dirname, '..', 'migrations_milo', '_havuz_seed_generated.sql'), sql, 'utf8');
console.error(`OK: ${rows.length} ders uretildi -> migrations_milo/_havuz_seed_generated.sql`);
