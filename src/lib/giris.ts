// Giriş sistemi çekirdeği (2026-09-27). Eski sistemde PIN'in SHA-256 özeti hem herkese açık bir GET ile
// dağıtılıyor hem de yazma yetkisinin KENDİSİ olarak kabul ediliyordu (özeti bilen PIN'siz yazabiliyordu).
// Yeni sistem:
//  - PIN'ler kişiye özel, PBKDF2 (tuzlu) ile saklanır ve ASLA istemciye gönderilmez.
//  - Doğru PIN'e karşılık rastgele bir oturum anahtarı verilir; sunucu yalnızca anahtarın SHA-256 özetini tutar.
//  - Yanlış denemeler IP ve kullanıcı bazında sunucuda sayılır, artan sürelerle kilitlenir.
//  - Passkey (parmak izi / Face ID) ile giriş: WebAuthn, "none" attestation, ES256/RS256 doğrulama.
// Hem okçuluk (DB) hem Milo (DB_MILO) aynı kodu kullanır — tablo adları aynı, veritabanı farklı.

export const OTURUM_BASLIGI = "x-dagsk-oturum";
const GUN = 24 * 60 * 60 * 1000;
export const HATIRLA_SURE = 30 * GUN;
export const KISA_SURE = 12 * 60 * 60 * 1000;
export const YETKI_TAZE_SURE = 15 * 60 * 1000;
const PBKDF2_TUR = 20000;
const enc = new TextEncoder();

export interface Oturum {
  tokenOzet: string;
  kullaniciId: number;
  ad: string;
  rol: "yonetici" | "egitmen";
  hatirla: boolean;
  bitis: number;
  yetkiZamani: number;
  cihaz: string | null;
}

// ---- küçük yardımcılar ----
export function hex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexBytes(h: string): Uint8Array {
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}
export function b64uBytes(s: string): Uint8Array {
  const b = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export function bytesB64u(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function rastgele(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}
export async function sha256Hex(s: string | Uint8Array): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", typeof s === "string" ? enc.encode(s) : s));
}
function esitMi(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let fark = 0;
  for (let i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return fark === 0;
}

// ---- PIN ----
export async function pinOzetle(pin: string): Promise<string> {
  const tuz = rastgele(16);
  return "pbkdf2$" + PBKDF2_TUR + "$" + hex(tuz) + "$" + (await pbkdf2(pin, tuz, PBKDF2_TUR));
}
async function pbkdf2(pin: string, tuz: Uint8Array, tur: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: tuz, iterations: tur }, key, 256));
}
export async function pinDogruMu(pin: string, kayit: string): Promise<boolean> {
  const p = kayit.split("$");
  if (p.length !== 4 || p[0] !== "pbkdf2") return false;
  return esitMi(await pbkdf2(pin, hexBytes(p[2]), parseInt(p[1], 10)), p[3]);
}
// 6-12 haneli rakam ya da en az 8 karakterlik şifre. Çok tahmin edilebilir PIN'ler reddedilir.
export function pinKuraliHatasi(pin: string): string | null {
  if (typeof pin !== "string") return "PIN gerekli";
  if (/^\d+$/.test(pin)) {
    if (pin.length < 6 || pin.length > 12) return "PIN 6-12 haneli olmalı";
    if (/^(\d)\1+$/.test(pin)) return "Hepsi aynı rakam olan PIN kullanılamaz";
    const artan = "01234567890123", azalan = "98765432109876";
    if (artan.includes(pin) || azalan.includes(pin)) return "Sıralı rakamlar (123456 gibi) kullanılamaz";
    return null;
  }
  if (pin.length < 8) return "Şifre en az 8 karakter olmalı (ya da 6+ haneli PIN)";
  if (pin.length > 64) return "Şifre çok uzun";
  return null;
}

