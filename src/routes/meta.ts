import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcastMasterChanged } from "../lib/broadcast";
import * as metaDb from "../db/meta";
import { yetkiliOturum } from "../auth";
import { unauthorized } from "../lib/json";

// Genel meta geçişi PIN'siz (Karışık Sınıf) — ama kişisel bilgi taşıyan anahtarlar oturum ister (okuma + yazma).
// yapilacak_tamam: "Bugün yapılacaklar" işaretleri — kimin aidatı gecikmiş bilgisini taşır.
// program_gecmis: ders programı ekleme/çıkarma geçmişi (sunucu yazar, antrenmanProgrami.ts) — kimin hangi derste olduğu.
// personel_bilgi / personel_odeme: eğitmen telefonu, IBAN, acil durum kişisi, ücret ve ödeme defteri (dagsk-personel.js, 2026-10-21).
const OTURUMLU_META = new Set<string>(["kisi_notlari", "personel_ders_ucret", "yapilacak_tamam", "program_gecmis", "deneme_adaylari", "silinen_gizli", "kayitsiz_yoksay", "personel_bilgi", "personel_odeme", "ozel_ders"]);
// ozel_ders: 💪 Sporla Gelişiyorum (2026-10-29) — çocuğun hareket puanları, ders notları, veliye giden özet.

// Yarışma kayıtları ({ anahtar: { ..., t } }) birçok telefondan aynı anda yazılır. İstemci (kyDepoSenkron) GET → birleştir →
// PUT yapıyor; iki telefon aynı anda GET yapınca ikinci PUT birincinin sporcusunu silebiliyordu (2026-10-25 yarışmasında hiçbir
// sporcunun skoru sunucuya ulaşmamıştı). Bu anahtarlarda sunucu da kayıt başına birleştirir: daha yeni t kazanır, hiçbir kayıt düşmez
// (silme zaten sil:true işaretiyle yapılıyor).
const KAYIT_BIRLESTIR = new Set<string>(["yarisma_sporcu", "yarisma_hedef", "yarismalar", "ozel_ders"]);
type Kayitlar = Record<string, { t?: number } | null>;
function kayitBirlestir(eski: string | null, gelen: string): string | null {
  let a: Kayitlar, b: Kayitlar;
  try { a = eski ? JSON.parse(eski) : {}; b = JSON.parse(gelen); } catch { return null; }
  if (!a || typeof a !== "object" || Array.isArray(a) || !b || typeof b !== "object" || Array.isArray(b)) return null;
  const m: Kayitlar = { ...a };
  for (const k of Object.keys(b)) {
    const x = b[k];
    if (x && (!m[k] || (x.t ?? 0) > (m[k]?.t ?? 0))) m[k] = x;
  }
  return JSON.stringify(m);
}

interface CredentialsRow {
  yonetici_hash: string;
  egitmen_hash: string;
  aidat_hash: string | null;
  degisim: number;
}

