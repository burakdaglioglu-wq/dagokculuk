import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcast } from "../lib/broadcast";

// Karışık Sınıf ortak ders durumu (2026-09-29) — bkz. migrations/0039_km_ortak.sql ve public/dagsk-km-ortak.js.
// Karışık Sınıf PIN'siz açılabildiği için (sporcu listesi meta'sı gibi) yazma PIN'siz; içerik oyun
// ilerlemesi/takım/araç durumu — kişisel veri yok.
const KONUM_RE = /^[A-Za-z0-9-]{1,40}$/;
const MAX_GIRDI = 400;
const MAX_DEGER = 200_000;
const SAKLAMA_MS = 45 * 24 * 3600 * 1000;

interface Girdi { a: string; alt?: string; d: string | null; t: number }

export function registerKmOrtakRoutes(router: Router): void {
  // ?s=<ms> → o andan sonra yazılanlar (istemci birkaç sn geriden ister, t'ye göre tekrarları eler).
  router.get("/api/km-ortak/:konum", async (request, env, params) => {
    if (!KONUM_RE.test(params.konum)) return badRequest("konum");
    const s = Number(new URL(request.url).searchParams.get("s") || 0) || 0;
    const { results } = await env.DB.prepare("SELECT anahtar, alt, deger, t, s FROM km_ortak WHERE konum = ? AND s > ?")
      .bind(params.konum, s).all<{ anahtar: string; alt: string; deger: string | null; t: number; s: number }>();
    return json({ simdi: Date.now(), girdiler: results.map((r) => ({ a: r.anahtar, alt: r.alt, d: r.deger, t: r.t, s: r.s })) });
  });

  router.post("/api/km-ortak/:konum", async (request, env, params) => {
    if (!KONUM_RE.test(params.konum)) return badRequest("konum");
    const body = await readJson<{ cihaz?: string; girdiler?: Girdi[] }>(request);
    const girdiler = Array.isArray(body.girdiler) ? body.girdiler : [];
    if (!girdiler.length) return json({ applied: 0 });
    if (girdiler.length > MAX_GIRDI) return badRequest("çok fazla girdi");
    const simdi = Date.now();
    const cihaz = typeof body.cihaz === "string" ? body.cihaz.slice(0, 64) : null;
    const stmt = env.DB.prepare(
      `INSERT INTO km_ortak (konum, anahtar, alt, deger, t, s, cihaz) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (konum, anahtar, alt) DO UPDATE SET deger = excluded.deger, t = excluded.t, s = excluded.s, cihaz = excluded.cihaz
       WHERE excluded.t > km_ortak.t`
    );
    const batch = [];
    for (const g of girdiler) {
      if (!g || typeof g.a !== "string" || !g.a.startsWith("dag_km_") || g.a.length > 120) return badRequest("anahtar");
      if (typeof g.t !== "number" || !isFinite(g.t)) return badRequest("t");
      if (g.d !== null && (typeof g.d !== "string" || g.d.length > MAX_DEGER)) return badRequest("deger");
      const alt = typeof g.alt === "string" ? g.alt.slice(0, 200) : "";
      // Cihaz saati ileri kaymışsa bir girdi sonsuza dek kazanmasın: t en fazla sunucu saati + 1 dk.
      batch.push(stmt.bind(params.konum, g.a, alt, g.d, Math.min(g.t, simdi + 60_000), simdi, cihaz));
    }
    await env.DB.batch(batch);
    // Eski günlerin kayıtlarını ara sıra temizle (ucuz, indeksli).
    if (Math.random() < 0.05) await env.DB.prepare("DELETE FROM km_ortak WHERE t < ?").bind(simdi - SAKLAMA_MS).run();
    await broadcast(env, { type: "km-ortak", deviceId: cihaz, payload: { konum: params.konum, s: simdi } }).catch(() => {});
    return json({ applied: batch.length, s: simdi });
  });
}
