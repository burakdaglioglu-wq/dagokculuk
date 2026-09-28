import type { Router } from "../../router";
import type { Env } from "../../env";
import { json, badRequest, notFound, readJson } from "../../lib/json";

/** Milo araçları (2026-09-29) — Dağ'daki Yoklama analizi / kişi yönetimi / veli raporunun Milo karşılıkları.
 *  - GET/PUT /api/milo/meta/:key : anahtar/değer deposu (kişi türleri, eğitmen ders yoklaması, bekleme listesi…).
 *    Milo uygulaması tamamen girişli çalıştığı için okuma da yazma da oturum ister (index.ts).
 *  - POST /api/milo/members/:grup/:ad/rename, /merge : veri kaybısız isim/grup düzeltme ve birleştirme. Milo'da aidat,
 *    yoklama ve beceri kayıtları YALNIZCA isimle, ders kayıtları grup+isimle tutulur — eski yol (yeni üye aç + eskisini
 *    sil) bunları eski isimde kopuk bırakıyordu.
 *  - POST /api/milo/members/:grup/:ad/izle-kodu (girişli) + GET /api/milo/veli-rapor/:kod?ay= (herkese açık, yalnızca
 *    o üyenin o ayki devamı, beceri durumu ve kayıtlı olduğu ders saatleri — telefon, not, sağlık bilgisi YOK). */

const UYE_ALANLARI = ["sinif", "cinsiyet", "dogumTarihi", "katilmaTarihi", "aileMeslek", "acilKisi", "acilTelefon", "antrenmanNotu", "genelNot", "boy", "kilo", "saglikNotu"];

async function uyeVar(env: Env, grup: string, ad: string) {
  return env.DB_MILO.prepare("SELECT * FROM members WHERE grup = ? AND ad = ?").bind(grup, ad).first<Record<string, unknown>>();
}

// Kaynağın çocuk kayıtlarını hedefe taşı. Çakışmada hedefinki kalır (UPDATE OR IGNORE), artanlar silinir.
function tasimaAdimlari(env: Env, eG: string, eA: string, yG: string, yA: string) {
  const db = env.DB_MILO;
  const adim = [];
  if (eA !== yA) {
    // aidat: hedefte ödenmemiş ama kaynakta ödenmiş ay → ödenmiş bilgisini al
    adim.push(db.prepare(
      `UPDATE dues SET odendi = 1, tutar = (SELECT s.tutar FROM dues s WHERE s.ad = ?1 AND s.ay = dues.ay), tarih = (SELECT s.tarih FROM dues s WHERE s.ad = ?1 AND s.ay = dues.ay)
       WHERE ad = ?2 AND odendi = 0 AND ay IN (SELECT ay FROM dues WHERE ad = ?1 AND odendi = 1)`).bind(eA, yA));
    adim.push(db.prepare("UPDATE OR IGNORE dues SET ad = ? WHERE ad = ?").bind(yA, eA));
    adim.push(db.prepare("DELETE FROM dues WHERE ad = ?").bind(eA));
    adim.push(db.prepare("UPDATE OR IGNORE attendance_auto SET ad = ?, grup = ? WHERE ad = ?").bind(yA, yG, eA));
    adim.push(db.prepare("DELETE FROM attendance_auto WHERE ad = ?").bind(eA));
    adim.push(db.prepare("UPDATE OR IGNORE member_skills SET ad = ? WHERE ad = ?").bind(yA, eA));
    adim.push(db.prepare("DELETE FROM member_skills WHERE ad = ?").bind(eA));
  } else if (eG !== yG) {
    adim.push(db.prepare("UPDATE attendance_auto SET grup = ? WHERE ad = ? AND (grup = ? OR grup IS NULL)").bind(yG, yA, eG));
  }
  adim.push(db.prepare("UPDATE OR IGNORE antrenman_programi_katilimci SET grup = ?, ad = ? WHERE grup = ? AND ad = ?").bind(yG, yA, eG, eA));
  adim.push(db.prepare("DELETE FROM antrenman_programi_katilimci WHERE grup = ? AND ad = ?").bind(eG, eA));
  return adim;
}

