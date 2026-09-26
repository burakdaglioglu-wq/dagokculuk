import type { Router } from "../router";
import type { Env } from "../env";
import { json, badRequest, unauthorized, readJson } from "../lib/json";
import {
  oturumBul, oturumAc, pinOzetle, pinDogruMu, pinKuraliHatasi, kilitKalan, basarisizKaydet, basariliTemizle,
  istemciIp, cihazEtiketi, gunluk, sha256Hex, bytesB64u, rastgele, b64uBytes, clientDataKontrol,
  passkeyImzaDogrula, authDataKontrol, YETKI_TAZE_SURE, type Oturum,
} from "../lib/giris";

// Giriş uç noktaları — okçuluk için /api/giris/*, Milo için /api/milo/giris/* (aynı kod, farklı veritabanı).
// Bu yolların hepsi index.ts'teki genel yazma kontrolünün DIŞINDA (kendi kontrollerini burada yapıyorlar).

interface KullaniciSatiri { id: number; ad: string; rol: "yonetici" | "egitmen"; pin_ozet: string; aktif: number; son_giris: number | null; olusturma: number }

function kilitCevap(ms: number): Response {
  return json({ error: "cok-deneme", kalanSn: Math.ceil(ms / 1000) }, { status: 429 });
}
function yetkiTazeMi(o: Oturum): boolean {
  return Date.now() - o.yetkiZamani < YETKI_TAZE_SURE;
}
async function kullaniciSayisi(db: D1Database): Promise<number> {
  const r = await db.prepare("SELECT COUNT(*) AS n FROM kullanicilar").first<{ n: number }>();
  return r ? r.n : 0;
}
async function aktifYoneticiSayisi(db: D1Database): Promise<number> {
  const r = await db.prepare("SELECT COUNT(*) AS n FROM kullanicilar WHERE rol = 'yonetici' AND aktif = 1").first<{ n: number }>();
  return r ? r.n : 0;
}
function adTemizle(ad: unknown): string | null {
  if (typeof ad !== "string") return null;
  const t = ad.trim().replace(/\s+/g, " ");
  return t.length >= 2 && t.length <= 40 ? t : null;
}

export const GIRIS_ACIK_YOLLAR = [
  "giris", "kurulum", "kurulum-tamamla", "cikis", "dogrula", "aidat-dogrula", "pin-degistir",
  "passkey/kayit-baslat", "passkey/kayit-bitir", "passkey/baslat", "passkey/bitir",
  "yonetim/kullanici", "yonetim/kullanici/:id", "yonetim/cihaz/:id", "yonetim/passkey/:id", "yonetim/aidat-pin",
];