// ---- deneme sınırı ----
function kilitSuresi(sayi: number): number {
  if (sayi >= 15) return 60 * 60 * 1000;
  if (sayi >= 10) return 15 * 60 * 1000;
  if (sayi >= 8) return 5 * 60 * 1000;
  if (sayi >= 5) return 60 * 1000;
  return 0;
}
export async function kilitKalan(db: D1Database, anahtarlar: string[]): Promise<number> {
  const now = Date.now();
  let kalan = 0;
  for (const a of anahtarlar) {
    const r = await db.prepare("SELECT kilit_bitis FROM giris_denemeleri WHERE anahtar = ?").bind(a).first<{ kilit_bitis: number }>();
    if (r && r.kilit_bitis > now) kalan = Math.max(kalan, r.kilit_bitis - now);
  }
  return kalan;
}
export async function basarisizKaydet(db: D1Database, anahtarlar: string[]): Promise<void> {
  const now = Date.now();
  for (const a of anahtarlar) {
    const r = await db.prepare("SELECT sayi, son_deneme FROM giris_denemeleri WHERE anahtar = ?").bind(a).first<{ sayi: number; son_deneme: number }>();
    // 6 saat hiç yanlış deneme yoksa sayaç sıfırdan başlar.
    const sayi = (r && now - r.son_deneme < 6 * 60 * 60 * 1000 ? r.sayi : 0) + 1;
    const sure = kilitSuresi(sayi);
    await db
      .prepare("INSERT INTO giris_denemeleri (anahtar, sayi, son_deneme, kilit_bitis) VALUES (?, ?, ?, ?) ON CONFLICT(anahtar) DO UPDATE SET sayi = excluded.sayi, son_deneme = excluded.son_deneme, kilit_bitis = excluded.kilit_bitis")
      .bind(a, sayi, now, sure ? now + sure : 0)
      .run();
  }
}
export async function basariliTemizle(db: D1Database, anahtarlar: string[]): Promise<void> {
  for (const a of anahtarlar) await db.prepare("DELETE FROM giris_denemeleri WHERE anahtar = ?").bind(a).run();
}
export function istemciIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "yerel";
}