export function registerMiloAraclarRoutes(router: Router): void {
  router.get("/api/milo/meta/:key", async (_request, env, params) => {
    const r = await env.DB_MILO.prepare("SELECT value FROM meta WHERE key = ?").bind(params.key).first<{ value: string | null }>();
    return json({ value: r ? r.value : null });
  });
  router.put("/api/milo/meta/:key", async (request, env, params) => {
    const body = await readJson<{ value: string }>(request);
    if (typeof body.value !== "string") return badRequest("value is required");
    await env.DB_MILO.prepare("INSERT INTO meta (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
      .bind(params.key, body.value, Date.now()).run();
    return json({ applied: true });
  });

  router.post("/api/milo/members/:grup/:ad/rename", async (request, env, params) => {
    const body = await readJson<{ yeniAd?: string; yeniGrup?: string }>(request);
    const yA = (body.yeniAd || params.ad).trim(), yG = (body.yeniGrup || params.grup).trim();
    if (!yA || !yG) return badRequest("yeniAd/yeniGrup required");
    if (yA === params.ad && yG === params.grup) return badRequest("same-name");
    if (!(await uyeVar(env, params.grup, params.ad))) return badRequest("source-missing");
    if (await uyeVar(env, yG, yA)) return badRequest("target-exists");
    await env.DB_MILO.batch([
      ...tasimaAdimlari(env, params.grup, params.ad, yG, yA),
      env.DB_MILO.prepare("UPDATE members SET grup = ?, ad = ?, lastModified = ? WHERE grup = ? AND ad = ?").bind(yG, yA, Date.now(), params.grup, params.ad),
    ]);
    return json({ applied: true });
  });

  router.post("/api/milo/members/:grup/:ad/merge", async (request, env, params) => {
    const body = await readJson<{ toGrup: string; toAd: string }>(request);
    if (!body.toGrup || !body.toAd) return badRequest("toGrup and toAd are required");
    if (body.toGrup === params.grup && body.toAd === params.ad) return badRequest("same-athlete");
    const src = await uyeVar(env, params.grup, params.ad), dst = await uyeVar(env, body.toGrup, body.toAd);
    if (!src) return badRequest("source-missing");
    if (!dst) return badRequest("target-missing");
    const bos = (v: unknown) => v === null || v === undefined || v === "";
    const doldur = UYE_ALANLARI.filter((f) => bos(dst[f]) && !bos(src[f]));
    const adimlar = [...tasimaAdimlari(env, params.grup, params.ad, body.toGrup, body.toAd)];
    if (doldur.length) adimlar.push(env.DB_MILO.prepare(`UPDATE members SET ${doldur.map((f) => f + " = ?").join(", ")}, lastModified = ? WHERE grup = ? AND ad = ?`).bind(...doldur.map((f) => src[f]), Date.now(), body.toGrup, body.toAd));
    adimlar.push(env.DB_MILO.prepare("DELETE FROM members WHERE grup = ? AND ad = ?").bind(params.grup, params.ad));
    await env.DB_MILO.batch(adimlar);
    return json({ applied: true });
  });

  router.post("/api/milo/members/:grup/:ad/izle-kodu", async (_request, env, params) => {
    const row = await uyeVar(env, params.grup, params.ad);
    if (!row) return notFound("member not found");
    if (row.izleKodu) return json({ kod: row.izleKodu });
    const kod = crypto.randomUUID().replace(/-/g, "");
    await env.DB_MILO.prepare("UPDATE members SET izleKodu = ? WHERE grup = ? AND ad = ?").bind(kod, params.grup, params.ad).run();
    return json({ kod });
  });

  router.get("/api/milo/veli-rapor/:kod", async (request, env, params) => {
    const uye = await env.DB_MILO.prepare("SELECT grup, ad FROM members WHERE izleKodu = ?").bind(params.kod).first<{ grup: string; ad: string }>();
    if (!uye) return notFound("invalid code");
    const ay = new URL(request.url).searchParams.get("ay") || "";
    if (!/^\d{4}-\d{2}$/.test(ay)) return badRequest("ay=YYYY-MM required");
    const { results: yoklama } = await env.DB_MILO.prepare("SELECT tarih, saat, geldi FROM attendance_auto WHERE ad = ? AND tarih LIKE ?").bind(uye.ad, ay + "-%").all<{ tarih: string; saat: string | null; geldi: number }>();
    const { results: beceri } = await env.DB_MILO.prepare(
      `SELECT s.durum, s.guncelleme, d.baslik FROM member_skills s LEFT JOIN ders_icerikleri d ON d.id = s.dersId WHERE s.ad = ? ORDER BY s.guncelleme DESC`
    ).bind(uye.ad).all<{ durum: string; guncelleme: number; baslik: string | null }>();
    const { results: slotlar } = await env.DB_MILO.prepare(
      `SELECT p.id, p.grup, p.gun, p.baslangicSaat, p.bitisSaat FROM antrenman_programi p JOIN antrenman_programi_katilimci k ON k.slotId = p.id WHERE k.grup = ? AND k.ad = ?`
    ).bind(uye.grup, uye.ad).all<{ id: number; grup: string; gun: number; baslangicSaat: string; bitisSaat: string }>();
    const dersler = [];
    for (const s of slotlar) {
      const { results: g } = await env.DB_MILO.prepare("SELECT gun FROM antrenman_programi_gun WHERE slotId = ?").bind(s.id).all<{ gun: number }>();
      const { results: ist } = await env.DB_MILO.prepare("SELECT tarih FROM antrenman_programi_istisna WHERE slotId = ? AND tarih LIKE ?").bind(s.id, ay + "-%").all<{ tarih: string }>();
      dersler.push({ ad: s.grup, gunler: g.length ? g.map((x) => x.gun).sort() : [s.gun], baslangicSaat: s.baslangicSaat, bitisSaat: s.bitisSaat, iptaller: ist.map((x) => x.tarih) });
    }
    return json({
      kulup: "milo", ad: uye.ad, grup: uye.grup, ay,
      yoklama: yoklama.map((y) => ({ tarih: y.tarih, saat: y.saat, geldi: y.geldi !== 0 })),
      beceri: beceri.map((b) => ({ baslik: b.baslik || "Beceri", durum: b.durum, guncelleme: b.guncelleme })),
      seriler: [], dersler,
    });
  });
}
