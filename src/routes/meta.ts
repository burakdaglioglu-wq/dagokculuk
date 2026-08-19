import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcastMasterChanged } from "../lib/broadcast";
import * as metaDb from "../db/meta";

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
  router.get("/api/meta/:key", async (_request, env, params) => {
    return json({ value: await metaDb.getMeta(env, params.key) });
  });

  router.put("/api/meta/:key", async (request, env, params) => {
    const body = await readJson<{ value: string }>(request);
    if (typeof body.value !== "string") return badRequest("value is required");
    await metaDb.setMeta(env, params.key, body.value);
    return json({ applied: true });
  });

  router.get("/api/credentials", async (_request, env) => {
    const row = await env.DB.prepare("SELECT yonetici_hash, egitmen_hash, aidat_hash, degisim FROM credentials WHERE id = 1").first<CredentialsRow>();
    return json({ credentials: row });
  });

  router.put("/api/credentials", async (request, env) => {
    const body = await readJson<{ yoneticiHash: string; egitmenHash: string; aidatHash?: string | null; degisim: number }>(request);
    if (!body.yoneticiHash || !body.egitmenHash) return badRequest("yoneticiHash and egitmenHash are required");

    const current = await env.DB.prepare("SELECT degisim FROM credentials WHERE id = 1").first<{ degisim: number }>();
    if (current && body.degisim <= current.degisim) return json({ applied: false }, { status: 409 });

    await env.DB.prepare("UPDATE credentials SET yonetici_hash = ?, egitmen_hash = ?, aidat_hash = ?, degisim = ? WHERE id = 1")
      .bind(body.yoneticiHash, body.egitmenHash, body.aidatHash ?? null, body.degisim)
      .run();
    await broadcastMasterChanged(env, null);
    return json({ applied: true });
  });

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