// ---- oturum ----
export function cihazEtiketi(request: Request, verilen?: string): string {
  if (verilen && typeof verilen === "string" && verilen.trim()) return verilen.trim().slice(0, 60);
  const ua = request.headers.get("user-agent") || "";
  const sistem = /iPad/.test(ua) ? "iPad" : /iPhone/.test(ua) ? "iPhone" : /Android/.test(ua) ? (/Mobile/.test(ua) ? "Android telefon" : "Android tablet") : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Cihaz";
  const tarayici = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  return (sistem + (tarayici ? " · " + tarayici : "")).slice(0, 60);
}
export async function oturumAc(db: D1Database, kullaniciId: number, hatirla: boolean, cihaz: string, yetkiTaze = true): Promise<{ token: string; bitis: number }> {
  const token = bytesB64u(rastgele(32));
  const now = Date.now();
  const bitis = now + (hatirla ? HATIRLA_SURE : KISA_SURE);
  await db
    .prepare("INSERT INTO oturumlar (token_ozet, kullanici_id, cihaz, olusturma, son_kullanim, bitis, hatirla, yetki_zamani) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(await sha256Hex(token), kullaniciId, cihaz, now, now, bitis, hatirla ? 1 : 0, yetkiTaze ? now : 0)
    .run();
  if (kullaniciId > 0) await db.prepare("UPDATE kullanicilar SET son_giris = ? WHERE id = ?").bind(now, kullaniciId).run();
  // Süresi dolmuş oturum/challenge satırlarını ara sıra temizle.
  if (Math.random() < 0.1) {
    await db.prepare("DELETE FROM oturumlar WHERE bitis < ?").bind(now).run();
    await db.prepare("DELETE FROM giris_challenge WHERE bitis < ?").bind(now).run();
  }
  return { token, bitis };
}
interface OturumSatiri {
  token_ozet: string;
  kullanici_id: number;
  cihaz: string | null;
  son_kullanim: number;
  bitis: number;
  hatirla: number;
  yetki_zamani: number;
  ad: string | null;
  rol: string | null;
  aktif: number | null;
}
export async function oturumBul(request: Request, db: D1Database): Promise<Oturum | null> {
  const token = request.headers.get(OTURUM_BASLIGI);
  if (!token || token.length < 20 || token.length > 100) return null;
  const tokenOzet = await sha256Hex(token);
  const r = await db
    .prepare("SELECT o.token_ozet, o.kullanici_id, o.cihaz, o.son_kullanim, o.bitis, o.hatirla, o.yetki_zamani, k.ad, k.rol, k.aktif FROM oturumlar o LEFT JOIN kullanicilar k ON k.id = o.kullanici_id WHERE o.token_ozet = ?")
    .bind(tokenOzet)
    .first<OturumSatiri>();
  if (!r) return null;
  const now = Date.now();
  if (r.bitis < now) {
    await db.prepare("DELETE FROM oturumlar WHERE token_ozet = ?").bind(tokenOzet).run();
    return null;
  }
  // kullanici_id 0: yalnızca ilk kurulum tamamlanana kadar geçerli "eski eğitmen PIN'i" oturumu.
  if (r.kullanici_id < 0) return null;
  if (r.kullanici_id > 0 && !r.aktif) return null;
  // Kayan süre: "hatırla" oturumları her kullanımda 30 güne uzar (en fazla 10 dakikada bir yazılır).
  let bitis = r.bitis;
  if (now - r.son_kullanim > 10 * 60 * 1000) {
    if (r.hatirla) bitis = now + HATIRLA_SURE;
    await db.prepare("UPDATE oturumlar SET son_kullanim = ?, bitis = ? WHERE token_ozet = ?").bind(now, bitis, tokenOzet).run();
  }
  return {
    tokenOzet,
    kullaniciId: r.kullanici_id,
    ad: r.kullanici_id === 0 ? "Eski eğitmen PIN'i" : r.ad || "?",
    rol: r.kullanici_id === 0 ? "egitmen" : (r.rol as "yonetici" | "egitmen"),
    hatirla: !!r.hatirla,
    bitis,
    yetkiZamani: r.yetki_zamani,
    cihaz: r.cihaz,
  };
}
export async function gunluk(db: D1Database, o: { kullaniciId?: number | null; ad?: string | null }, olay: string, detay?: string): Promise<void> {
  await db
    .prepare("INSERT INTO islem_gunlugu (zaman, kullanici_id, ad, olay, detay) VALUES (?, ?, ?, ?, ?)")
    .bind(Date.now(), o.kullaniciId ?? null, o.ad ?? null, olay, detay ? detay.slice(0, 200) : null)
    .run();
  if (Math.random() < 0.05) await db.prepare("DELETE FROM islem_gunlugu WHERE zaman < ?").bind(Date.now() - 180 * GUN).run();
}

// ---- WebAuthn (passkey) ----
// Kayıt: tarayıcının verdiği SPKI açık anahtar (response.getPublicKey()) ve algoritma saklanır; attestation
// istenmez ("none"). Giriş: imza = sign(authenticatorData || SHA-256(clientDataJSON)).
export function clientDataKontrol(clientDataB64u: string, beklenenTur: string, origin: string): { challenge: string } | null {
  try {
    const cd = JSON.parse(new TextDecoder().decode(b64uBytes(clientDataB64u))) as { type: string; challenge: string; origin: string };
    if (cd.type !== beklenenTur) return null;
    if (cd.origin !== origin) return null;
    return { challenge: cd.challenge };
  } catch {
    return null;
  }
}
// ECDSA imzası DER biçiminde gelir; WebCrypto ham r||s (64 bayt) bekler.
function derHam(der: Uint8Array): Uint8Array {
  let i = 2;
  if (der[1] & 0x80) i = 2 + (der[1] & 0x7f);
  const parca = (): Uint8Array => {
    if (der[i] !== 0x02) throw new Error("der");
    const len = der[i + 1];
    let v = der.slice(i + 2, i + 2 + len);
    i += 2 + len;
    while (v.length > 32 && v[0] === 0) v = v.slice(1);
    const out = new Uint8Array(32);
    out.set(v, 32 - v.length);
    return out;
  };
  const r = parca(), s = parca();
  const ham = new Uint8Array(64);
  ham.set(r, 0);
  ham.set(s, 32);
  return ham;
}
export async function passkeyImzaDogrula(publicKeyB64u: string, alg: number, authData: Uint8Array, clientData: Uint8Array, imza: Uint8Array): Promise<boolean> {
  const cdOzet = new Uint8Array(await crypto.subtle.digest("SHA-256", clientData));
  const veri = new Uint8Array(authData.length + cdOzet.length);
  veri.set(authData, 0);
  veri.set(cdOzet, authData.length);
  const spki = b64uBytes(publicKeyB64u);
  if (alg === -7) {
    const key = await crypto.subtle.importKey("spki", spki, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, derHam(imza), veri);
  }
  if (alg === -257) {
    const key = await crypto.subtle.importKey("spki", spki, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, imza, veri);
  }
  return false;
}
export async function authDataKontrol(authData: Uint8Array, rpId: string): Promise<{ sayac: number } | null> {
  if (authData.length < 37) return null;
  const rpOzet = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(rpId)));
  for (let i = 0; i < 32; i++) if (authData[i] !== rpOzet[i]) return null;
  if (!(authData[32] & 0x01)) return null; // kullanıcı varlığı (UP) bayrağı
  const sayac = ((authData[33] << 24) >>> 0) + (authData[34] << 16) + (authData[35] << 8) + authData[36];
  return { sayac };
}
