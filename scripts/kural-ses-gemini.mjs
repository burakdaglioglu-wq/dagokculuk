// Oyun kural sesleri — Gemini TTS ile "maç spikeri" okuması (v474).
// Anahtar repoya YAZILMAZ: GEMINI_API_KEY ortam değişkeni ya da kullanıcı klasöründeki ~/.dagsk-gemini-key dosyası.
//   node scripts/kural-ses-gemini.mjs ornek [ses1,ses2,...]   → _ses-ornek/<n>-<ses>.mp3 (blok metni, karşılaştırma)
//   node scripts/kural-ses-gemini.mjs hepsi <ses> [tema...]    → public/ses/kural/<tema>.mp3 (sonra dagsk-km-an.js KURAL_SES_V +1)
// ffmpeg PATH'te ya da FFMPEG ortam değişkeninde olmalı. Metinler KURAL (dagsk-km-an.js) ile aynı anlamı taşır, kural uydurulmaz.
import fs from 'fs'; import os from 'os'; import path from 'path'; import { execFileSync } from 'child_process';
const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const ANAHTAR = (process.env.GEMINI_API_KEY || (() => { try { return fs.readFileSync(path.join(os.homedir(), '.dagsk-gemini-key'), 'utf8'); } catch (e) { return ''; } })()).trim();
if (!ANAHTAR) { console.error('Anahtar yok: GEMINI_API_KEY ya da ~/.dagsk-gemini-key'); process.exit(1); }
const FF = process.env.FFMPEG || 'ffmpeg';
const TARZ = 'Heyecanlı bir Türk maç spikeri gibi oku: çocuklardan oluşan bir okçuluk sınıfına sesleniyorsun, enerjik, sıcak, doğal ve akıcı; ünlem cümlelerinde coş, üç noktada kısa bir gerilim beklemesi yap. Metni aynen oku, hiçbir şey ekleme:';
export const SPIKER = {
  topsavasi: 'Korsanlar geliyor! Her iyi ok, korsan gemisine bir top atar! Gemiyi batırın, sıradaki korsan gelsin! Ama dikkat... zayıf seri korsana barut verir. Dört turda bize çarpar! Hazır mısınız?',
  kacis: 'Yelkenler açıldı! Her ok yelkenleri dolduruyor! Zayıf seride korsan yaklaşıyor... Yakalanmadan adaya kaçın! Hadi!',
  filo: 'Herkesin kendi gemisi var! Dokuz ve on atan, arkadan rüzgârı alır! Adaya varan... yıldızı kazanır!',
  catikosu: 'Ninjalar hazır! Her ok ninjanı koşturur! Çatı arasını atlamak için... yarı puan lazım! Kapıya varın!',
  ejderkule: 'Muhafız kapıda! Her ok ona bir shuriken atar! Hep birlikte muhafızı düşürün... ve kuleye tırmanın!',
  zombi: 'Dikkat! Zombiler geliyor! Zayıf seri zombiye yem olur! Kırmızı ve sarı ok... panzehir! İki arkadaş birlikte, ısırılanı kurtarabilir!',
  tahta: 'Takımlar sahada! İyi ok takımını ileri götürür! Sonunda dev taş bekliyor... ve onu bütün takımlar birlikte yıkacak!',
  timsah: 'Şşşt... dev uyuyor. İyi ok kovaya balık atar, nehre taş koyar! Kötü ok gürültü yapar... ve dev uyanır! Dev uyanmadan karşıya geçin!',
  bomba: 'Fitil yanıyor! İyi ok süre kazandırır! İmha ekibi renge atar, o renkteki kablo kesilir! Bütün kablolar kesilince... bomba söner!',
  blok: 'Dikkat dikkat! Karşımızda dev bir canavar var! Hep birlikte vuruyoruz! Sarı ok... kritik vuruş! Ve herkes atınca, canavar yıkılıyor! Hazır mısınız? Başlıyoruz!',
  canavar: 'Arena hazır! Hep birlikte canavarı deviriyoruz! Göğsünde parlayan renge giren ok... iki kat vurur! Başlıyoruz!',
  hapsirik: 'Her ok yaratığı gıdıklıyor! Çubuk dolunca... hapşırır! Ve masal kitabımıza yeni bir sayfa eklenir!'
};
const API = 'https://generativelanguage.googleapis.com/v1beta';
async function modelSec() {
  if (process.env.GEMINI_TTS_MODEL) return process.env.GEMINI_TTS_MODEL;
  const r = await fetch(API + '/models?pageSize=200', { headers: { 'x-goog-api-key': ANAHTAR } }); const j = await r.json();
  if (!r.ok) throw new Error('model listesi: ' + r.status + ' ' + JSON.stringify(j).slice(0, 200));
  const tts = (j.models || []).map((m) => m.name.replace('models/', '')).filter((n) => /tts/i.test(n));
  console.log('TTS modelleri:', tts.join(', '));
  // en yeni sürüm önce; "lite" ve "preview" geride. Kapalı/kotası yoksa oku() sıradakine geçer.
  const puan = (n) => parseFloat((/gemini-(\d+(?:\.\d+)?)/.exec(n) || [0, 0])[1]) * 10 - (/lite/.test(n) ? 5 : 0) - (/preview/.test(n) ? 1 : 0) + (/pro/.test(n) ? 0.5 : 0);
  return tts.sort((a, b) => puan(b) - puan(a));
}
let MODELLER = [];
async function oku(_m, ses, metin, cikti) {
  for (let deneme = 1; ; deneme++) {
    const model = MODELLER[0];
    const r = await fetch(`${API}/models/${model}:generateContent`, { method: 'POST', headers: { 'x-goog-api-key': ANAHTAR, 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: TARZ + '\n\n' + metin }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: ses } } } } }) });
    const j = await r.json();
    const d = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts.find((p) => p.inlineData);
    if (r.ok && d) {
      const pcm = path.join(os.tmpdir(), 'dagsk-tts.pcm'); fs.writeFileSync(pcm, Buffer.from(d.inlineData.data, 'base64'));
      const oran = (/rate=(\d+)/.exec(d.inlineData.mimeType || '') || [0, 24000])[1];
      execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', String(oran), '-ac', '1', '-i', pcm, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-14:TP=-1.5', '-ar', '44100', '-b:a', '96k', cikti]);
      return;
    }
    // ücretsiz katmanda bu model hiç yoksa (kota 0 / izin yok) bir sonrakine geç
    if ((r.status === 403 || (r.status === 429 && /limit: 0|free_tier/i.test(JSON.stringify(j)))) && MODELLER.length > 1) { console.log('  ' + model + ' ücretsiz anahtarda kapalı → ' + MODELLER[1]); MODELLER.shift(); deneme = 0; continue; }
    if (deneme >= 4) throw new Error(ses + ': ' + r.status + ' ' + JSON.stringify(j).slice(0, 300));
    console.log('  tekrar deneniyor (' + r.status + ')…'); await new Promise((ok) => setTimeout(ok, 8000 * deneme)); // ücretsiz katmanda dakika sınırı
  }
}
const [, , kip = 'ornek', a1, ...geri] = process.argv;
const _ms = await modelSec(); MODELLER = Array.isArray(_ms) ? _ms : [_ms]; const model = MODELLER[0]; console.log('model sırası:', MODELLER.join(' → '));
if (kip === 'ornek') {
  const sesler = (a1 || 'Fenrir,Puck,Orus,Sadachbia,Algenib,Charon').split(',');
  const dir = path.join(KOK, '_ses-ornek'); fs.mkdirSync(dir, { recursive: true });
  for (const [i, s] of sesler.entries()) { await oku(model, s, SPIKER.blok, path.join(dir, `${i + 1}-${s}.mp3`)); console.log('✓', i + 1, s); }
} else if (kip === 'hepsi') {
  if (!a1) throw new Error('ses adı gerekli');
  const dir = path.join(KOK, 'public/ses/kural'); const temalar = geri.length ? geri : Object.keys(SPIKER);
  for (const t of temalar) { await oku(model, a1, SPIKER[t], path.join(dir, t + '.mp3')); console.log('✓', t); }
}
