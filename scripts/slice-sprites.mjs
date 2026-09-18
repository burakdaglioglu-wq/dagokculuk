import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Basit bağlı-bileşen (connected components) dedektörü: alfa kanalına göre şeffaf-olmayan
// bölgeleri bulur, her birinin bounding box'ını çıkarır, ayrı PNG olarak kaydeder. Sprite sheet'in
// düzenli bir grid olup olmadığını varsaymaz (tabela.png düzensiz boyutlarda), her ikisi için de
// aynı yöntem kullanılabilir.
async function sliceSheet(inputPath, outDir, prefix, minRegionSize = 2000) {
  const img = sharp(inputPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const alphaThreshold = 10; // bu değerin altındaki alfa = şeffaf sayılır

  const visited = new Uint8Array(width * height);
  function getAlpha(x, y) {
    const idx = (y * width + x) * channels + (channels - 1);
    return data[idx];
  }

  const regions = [];
  const stackX = new Int32Array(width * height);
  const stackY = new Int32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const vIdx = y * width + x;
      if (visited[vIdx]) continue;
      visited[vIdx] = 1;
      if (getAlpha(x, y) <= alphaThreshold) continue;

      // BFS ile bu bölgeyi doldur.
      let sp = 0;
      stackX[sp] = x; stackY[sp] = y; sp++;
      let minX = x, maxX = x, minY = y, maxY = y, count = 0;
      while (sp > 0) {
        sp--;
        const cx = stackX[sp], cy = stackY[sp];
        count++;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        const neighbors = [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nvIdx = ny * width + nx;
          if (visited[nvIdx]) continue;
          visited[nvIdx] = 1;
          if (getAlpha(nx, ny) <= alphaThreshold) continue;
          stackX[sp] = nx; stackY[sp] = ny; sp++;
        }
      }
      if (count >= minRegionSize) {
        regions.push({ minX, maxX, minY, maxY, count });
      }
    }
  }

  // Soldan sağa, yukardan aşağı sıralama (okuma sırası) - satır bazlı gruplama.
  regions.sort((a, b) => {
    const rowA = Math.round(a.minY / 200), rowB = Math.round(b.minY / 200);
    if (rowA !== rowB) return a.minY - b.minY;
    return a.minX - b.minX;
  });

  console.log(inputPath + ': ' + regions.length + ' bölge bulundu.');
  fs.mkdirSync(outDir, { recursive: true });
  const pad = 6;
  let i = 0;
  const savedFiles = [];
  for (const r of regions) {
    i++;
    const x = Math.max(0, r.minX - pad);
    const y = Math.max(0, r.minY - pad);
    const w = Math.min(width - x, r.maxX - r.minX + 1 + pad * 2);
    const h = Math.min(height - y, r.maxY - r.minY + 1 + pad * 2);
    const outPath = path.join(outDir, `${prefix}-${i}.png`);
    await sharp(inputPath).extract({ left: x, top: y, width: w, height: h }).png().toFile(outPath);
    savedFiles.push({ file: outPath, w, h, count: r.count });
    console.log('  ' + outPath + ' (' + w + 'x' + h + ', piksel sayısı: ' + r.count + ')');
  }
  return savedFiles;
}

const mode = process.argv[2];
const base = 'C:/Users/burak/Desktop/dagsk/public/hayvankarakter';
if (mode === 'hayvan') {
  await sliceSheet(base + '/sevimlihayvan.png', base + '/parcalar', 'hayvan', 3000);
} else if (mode === 'tabela') {
  await sliceSheet(base + '/tabela.png', base + '/parcalar', 'tabela', 3000);
} else {
  console.log('Kullanim: node slice-sprites.mjs hayvan|tabela');
}