export function registerGirisRoutes(router: Router, onek: string, dbSec: (env: Env) => D1Database): void {
  const yol = (p: string) => onek + "/" + p;

  // Oturum isteyen yardımcı: yoksa 401. yonetim=true ise yönetici + son 15 dk'da PIN doğrulanmış olmalı.
  async function oturumGerekli(request: Request, env: Env, yonetim = false): Promise<Oturum | Response> {
    const o = await oturumBul(request, dbSec(env));
    if (!o) return unauthorized("oturum-yok");
    if (yonetim) {
      if (o.rol !== "yonetici") return json({ error: "yonetici-degil" }, { status: 403 });
      if (!yetkiTazeMi(o)) return json({ error: "yetki-tazele" }, { status: 403 });
      // Güvenlik ekranında çalışıldıkça yetki kayar (en fazla dakikada bir yazılır).
      if (Date.now() - o.yetkiZamani > 60 * 1000) await dbSec(env).prepare("UPDATE oturumlar SET yetki_zamani = ? WHERE token_ozet = ?").bind(Date.now(), o.tokenOzet).run();
    }
    return o;
  }

  router.get(yol("durum"), async (_request, env) => {
    const db = dbSec(env);
    const { results } = await db.prepare("SELECT id, ad, rol FROM kullanicilar WHERE aktif = 1 ORDER BY rol DESC, ad").all<{ id: number; ad: string; rol: string }>();
    const pk = await db.prepare("SELECT COUNT(*) AS n FROM passkeyler").first<{ n: number }>();
    const toplam = await kullaniciSayisi(db);
    return json({ kurulumGerekli: toplam === 0, kullanicilar: results, passkeyVar: !!(pk && pk.n) });
  });

  router.get(yol("ben"), async (request, env) => {
    const o = await oturumBul(request, dbSec(env));
    if (!o) return unauthorized("oturum-yok");
    return json({ id: o.kullaniciId, ad: o.ad, rol: o.rol, hatirla: o.hatirla, bitis: o.bitis, yetkiTaze: yetkiTazeMi(o), eskiPin: o.kullaniciId === 0 });
  });

  router.post(yol("giris"), async (request, env) => {
    const db = dbSec(env);
    const b = await readJson<{ kullaniciId: number; pin: string; hatirla?: boolean; cihaz?: string }>(request).catch(() => null);
    if (!b || typeof b.pin !== "string" || !b.kullaniciId) return badRequest("kullaniciId ve pin gerekli");
    const anahtarlar = ["ip:" + istemciIp(request), "k:" + b.kullaniciId];
    const kalan = await kilitKalan(db, anahtarlar);
    if (kalan) return kilitCevap(kalan);
    const k = await db.prepare("SELECT * FROM kullanicilar WHERE id = ? AND aktif = 1").bind(b.kullaniciId).first<KullaniciSatiri>();
    if (!k || !(await pinDogruMu(b.pin, k.pin_ozet))) {
      await basarisizKaydet(db, anahtarlar);
      const yeniKalan = await kilitKalan(db, anahtarlar);
      if (yeniKalan) {
        if (k) await gunluk(db, { kullaniciId: k.id, ad: k.ad }, "giris-kilitlendi", "çok fazla yanlış PIN · " + cihazEtiketi(request));
        return kilitCevap(yeniKalan);
      }
      return json({ error: "yanlis-pin" }, { status: 401 });
    }
    await basariliTemizle(db, anahtarlar);
    const cihaz = cihazEtiketi(request, b.cihaz);
    const s = await oturumAc(db, k.id, !!b.hatirla, cihaz);
    await gunluk(db, { kullaniciId: k.id, ad: k.ad }, "giris", cihaz + (b.hatirla ? " · hatırla" : ""));
    return json({ token: s.token, bitis: s.bitis, id: k.id, ad: k.ad, rol: k.rol, hatirla: !!b.hatirla });
  });

  // İlk kurulum: henüz hiç hesap yokken ESKİ yönetici PIN'i (sunucudaki eski SHA-256 özetle) doğrulanır ve
  // yöneticinin kendi hesabını oluşturması istenir. Eski eğitmen PIN'i o ana kadar kısa (12 saat) bir
  // eğitmen oturumu açar ki dersler aksamasın; kurulum tamamlanınca o oturumlar da kapanır.
  router.post(yol("kurulum"), async (request, env) => {
    const db = dbSec(env);
    if ((await kullaniciSayisi(db)) > 0) return json({ error: "kurulum-tamam" }, { status: 409 });
    const b = await readJson<{ pin: string; cihaz?: string }>(request).catch(() => null);
    if (!b || typeof b.pin !== "string") return badRequest("pin gerekli");
    const anahtarlar = ["ip:" + istemciIp(request), "kurulum"];
    const kalan = await kilitKalan(db, anahtarlar);
    if (kalan) return kilitCevap(kalan);
    const c = await db.prepare("SELECT yonetici_hash, egitmen_hash FROM credentials WHERE id = 1").first<{ yonetici_hash: string; egitmen_hash: string }>();
    const ozet = await sha256Hex(b.pin);
    const cihaz = cihazEtiketi(request, b.cihaz);
    if (c && ozet === c.yonetici_hash) {
      await basariliTemizle(db, anahtarlar);
      const s = await oturumAc(db, -1, false, cihaz);
      // Kurulum anahtarı 15 dakika geçerli.
      await db.prepare("UPDATE oturumlar SET bitis = ? WHERE token_ozet = ?").bind(Date.now() + 15 * 60 * 1000, await sha256Hex(s.token)).run();
      return json({ kurulumToken: s.token });
    }
    if (c && ozet === c.egitmen_hash) {
      await basariliTemizle(db, anahtarlar);
      const s = await oturumAc(db, 0, false, cihaz);
      await gunluk(db, { kullaniciId: 0, ad: "Eski eğitmen PIN'i" }, "giris", cihaz + " · kurulum öncesi");
      return json({ token: s.token, bitis: s.bitis, id: 0, ad: "Eski eğitmen PIN'i", rol: "egitmen", eskiPin: true });
    }
    await basarisizKaydet(db, anahtarlar);
    const yeniKalan = await kilitKalan(db, anahtarlar);
    if (yeniKalan) return kilitCevap(yeniKalan);
    return json({ error: "yanlis-pin" }, { status: 401 });
  });

  router.post(yol("kurulum-tamamla"), async (request, env) => {
    const db = dbSec(env);
    if ((await kullaniciSayisi(db)) > 0) return json({ error: "kurulum-tamam" }, { status: 409 });
    const b = await readJson<{ kurulumToken: string; ad: string; pin: string; hatirla?: boolean; cihaz?: string }>(request).catch(() => null);
    if (!b || !b.kurulumToken) return badRequest("kurulumToken gerekli");
    const tOzet = await sha256Hex(b.kurulumToken);
    const t = await db.prepare("SELECT kullanici_id, bitis FROM oturumlar WHERE token_ozet = ?").bind(tOzet).first<{ kullanici_id: number; bitis: number }>();
    if (!t || t.kullanici_id !== -1 || t.bitis < Date.now()) return unauthorized("kurulum-suresi-doldu");
    const ad = adTemizle(b.ad);
    if (!ad) return badRequest("Ad 2-40 karakter olmalı");
    const hata = pinKuraliHatasi(b.pin);
    if (hata) return badRequest(hata);
    const now = Date.now();
    const r = await db.prepare("INSERT INTO kullanicilar (ad, rol, pin_ozet, aktif, olusturma) VALUES (?, 'yonetici', ?, 1, ?)").bind(ad, await pinOzetle(b.pin), now).run();
    const id = Number(r.meta.last_row_id);
    // Eski PIN'ler artık hiçbir şekilde geçerli değil: özetler kullanılamaz bir değerle eziliyor,
    // kurulum/eski-eğitmen oturumları kapanıyor.
    const kapali = "kapali-" + bytesB64u(rastgele(12));
    await db.prepare("UPDATE credentials SET yonetici_hash = ?, egitmen_hash = ?, degisim = ? WHERE id = 1").bind(kapali, kapali, now).run();
    try { await db.prepare("UPDATE credentials SET aidat_hash = NULL WHERE id = 1").run(); } catch {}
    await db.prepare("DELETE FROM oturumlar WHERE kullanici_id <= 0").run();
    const cihaz = cihazEtiketi(request, b.cihaz);
    const s = await oturumAc(db, id, !!b.hatirla, cihaz);
    await gunluk(db, { kullaniciId: id, ad }, "kurulum", "yönetici hesabı oluşturuldu, eski PIN'ler kapatıldı");
    return json({ token: s.token, bitis: s.bitis, id, ad, rol: "yonetici", hatirla: !!b.hatirla });
  });

  router.post(yol("cikis"), async (request, env) => {
    const db = dbSec(env);
    const o = await oturumBul(request, db);
    if (o) {
      await db.prepare("DELETE FROM oturumlar WHERE token_ozet = ?").bind(o.tokenOzet).run();
      await gunluk(db, o.kullaniciId > 0 ? { kullaniciId: o.kullaniciId, ad: o.ad } : {}, "cikis", o.cihaz || "");
    }
    return json({ ok: true });
  });

  // Oturum açıkken PIN'i yeniden doğrular (yönetici paneli, hareketsizlik kilidi). Başarılıysa yetki tazelenir.
  router.post(yol("dogrula"), async (request, env) => {
    const db = dbSec(env);
    const o = await oturumGerekli(request, env);
    if (o instanceof Response) return o;
    if (o.kullaniciId <= 0) return json({ error: "hesap-yok" }, { status: 403 });
    const b = await readJson<{ pin: string }>(request).catch(() => null);
    const anahtarlar = ["ip:" + istemciIp(request), "k:" + o.kullaniciId];
    const kalan = await kilitKalan(db, anahtarlar);
    if (kalan) return kilitCevap(kalan);
    const k = await db.prepare("SELECT pin_ozet FROM kullanicilar WHERE id = ?").bind(o.kullaniciId).first<{ pin_ozet: string }>();
    if (!b || typeof b.pin !== "string" || !k || !(await pinDogruMu(b.pin, k.pin_ozet))) {
      await basarisizKaydet(db, anahtarlar);
      const yk = await kilitKalan(db, anahtarlar);
      return yk ? kilitCevap(yk) : json({ error: "yanlis-pin" }, { status: 401 });
    }
    await basariliTemizle(db, anahtarlar);
    await db.prepare("UPDATE oturumlar SET yetki_zamani = ? WHERE token_ozet = ?").bind(Date.now(), o.tokenOzet).run();
    return json({ ok: true });
  });

  // Aidat ek kilidi: ayrı bir aidat PIN'i ayarlandıysa ona, yoksa giriş yapan kişinin kendi PIN'ine bakar.
  router.post(yol("aidat-dogrula"), async (request, env) => {
    const db = dbSec(env);
    const o = await oturumGerekli(request, env);
    if (o instanceof Response) return o;
    const b = await readJson<{ pin: string }>(request).catch(() => null);
    const anahtarlar = ["ip:" + istemciIp(request), "aidat:" + o.kullaniciId];
    const kalan = await kilitKalan(db, anahtarlar);
    if (kalan) return kilitCevap(kalan);
    const ayar = await db.prepare("SELECT deger FROM giris_ayarlar WHERE anahtar = 'aidat_pin'").first<{ deger: string | null }>();
    let kayit = ayar && ayar.deger ? ayar.deger : null;
    if (!kayit && o.kullaniciId > 0) {
      const k = await db.prepare("SELECT pin_ozet FROM kullanicilar WHERE id = ?").bind(o.kullaniciId).first<{ pin_ozet: string }>();
      kayit = k ? k.pin_ozet : null;
    }
    if (!b || typeof b.pin !== "string" || !kayit || !(await pinDogruMu(b.pin, kayit))) {
      await basarisizKaydet(db, anahtarlar);
      const yk = await kilitKalan(db, anahtarlar);
      return yk ? kilitCevap(yk) : json({ error: "yanlis-pin" }, { status: 401 });
    }
    await basariliTemizle(db, anahtarlar);
    return json({ ok: true, ayriPin: !!(ayar && ayar.deger) });
  });

  router.post(yol("pin-degistir"), async (request, env) => {
    const db = dbSec(env);
    const o = await oturumGerekli(request, env);
    if (o instanceof Response) return o;
    if (o.kullaniciId <= 0) return json({ error: "hesap-yok" }, { status: 403 });
    const b = await readJson<{ mevcutPin: string; yeniPin: string }>(request).catch(() => null);
    if (!b) return badRequest("eksik");
    const anahtarlar = ["ip:" + istemciIp(request), "k:" + o.kullaniciId];
    const kalan = await kilitKalan(db, anahtarlar);
    if (kalan) return kilitCevap(kalan);
    const k = await db.prepare("SELECT pin_ozet FROM kullanicilar WHERE id = ?").bind(o.kullaniciId).first<{ pin_ozet: string }>();
    if (!k || !(await pinDogruMu(b.mevcutPin || "", k.pin_ozet))) {
      await basarisizKaydet(db, anahtarlar);
      const yk = await kilitKalan(db, anahtarlar);
      return yk ? kilitCevap(yk) : json({ error: "yanlis-pin" }, { status: 401 });
    }
    const hata = pinKuraliHatasi(b.yeniPin);
    if (hata) return badRequest(hata);
    await basariliTemizle(db, anahtarlar);
    await db.prepare("UPDATE kullanicilar SET pin_ozet = ? WHERE id = ?").bind(await pinOzetle(b.yeniPin), o.kullaniciId).run();
    // PIN değişince (belki biri öğrendiği için) bu cihaz dışındaki oturumlar kapanır.
    await db.prepare("DELETE FROM oturumlar WHERE kullanici_id = ? AND token_ozet != ?").bind(o.kullaniciId, o.tokenOzet).run();
    await gunluk(db, { kullaniciId: o.kullaniciId, ad: o.ad }, "pin-degisti", "diğer cihazların oturumu kapatıldı");
    return json({ ok: true });
  });

  // ---- Yönetim (yalnızca yönetici, son 15 dakikada PIN doğrulanmış olmalı) ----
  router.get(yol("yonetim"), async (request, env) => {
    const db = dbSec(env);
    const o = await oturumGerekli(request, env, true);
    if (o instanceof Response) return o;
    const kullanicilar = (await db.prepare("SELECT id, ad, rol, aktif, olusturma, son_giris FROM kullanicilar ORDER BY aktif DESC, rol DESC, ad").all()).results;
    const cihazlar = (await db.prepare("SELECT o.token_ozet AS id, o.kullanici_id, k.ad, o.cihaz, o.olusturma, o.son_kullanim, o.bitis, o.hatirla FROM oturumlar o LEFT JOIN kullanicilar k ON k.id = o.kullanici_id WHERE o.bitis > ? AND o.kullanici_id >= 0 ORDER BY o.son_kullanim DESC").bind(Date.now()).all<Record<string, unknown>>()).results
      .map((c) => ({ ...c, benim: c.id === o.tokenOzet }));
    const passkeyler = (await db.prepare("SELECT p.id, p.kullanici_id, k.ad, p.cihaz, p.olusturma, p.son_kullanim FROM passkeyler p LEFT JOIN kullanicilar k ON k.id = p.kullanici_id ORDER BY p.olusturma DESC").all()).results;
    const kayitlar = (await db.prepare("SELECT zaman, ad, olay, detay FROM islem_gunlugu ORDER BY zaman DESC LIMIT 80").all()).results;
    const ayar = await db.prepare("SELECT deger FROM giris_ayarlar WHERE anahtar = 'aidat_pin'").first<{ deger: string | null }>();
    return json({ ben: o.kullaniciId, kullanicilar, cihazlar, passkeyler, gunluk: kayitlar, aidatPinAyarli: !!(ayar && ayar.deger) });
  });

  router.post(yol("yonetim/kullanici"), async (request, env) => {
    const db = dbSec(env);
    const o = await oturumGerekli(request, env, true);
    if (o instanceof Response) return o;
    const b = await readJson<{ ad: string; rol: string; pin: string }>(request).catch(() => null);
    if (!b) return badRequest("eksik");
    const ad = adTemizle(b.ad);
    if (!ad) return badRequest("Ad 2-40 karakter olmalı");
    if (b.rol !== "yonetici" && b.rol !== "egitmen") return badRequest("rol yonetici ya da egitmen olmalı");
    const hata = pinKuraliHatasi(b.pin);
    if (hata) return badRequest(hata);
    const ayni = await db.prepare("SELECT id FROM kullanicilar WHERE ad = ? AND aktif = 1").bind(ad).first();
    if (ayni) return badRequest("Bu adda aktif bir kullanıcı zaten var");
    await db.prepare("INSERT INTO kullanicilar (ad, rol, pin_ozet, aktif, olusturma) VALUES (?, ?, ?, 1, ?)").bind(ad, b.rol, await pinOzetle(b.pin), Date.now()).run();
    await gunluk(db, { kullaniciId: o.kullaniciId, ad: o.ad }, "kullanici-ekle", ad + " (" + b.rol + ")");
    return json({ ok: true });
  });

  router.put(yol("yonetim/kullanici/:id"), async (request, env, params) => {
    const db = dbSec(env);
    const o = await oturumGerekli(request, env, true);
    if (o instanceof Response) return o;
    const id = parseInt(params.id, 10);
    const k = await db.prepare("SELECT * FROM kullanicilar WHERE id = ?").bind(id).first<KullaniciSatiri>();
    if (!k) return json({ error: "yok" }, { status: 404 });
    const b = await readJson<{ aktif?: boolean; rol?: string; pin?: string; ad?: string }>(request).catch(() => null);
    if (!b) return badRequest("eksik");
    const yoneticiKaybi = k.rol === "yonetici" && k.aktif && ((b.aktif === false) || (b.rol && b.rol !== "yonetici"));
    if (yoneticiKaybi && (await aktifYoneticiSayisi(db)) <= 1) return badRequest("Son aktif yönetici kapatılamaz / düşürülemez");
    const degisen: string[] = [];
    if (typeof b.ad === "string") { const ad = adTemizle(b.ad); if (!ad) return badRequest("Ad 2-40 karakter olmalı"); await db.prepare("UPDATE kullanicilar SET ad = ? WHERE id = ?").bind(ad, id).run(); degisen.push("ad"); }
    if (b.rol === "yonetici" || b.rol === "egitmen") { await db.prepare("UPDATE kullanicilar SET rol = ? WHERE id = ?").bind(b.rol, id).run(); degisen.push("rol=" + b.rol); }
    if (typeof b.pin === "string") {
      const hata = pinKuraliHatasi(b.pin);
      if (hata) return badRequest(hata);
      await db.prepare("UPDATE kullanicilar SET pin_ozet = ? WHERE id = ?").bind(await pinOzetle(b.pin), id).run();
      await db.prepare("DELETE FROM oturumlar WHERE kullanici_id = ? AND token_ozet != ?").bind(id, o.tokenOzet).run();
      degisen.push("PIN sıfırlandı");
    }
    if (typeof b.aktif === "boolean") {
      await db.prepare("UPDATE kullanicilar SET aktif = ? WHERE id = ?").bind(b.aktif ? 1 : 0, id).run();
      if (!b.aktif) {
        await db.prepare("DELETE FROM oturumlar WHERE kullanici_id = ?").bind(id).run();
        await db.prepare("DELETE FROM passkeyler WHERE kullanici_id = ?").bind(id).run();
      }
      degisen.push(b.aktif ? "erişim açıldı" : "erişim kapatıldı");
    }
    await gunluk(db, { kullaniciId: o.kullaniciId, ad: o.ad }, "kullanici-guncelle", k.ad + ": " + degisen.join(", "));
    return json({ ok: true });
  });

  router.delete(yol("yonetim/cihaz/:id"), async (request, env, params) => {
    const db = dbSec(env);
    const o = await oturumGerekli(request, env, true);
    if (o instanceof Response) return o;
    const c = await db.prepare("SELECT o.cihaz, k.ad FROM oturumlar o LEFT JOIN kullanicilar k ON k.id = o.kullanici_id WHERE o.token_ozet = ?").bind(params.id).first<{ cihaz: string; ad: string }>();
    await db.prepare("DELETE FROM oturumlar WHERE token_ozet = ?").bind(params.id).run();
    if (c) await gunluk(db, { kullaniciId: o.kullaniciId, ad: o.ad }, "cihaz-cikar", (c.ad || "?") + " · " + (c.cihaz || ""));
    return json({ ok: true });
  });

  router.delete(yol("yonetim/passkey/:id"), async (request, env, params) => {
    const db = dbSec(env);
    const o = await oturumGerekli(request, env, true);
    if (o instanceof Response) return o;
    const p = await db.prepare("SELECT p.cihaz, k.ad FROM passkeyler p LEFT JOIN kullanicilar k ON k.id = p.kullanici_id WHERE p.id = ?").bind(params.id).first<{ cihaz: string; ad: string }>();
    await db.prepare("DELETE FROM passkeyler WHERE id = ?").bind(params.id).run();
    if (p) await gunluk(db, { kullaniciId: o.kullaniciId, ad: o.ad }, "passkey-sil", (p.ad || "?") + " · " + (p.cihaz || ""));
    return json({ ok: true });
  });

  router.put(yol("yonetim/aidat-pin"), async (request, env) => {
    const db = dbSec(env);
    const o = await oturumGerekli(request, env, true);
    if (o instanceof Response) return o;
    const b = await readJson<{ pin: string | null }>(request).catch(() => null);
    if (!b) return badRequest("eksik");
    if (b.pin === null) {
      await db.prepare("DELETE FROM giris_ayarlar WHERE anahtar = 'aidat_pin'").run();
      await gunluk(db, { kullaniciId: o.kullaniciId, ad: o.ad }, "aidat-pin", "kaldırıldı (kişisel PIN geçerli)");
      return json({ ok: true });
    }
    const hata = pinKuraliHatasi(b.pin);
    if (hata) return badRequest(hata);
    await db.prepare("INSERT INTO giris_ayarlar (anahtar, deger) VALUES ('aidat_pin', ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger").bind(await pinOzetle(b.pin)).run();
    await gunluk(db, { kullaniciId: o.kullaniciId, ad: o.ad }, "aidat-pin", "ayarlandı");
    return json({ ok: true });
  });

  // ---- Passkey ----
  function rpId(request: Request): string { return new URL(request.url).hostname; }
  function origin(request: Request): string { return new URL(request.url).origin; }

  router.post(yol("passkey/kayit-baslat"), async (request, env) => {
    const db = dbSec(env);
    const o = await oturumGerekli(request, env);
    if (o instanceof Response) return o;
    if (o.kullaniciId <= 0) return json({ error: "hesap-yok" }, { status: 403 });
    if (!yetkiTazeMi(o)) return json({ error: "yetki-tazele" }, { status: 403 });
    const challenge = bytesB64u(rastgele(32));
    await db.prepare("INSERT INTO giris_challenge (challenge, tur, kullanici_id, bitis) VALUES (?, 'kayit', ?, ?)").bind(challenge, o.kullaniciId, Date.now() + 5 * 60 * 1000).run();
    const mevcut = (await db.prepare("SELECT id FROM passkeyler WHERE kullanici_id = ?").bind(o.kullaniciId).all<{ id: string }>()).results.map((r) => r.id);
    return json({ challenge, rpId: rpId(request), kullaniciId: bytesB64u(new TextEncoder().encode("u" + o.kullaniciId)), ad: o.ad, mevcut });
  });

  router.post(yol("passkey/kayit-bitir"), async (request, env) => {
    const db = dbSec(env);
    const o = await oturumGerekli(request, env);
    if (o instanceof Response) return o;
    const b = await readJson<{ id: string; clientDataJSON: string; publicKey: string; alg: number; cihaz?: string }>(request).catch(() => null);
    if (!b || !b.id || !b.clientDataJSON || !b.publicKey) return badRequest("eksik");
    if (b.alg !== -7 && b.alg !== -257) return badRequest("desteklenmeyen algoritma");
    const cd = clientDataKontrol(b.clientDataJSON, "webauthn.create", origin(request));
    if (!cd) return badRequest("clientData geçersiz");
    const ch = await db.prepare("SELECT kullanici_id, bitis FROM giris_challenge WHERE challenge = ? AND tur = 'kayit'").bind(cd.challenge).first<{ kullanici_id: number; bitis: number }>();
    await db.prepare("DELETE FROM giris_challenge WHERE challenge = ?").bind(cd.challenge).run();
    if (!ch || ch.bitis < Date.now() || ch.kullanici_id !== o.kullaniciId) return badRequest("challenge geçersiz");
    try { await crypto.subtle.importKey("spki", b64uBytes(b.publicKey), b.alg === -7 ? { name: "ECDSA", namedCurve: "P-256" } : { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]); } catch { return badRequest("açık anahtar okunamadı"); }
    const cihaz = cihazEtiketi(request, b.cihaz);
    await db.prepare("INSERT OR REPLACE INTO passkeyler (id, kullanici_id, public_key, alg, sayac, cihaz, olusturma) VALUES (?, ?, ?, ?, 0, ?, ?)").bind(b.id, o.kullaniciId, b.publicKey, b.alg, cihaz, Date.now()).run();
    await gunluk(db, { kullaniciId: o.kullaniciId, ad: o.ad }, "passkey-ekle", cihaz);
    return json({ ok: true });
  });

  router.post(yol("passkey/baslat"), async (request, env) => {
    const db = dbSec(env);
    const kalan = await kilitKalan(db, ["ip:" + istemciIp(request)]);
    if (kalan) return kilitCevap(kalan);
    const challenge = bytesB64u(rastgele(32));
    await db.prepare("INSERT INTO giris_challenge (challenge, tur, kullanici_id, bitis) VALUES (?, 'giris', NULL, ?)").bind(challenge, Date.now() + 5 * 60 * 1000).run();
    return json({ challenge, rpId: rpId(request) });
  });

  router.post(yol("passkey/bitir"), async (request, env) => {
    const db = dbSec(env);
    const b = await readJson<{ id: string; clientDataJSON: string; authenticatorData: string; signature: string; hatirla?: boolean; cihaz?: string }>(request).catch(() => null);
    if (!b || !b.id || !b.clientDataJSON || !b.authenticatorData || !b.signature) return badRequest("eksik");
    const anahtarlar = ["ip:" + istemciIp(request)];
    const kalan = await kilitKalan(db, anahtarlar);
    if (kalan) return kilitCevap(kalan);
    const basarisiz = async () => { await basarisizKaydet(db, anahtarlar); return json({ error: "passkey-gecersiz" }, { status: 401 }); };
    const cd = clientDataKontrol(b.clientDataJSON, "webauthn.get", origin(request));
    if (!cd) return basarisiz();
    const ch = await db.prepare("SELECT bitis FROM giris_challenge WHERE challenge = ? AND tur = 'giris'").bind(cd.challenge).first<{ bitis: number }>();
    await db.prepare("DELETE FROM giris_challenge WHERE challenge = ?").bind(cd.challenge).run();
    if (!ch || ch.bitis < Date.now()) return basarisiz();
    const pk = await db.prepare("SELECT p.*, k.ad, k.rol, k.aktif FROM passkeyler p JOIN kullanicilar k ON k.id = p.kullanici_id WHERE p.id = ?").bind(b.id).first<{ kullanici_id: number; public_key: string; alg: number; sayac: number; ad: string; rol: string; aktif: number }>();
    if (!pk || !pk.aktif) return basarisiz();
    const authData = b64uBytes(b.authenticatorData);
    const ad = await authDataKontrol(authData, rpId(request));
    if (!ad) return basarisiz();
    let gecerli = false;
    try { gecerli = await passkeyImzaDogrula(pk.public_key, pk.alg, authData, b64uBytes(b.clientDataJSON), b64uBytes(b.signature)); } catch { gecerli = false; }
    if (!gecerli) return basarisiz();
    // Sayaç destekleyen cihazlarda geri giden sayaç = kopyalanmış anahtar şüphesi.
    if (ad.sayac && pk.sayac && ad.sayac <= pk.sayac) return basarisiz();
    await basariliTemizle(db, anahtarlar);
    await db.prepare("UPDATE passkeyler SET sayac = ?, son_kullanim = ? WHERE id = ?").bind(ad.sayac, Date.now(), b.id).run();
    const cihaz = cihazEtiketi(request, b.cihaz);
    const hatirla = b.hatirla !== false;
    const s = await oturumAc(db, pk.kullanici_id, hatirla, cihaz);
    await gunluk(db, { kullaniciId: pk.kullanici_id, ad: pk.ad }, "giris", cihaz + " · parmak izi/Face ID");
    return json({ token: s.token, bitis: s.bitis, id: pk.kullanici_id, ad: pk.ad, rol: pk.rol, hatirla });
  });
}