export function registerMetaRoutes(router: Router): void {
  router.get("/api/meta", async (_request, env) => {
    const meta = await metaDb.getAllMeta(env);
    return json({
      minSurum: Number(meta.minSurum ?? 0),
      resetZamani: Number(meta.resetZamani ?? 0),
      sonGeriYukleme: Number(meta.sonGeriYukleme ?? 0),
      aktifTur: Number(meta.aktifTur ?? 1),
      aktifTakimTur: Number(meta.aktifTakimTur ?? 1),
    });
  });

  router.put("/api/meta/min-surum", async (request, env) => {
    const body = await readJson<{ minSurum: number }>(request);
    if (typeof body.minSurum !== "number") return badRequest("minSurum is required");
    return json(await metaDb.bumpMetaIfNewer(env, "minSurum", body.minSurum));
  });

  // Generic key/value passthrough — used by sync.js to mirror the lower-confidence
  // blob-shaped collections (takimlarDB, antrenmanlarDB, atisLog, ...) losslessly.
  router.get("/api/meta/:key", async (request, env, params) => {
    if (OTURUMLU_META.has(params.key) && !(await yetkiliOturum(request, env, false))) return unauthorized();
    return json(await metaDb.getMetaSatir(env, params.key));
  });

  router.put("/api/meta/:key", async (request, env, params) => {
    if (OTURUMLU_META.has(params.key) && !(await yetkiliOturum(request, env, false))) return unauthorized();
    const body = await readJson<{ value: string }>(request);
    if (typeof body.value !== "string") return badRequest("value is required");
    if (KAYIT_BIRLESTIR.has(params.key)) {
      const yeni = kayitBirlestir(await metaDb.getMeta(env, params.key), body.value);
      if (yeni !== null) {
        await metaDb.setMeta(env, params.key, yeni);
        return json({ applied: true });
      }
    }
    await metaDb.setMeta(env, params.key, body.value);
    return json({ applied: true });
  });

  // Eski /api/credentials (GET/PUT) kaldırıldı (2026-09-27): PIN özetlerini herkese dağıtıyordu. Giriş artık
  // /api/giris/* üzerinden (bkz. routes/giris.ts).

  router.get("/api/custom-classes", async (_request, env) => {
    const { results } = await env.DB.prepare("SELECT ad FROM custom_classes").all<{ ad: string }>();
    return json({ classes: results.map((r) => r.ad) });
  });

  // DÜZELTME: fanOutMasterPayload her özel sınıf için ayrı ayrı buraya postalıyordu — Durable Object
  // broadcast isteklerine katkısı vardı (ücretsiz kota aşımı). Kaldırıldı.
  router.post("/api/custom-classes", async (request, env) => {
    const body = await readJson<{ ad: string; deviceId?: string }>(request);
    if (!body.ad) return badRequest("ad is required");
    await env.DB.prepare("INSERT OR IGNORE INTO custom_classes (ad) VALUES (?)").bind(body.ad).run();
    return json({ applied: true });
  });

  router.delete("/api/custom-classes/:ad", async (request, env, params) => {
    const url = new URL(request.url);
    await env.DB.prepare("DELETE FROM custom_classes WHERE ad = ?").bind(params.ad).run();
    await broadcastMasterChanged(env, url.searchParams.get("deviceId"));
    return json({ applied: true });
  });

  router.get("/api/training-sessions", async (request, env) => {
    const url = new URL(request.url);
    const lig = url.searchParams.get("lig");
    const stmt = lig
      ? env.DB.prepare("SELECT * FROM training_sessions WHERE lig = ?").bind(lig)
      : env.DB.prepare("SELECT * FROM training_sessions");
    const { results } = await stmt.all<{ id: number; tarih: string; lig: string | null; data_json: string }>();
    return json({ sessions: results.map((r) => ({ id: r.id, tarih: r.tarih, lig: r.lig, data: JSON.parse(r.data_json) })) });
  });

  router.post("/api/training-sessions", async (request, env) => {
    const body = await readJson<{ tarih: string; lig?: string; data: unknown; deviceId?: string }>(request);
    if (!body.tarih || body.data === undefined) return badRequest("tarih and data are required");
    await env.DB.prepare("INSERT INTO training_sessions (tarih, lig, data_json) VALUES (?, ?, ?)")
      .bind(body.tarih, body.lig ?? null, JSON.stringify(body.data))
      .run();
    await broadcastMasterChanged(env, body.deviceId ?? null);
    return json({ applied: true });
  });

  router.post("/api/shot-log", async (request, env) => {
    const body = await readJson<{ t: string; tarih: string; ad: string; grup?: string; sari?: number; x?: number; puan?: number; deviceId?: string }>(
      request
    );
    if (!body.t || !body.tarih || !body.ad) return badRequest("t, tarih, ad are required");
    await env.DB.prepare("INSERT INTO shot_log (t, tarih, ad, grup, sari, x, puan) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(body.t, body.tarih, body.ad, body.grup ?? null, body.sari ?? 0, body.x ?? 0, body.puan ?? 0)
      .run();
    await broadcastMasterChanged(env, body.deviceId ?? null);
    return json({ applied: true });
  });

  router.get("/api/club-records", async (_request, env) => {
    const { results } = await env.DB.prepare("SELECT * FROM club_records").all<{ anahtar: string; deger: number; ad: string | null; tarih: string | null }>();
    return json({ records: Object.fromEntries(results.map((r) => [r.anahtar, { deger: r.deger, ad: r.ad, tarih: r.tarih }])) });
  });

  router.put("/api/club-records/:anahtar", async (request, env, params) => {
    const body = await readJson<{ deger: number; ad?: string; tarih?: string }>(request);
    if (typeof body.deger !== "number") return badRequest("deger is required");

    const current = await env.DB.prepare("SELECT deger FROM club_records WHERE anahtar = ?").bind(params.anahtar).first<{ deger: number }>();
    if (current && body.deger <= current.deger) return json({ applied: false });

    await env.DB.prepare(
      "INSERT INTO club_records (anahtar, deger, ad, tarih) VALUES (?, ?, ?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger, ad = excluded.ad, tarih = excluded.tarih"
    )
      .bind(params.anahtar, body.deger, body.ad ?? null, body.tarih ?? null)
      .run();
    return json({ applied: true });
  });
}
