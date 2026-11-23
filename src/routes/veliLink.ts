import type { Env } from "../env";
import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";

/** 💌 Velilere Gönder (2026-11-23, public/dagsk-veli-link.js): hangi veliye link gitti, kim açtı, kim ödeme ekranına girdi.
 * Okuma ve yazma oturum ister (index.ts). Kayıt izleKodu'na bağlıdır; isim/telefon tutulmaz. Açılışı velinin sayfaları yazar (veliAcildi). */
const KOD = /^[A-Za-z0-9-]{8,64}$/;
const TURLER = ["ikisi", "odeme", "hatirlat", "devam"];

/** Veli linki açtı (veli.html bilgi isteği ya da rapor.html). giris = telefon doğrulaması da geçti. Hata sayfayı etkilemez. */
export async function veliAcildi(env: Env, kod: string, giris = false): Promise<void> {
  if (!KOD.test(kod)) return;
  const t = Date.now();
  try {
    await env.DB.prepare(
      `INSERT INTO veli_link (izle_kodu, acildi, acilis_sayi, giris) VALUES (?1, ?2, 1, ?3)
       ON CONFLICT(izle_kodu) DO UPDATE SET acildi = excluded.acildi, acilis_sayi = veli_link.acilis_sayi + 1, giris = COALESCE(excluded.giris, veli_link.giris)`
    ).bind(kod, t, giris ? t : null).run();
  } catch (e) { console.error("veli_link", e); }
}

export function registerVeliLinkRoutes(router: Router): void {
  router.get("/api/veli-link", async (_request, env) => {
    const { results } = await env.DB.prepare(
      `SELECT a.grup, a.ad, a.izleKodu AS kod, l.gonderildi, l.gonderen, l.tur, l.gonderim_sayi AS sayi, l.acildi, l.acilis_sayi AS acilis,
              COALESCE((SELECT MAX(o.olusturma) FROM veli_oturum o WHERE o.izle_kodu = a.izleKodu), l.giris) AS giris
       FROM athletes a LEFT JOIN veli_link l ON l.izle_kodu = a.izleKodu`
    ).all();
    return json({ kayit: results }, { headers: { "cache-control": "no-store" } });
  });

  // body: { kodlar: [izleKodu], tur, geri?: true }  geri = "gönderildi" işaretini kaldır (yanlışlıkla işaretlendi)
  router.post("/api/veli-link/gonderildi", async (request, env, params) => {
    const b = await readJson<{ kodlar?: string[]; tur?: string; geri?: boolean }>(request).catch(() => ({} as { kodlar?: string[]; tur?: string; geri?: boolean }));
    const kodlar = (Array.isArray(b.kodlar) ? b.kodlar : []).filter((k) => typeof k === "string" && KOD.test(k)).slice(0, 12);
    if (!kodlar.length) return badRequest("kodlar gerekli");
    const t = Date.now(), tur = TURLER.includes(b.tur || "") ? b.tur! : "ikisi";
    await env.DB.batch(kodlar.map((k) => b.geri
      ? env.DB.prepare("UPDATE veli_link SET gonderildi = NULL, gonderen = NULL, gonderim_sayi = MAX(0, gonderim_sayi - 1) WHERE izle_kodu = ?").bind(k)
      : env.DB.prepare(
          `INSERT INTO veli_link (izle_kodu, gonderildi, gonderen, tur, gonderim_sayi) VALUES (?1, ?2, ?3, ?4, 1)
           ON CONFLICT(izle_kodu) DO UPDATE SET gonderildi = excluded.gonderildi, gonderen = excluded.gonderen, tur = excluded.tur, gonderim_sayi = veli_link.gonderim_sayi + 1`
        ).bind(k, t, params._oturumAd || null, tur)));
    return json({ ok: true, t });
  });
}
