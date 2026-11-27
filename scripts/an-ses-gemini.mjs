// Oyun spiker sesleri — Gemini TTS, ses "Fenrir" (kullanıcı seçimi, v474). Kotayı az harcamak için TOPLU okutur:
// tek istekte N satır → uzun sessizliklerden N parçaya bölünür (en uzun N-1 sessizlik = sınır; parça sayısı tutmazsa yarıya bölüp yeniden).
//   node scripts/an-ses-gemini.mjs cumle [tema...]   → public/ses/an/<tema>-<k>-<j>.mp3   (dagsk-km-an.js AN_CUMLE)
//   node scripts/an-ses-gemini.mjs ad                → public/ses/ad/<slug>.mp3            (uzak D1: athletes pasif=0, YALNIZ İLK AD)
//   node scripts/an-ses-gemini.mjs kural [tema...]   → public/ses/kural/<tema>.mp3         (kural-ses-gemini.mjs SPIKER)
// Seçenekler: --yeniden (var olanı da üret), --model=<ad> (yoksa GEMINI_TTS_MODEL, yoksa gemini-3.8-flash-tts), --parti=36
// Anahtar: GEMINI_API_KEY ya da ~/.dagsk-gemini-key (repoya yazılmaz). ffmpeg: PATH ya da FFMPEG. Sonra AN_SES_V / AD_SES_V / KURAL_SES_V +1.
import fs from 'fs'; import os from 'os'; import path from 'path'; import { execFileSync, execSync } from 'child_process';
const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const ANAHTAR = (process.env.GEMINI_API_KEY || (() => { try { return fs.readFileSync(path.join(os.homedir(), '.dagsk-gemini-key'), 'utf8'); } catch (e) { return ''; } })()).trim();
if (!ANAHTAR) { console.error('Anahtar yok: GEMINI_API_KEY ya da ~/.dagsk-gemini-key'); process.exit(1); }
const FF = process.env.FFMPEG || 'ffmpeg';
const arg = process.argv.slice(2), sec = Object.fromEntries(arg.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v == null ? true : v]; }));
const [kip, ...temalar] = arg.filter((a) => !a.startsWith('--'));
const MODEL = sec.model || process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts', SES = sec.ses || 'Fenrir', PARTI = Number(sec.parti || { cumle: 14, ad: 14, kural: 4 }[kip] || 14); // model bir istekte en fazla ~60 sn ses veriyor
const TARZ = 'Heyecanlı bir Türk maç spikeri gibi oku: çocuklardan oluşan bir okçuluk sınıfına sesleniyorsun, enerjik, sıcak ve doğal. ACELE ETME: net, anlaşılır, orta tempoda konuş; kelimeleri yutma (v476, kullanıcı: çok hızlı).';
const TALIMAT = {
  cumle: TARZ + ' Aşağıdaki satırları sırayla, her birini ayrı bir spiker repliği gibi oku. Her satırdan sonra BİR SANİYE sus. Satır numarası ya da başka hiçbir şey söyleme:',
  ad: TARZ + ' Aşağıdaki isimleri, sahneye çıkan bir sporcuyu anons eder gibi coşkuyla, her birini bir kez söyle. Her isimden sonra BİR SANİYE sus. Başka hiçbir şey söyleme:',
  kural: TARZ + ' Ünlem cümlelerinde coş, üç noktada kısa bir gerilim beklemesi yap. Aşağıdaki paragrafları sırayla oku, her paragraftan sonra TAM ÜÇ SANİYE sus. Başka hiçbir şey söyleme:'
};
const adSlug = (ad) => String(ad || '').trim().split(/\s+/)[0].toLocaleLowerCase('tr-TR').replace(/[çğıöşüâîû]/g, (c) => ({ 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' }[c])).replace(/[^a-z0-9]/g, '');
const basHarf = (s) => s.toLocaleLowerCase('tr-TR').replace(/^./, (c) => c.toLocaleUpperCase('tr-TR'));

// ---------------------------------------------------------------- iş listesi
function isler() {
  if (kip === 'cumle') {
    const s = fs.readFileSync(path.join(KOK, 'public/dagsk-km-an.js'), 'utf8');
    const C = JSON.parse(s.match(/\/\*AN_CUMLE\*\/const AN_CUMLE = ([\s\S]*?)\/\*AN_CUMLE_SON\*\//)[1]);
    const l = []; for (const [t, kl] of Object.entries(C)) { if (temalar.length && !temalar.includes(t)) continue; kl.forEach((h, k) => h.forEach((m, j) => l.push({ dosya: `public/ses/an/${t}-${k}-${j}.mp3`, metin: m }))); }
    return l;
  }
  if (kip === 'ad') {
    const out = execSync('npx wrangler d1 execute dagsk-db --remote --json --command "SELECT ad FROM athletes WHERE pasif = 0"', { cwd: KOK, encoding: 'utf8', maxBuffer: 1e8 });
    // v476: AD SOYAD (kullanıcı: 'soy isimlerini de söyle'); dosya: ad-soyad slug (uygulamadaki adSlug ile aynı)
    const sade = (w) => w.toLocaleLowerCase('tr-TR').replace(/[çğıöşüâîû]/g, (c) => ({ 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' }[c])).replace(/[^a-z0-9]/g, '');
    const adlar = new Map(); for (const r of JSON.parse(out.slice(out.indexOf('[')))[0].results) { const k = String(r.ad || '').trim().split(/\s+/).filter(Boolean); const sl = k.map(sade).filter(Boolean).join('-'); if (sl && !/^(test|iptal|deneme)/.test(sl) && !adlar.has(sl)) adlar.set(sl, k.map(basHarf).join(' ')); }
    return [...adlar].map(([sl, a]) => ({ dosya: `public/ses/ad/${sl}.mp3`, metin: a + '!' }));
  }
  if (kip === 'kural') {
    const s = fs.readFileSync(path.join(KOK, 'scripts/kural-ses-gemini.mjs'), 'utf8');
    const S = new Function('return ' + s.match(/export const SPIKER = (\{[\s\S]*?\n\});/)[1])();
    return Object.entries(S).filter(([t]) => !temalar.length || temalar.includes(t)).map(([t, m]) => ({ dosya: `public/ses/kural/${t}.mp3`, metin: m }));
  }
  throw new Error('kip: cumle | ad | kural');
}

// ---------------------------------------------------------------- Gemini
let istek = 0;
async function sentez(satirlar) {
  istek++;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, { method: 'POST', headers: { 'x-goog-api-key': ANAHTAR, 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: TALIMAT[kip] + '\n\n' + satirlar.join(kip === 'kural' ? '\n\n' : '\n') }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: SES } } } } }) });
  const j = await r.json(); const d = j?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!r.ok || !d) { const e = new Error(r.status + ' ' + JSON.stringify(j).slice(0, 260)); e.kota = r.status === 429; throw e; }
  const oran = Number((/rate=(\d+)/.exec(d.inlineData.mimeType || '') || [0, 24000])[1]);
  const pcm = path.join(os.tmpdir(), 'dagsk-an.pcm'), wav = path.join(os.tmpdir(), 'dagsk-an.wav');
  fs.writeFileSync(pcm, Buffer.from(d.inlineData.data, 'base64'));
  execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', String(oran), '-ac', '1', '-i', pcm, '-af', 'loudnorm=I=-14:TP=-1.5', '-ar', '44100', wav]);
  return wav;
}
// Bölme: model satır arasında her zaman aynı uzunlukta susmuyor. Bu yüzden N-1 sınırı DP ile seçiyoruz:
// parça süreleri metnin harf sayısıyla orantılı olmalı (log oran karesi cezası) + uzun sessizlik ödüllü. Oran 0.4–2.5 dışındaysa reddedilir.
function bol(wav, metinler) {
  const n = metinler.length, res = require_spawn(wav);
  if (res.sure >= 59) { console.log('  ses 60 sn sınırına dayandı (kesilmiş olabilir)'); if (n > 1) return null; }
  let bas0 = 0, son0 = res.sure; const s = res.sessiz.slice();
  if (s.length && s[0][0] <= 0.05) bas0 = s.shift()[1];
  if (s.length && s[s.length - 1][1] >= res.sure - 0.05) son0 = s.pop()[0];
  if (n === 1) return [[bas0, son0]];
  const c = s.filter(([a, b]) => b - a >= 0.22); if (c.length < n - 1) return null;
  const w = metinler.map((m) => m.replace(/[^\p{L}\p{N}]/gu, '').length + 3), W = w.reduce((a, b) => a + b, 0);
  const enUzun = c.map(([a, b]) => b - a).sort((x, y) => y - x).slice(0, n - 1).reduce((a, b) => a + b, 0), D = (son0 - bas0) - enUzun, bek = w.map((x) => Math.max(0.3, D * x / W));
  const ceza = (dur, i) => { const r = dur / bek[i]; return r <= 0 ? 1e9 : Math.log(r) ** 2; }, odul = (j) => 0.6 * Math.min(c[j][1] - c[j][0], 2.2);
  const m = c.length, INF = 1e18, f = Array.from({ length: n - 1 }, () => new Array(m).fill(INF)), g = Array.from({ length: n - 1 }, () => new Array(m).fill(-1));
  for (let j = 0; j < m; j++) f[0][j] = ceza(c[j][0] - bas0, 0) - odul(j);
  for (let i = 1; i < n - 1; i++) for (let j = i; j < m; j++) for (let p = i - 1; p < j; p++) { if (f[i - 1][p] >= INF) continue; const v = f[i - 1][p] + ceza(c[j][0] - c[p][1], i) - odul(j); if (v < f[i][j]) { f[i][j] = v; g[i][j] = p; } }
  let en = INF, ej = -1; for (let j = n - 2; j < m; j++) { const v = f[n - 2][j] + ceza(son0 - c[j][1], n - 1); if (v < en) { en = v; ej = j; } }
  if (ej < 0) return null;
  const idx = []; for (let i = n - 2, j = ej; i >= 0; j = g[i][j], i--) idx.unshift(j);
  if (idx.some((j) => c[j][1] - c[j][0] < 0.5)) { console.log('  bölme şüpheli (kısa sınır sessizliği)'); return null; } // ad kayması olmasın
  const parca = []; let b = bas0; for (const j of idx) { parca.push([b, c[j][0]]); b = c[j][1]; } parca.push([b, son0]);
  const kotu = parca.findIndex(([a, z], i) => { const r = (z - a) / bek[i]; return r < 0.4 || r > 2.5; });
  if (kotu >= 0) { console.log(`  bölme şüpheli (parça ${kotu + 1}: ${(parca[kotu][1] - parca[kotu][0]).toFixed(2)}s, beklenen ${bek[kotu].toFixed(2)}s)`); return null; }
  return parca;
}
import { spawnSync } from 'child_process';
function require_spawn(wav) {
  const r = spawnSync(FF, ['-hide_banner', '-i', wav, '-af', 'silencedetect=noise=-40dB:d=0.3', '-f', 'null', '-'], { encoding: 'utf8' });
  const t = r.stderr || ''; const sure = Number((/Duration: (\d+):(\d+):([\d.]+)/.exec(t) || []).slice(1).reduce((s, x, i) => s + Number(x) * [3600, 60, 1][i], 0));
  const s = []; let a = null;
  for (const m of t.matchAll(/silence_(start|end): ([\d.]+)/g)) { if (m[1] === 'start') a = Number(m[2]); else if (a != null) { s.push([a, Number(m[2])]); a = null; } }
  if (a != null) s.push([a, sure]);
  return { sure, sessiz: s };
}
function kes(wav, [a, b], dosya) {
  const bas = Math.max(0, a - 0.06), son = b + 0.1; fs.mkdirSync(path.dirname(path.join(KOK, dosya)), { recursive: true });
  execFileSync(FF, ['-y', '-loglevel', 'error', '-i', wav, '-ss', bas.toFixed(3), '-to', son.toFixed(3), '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,afade=t=in:d=0.02', '-ac', '1', '-ar', '44100', '-b:a', '64k', path.join(KOK, dosya)]);
}
async function parti(l) {
  const wav = await sentez(l.map((x) => x.metin));
  try { const h = path.join(KOK, '_ses-ornek/ham'); fs.mkdirSync(h, { recursive: true }); const ad = `${kip}-${Date.now()}`; fs.copyFileSync(wav, path.join(h, ad + '.wav')); fs.writeFileSync(path.join(h, ad + '.json'), JSON.stringify(l)); } catch (e) { } // yeniden bölmek için ham kayıt (gitignore)
  const p = bol(wav, l.map((x) => x.metin));
  if (!p) {
    if (l.length === 1) { const s = require_spawn(wav); kes(wav, [0, s.sure], l[0].dosya); console.log('✓', l[0].dosya); return; }
    const y = Math.ceil(l.length / 2); console.log(`  ${l.length} satır temiz bölünemedi → ${y} + ${l.length - y}`);
    await parti(l.slice(0, y)); await parti(l.slice(y)); return;
  }
  l.forEach((x, i) => kes(wav, p[i], x.dosya)); console.log(`✓ ${l.length} parça (${l[0].dosya} …)`);
}
// yeniden bölme (istek harcamaz): node scripts/an-ses-gemini.mjs bol <kip> → _ses-ornek/ham/<kip>-*.wav dosyalarını yeniden dener
if (kip === 'bol') {
  const h = path.join(KOK, '_ses-ornek/ham'); let ok = 0;
  for (const f of fs.readdirSync(h).filter((x) => x.endsWith('.json') && (!temalar[0] || x.startsWith(temalar[0] + '-')))) {
    const l = JSON.parse(fs.readFileSync(path.join(h, f), 'utf8')).filter((x) => sec.yeniden || !fs.existsSync(path.join(KOK, x.dosya))); const wav = path.join(h, f.replace('.json', '.wav'));
    const tam = JSON.parse(fs.readFileSync(path.join(h, f), 'utf8')); if (l.length !== tam.length) continue; // kısmen kullanılmış partiyi atla
    const p = bol(wav, tam.map((x) => x.metin)); if (!p) { console.log('  bölünemedi:', f); continue; }
    tam.forEach((x, i) => kes(wav, p[i], x.dosya)); ok += tam.length; console.log('✓', f, tam.length);
  }
  console.log('yeniden bölünen:', ok); process.exit(0);
}
const tum = isler(), yap = sec.yeniden ? tum : tum.filter((x) => !fs.existsSync(path.join(KOK, x.dosya)));
console.log(`${kip}: ${tum.length} kayıt, üretilecek ${yap.length} · model ${MODEL} · ses ${SES}`);
try { for (let i = 0; i < yap.length; i += PARTI) await parti(yap.slice(i, i + PARTI)); }
catch (e) { console.error(e.kota ? 'KOTA DOLDU (yarın devam: aynı komut, var olanları atlar): ' : 'HATA: ', e.message); process.exitCode = 2; }
console.log('istek sayısı:', istek);
// uygulama yalnız kaydı olan cümleleri seçsin: public/ses/an/var.json → { tema: [[j...], [j...], [j...]] }
if (kip === 'cumle') {
  const d = path.join(KOK, 'public/ses/an'), v = {};
  for (const f of fs.existsSync(d) ? fs.readdirSync(d) : []) { const m = /^(\w+)-(\d)-(\d+)\.mp3$/.exec(f); if (!m) continue; (v[m[1]] = v[m[1]] || [[], [], []])[+m[2]].push(+m[3]); }
  Object.values(v).forEach((k) => k.forEach((x) => x.sort((a, b) => a - b)));
  fs.writeFileSync(path.join(d, 'var.json'), JSON.stringify(v)); console.log('var.json:', Object.entries(v).map(([t, k]) => t + ' ' + k.map((x) => x.length).join('/')).join(' · '));
}
