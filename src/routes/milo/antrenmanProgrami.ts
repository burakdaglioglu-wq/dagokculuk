import type { Router } from "../../router";
import { json, badRequest, readJson } from "../../lib/json";

interface MiloSlotRow {
  id: number;
  grup: string;
  gun: number;
  baslangicSaat: string;
  bitisSaat: string;
  hatirlatmaAktif: number;
  hatirlatmaDakika: number;
  sonHatirlatmaTarihi: string | null;
  dersPlani: string | null;
  kapasite: number | null;
  olusturulma: number;
  guncelleme: number;
}

/** MILO FITT KIDS antrenman programi — okculuktaki antrenmanProgrami.ts ile AYNI ozellik seti
 * (2026-08-20 genisleme: roster/katilimci, tek-seferlik iptal/istisna, kapasite, ders plani) — ayri
 * DB_MILO'da, Milo'nun kendi kurulu deseniyle (DB erisimi ayri bir db/ dosyasina degil, dogrudan bu
 * route dosyasinin icinde — Milo'nun DIGER TUM modulleri ayni sekilde). v1'de hatirlatma cron'u yok
 * (bkz. plan — push/reminder kapsam disi), bu turda da eklenmedi. */
export function registerMiloAntrenmanProgramiRoutes(router: Router): void {
  router.get("/api/milo/antrenman-programi", async (request, env) => {
    const grup = new URL(request.url).searchParams.get("grup");
    const stmt = grup
      ? env.DB_MILO.prepare("SELECT * FROM antrenman_programi WHERE grup = ? ORDER BY gun, baslangicSaat").bind(grup)
      : env.DB_MILO.prepare("SELECT * FROM antrenman_programi ORDER BY grup, gun, baslangicSaat");
    const { results: slots } = await stmt.all<MiloSlotRow>();
    if (!slots.length) return json({ slots: [] });

    // Ana app'teki listByGrupWithKatilimcilar ile AYNI "tek istekte hepsi" deseni — N+1 fetch olmasin.
    const { results: katilimcilar } = await env.DB_MILO.prepare(
      `SELECT slotId, grup, ad FROM antrenman_programi_katilimci`
    ).all<{ slotId: number; grup: string; ad: string }>();
    const bySlot = new Map<number, { grup: string; ad: string }[]>();
    for (const k of katilimcilar) {
      if (!bySlot.has(k.slotId)) bySlot.set(k.slotId, []);
      bySlot.get(k.slotId)!.push({ grup: k.grup, ad: k.ad });
    }
    const { results: istisnalar } = await env.DB_MILO.prepare(
      `SELECT slotId, tarih, sebep FROM antrenman_programi_istisna`
    ).all<{ slotId: number; tarih: string; sebep: string | null }>();
    const istisnaBySlot = new Map<number, { tarih: string; sebep: string | null }[]>();
    for (const i of istisnalar) {
      if (!istisnaBySlot.has(i.slotId)) istisnaBySlot.set(i.slotId, []);
      istisnaBySlot.get(i.slotId)!.push({ tarih: i.tarih, sebep: i.sebep });
    }
    return json({
      slots: slots.map((s) => ({ ...s, katilimcilar: bySlot.get(s.id) ?? [], istisnalar: istisnaBySlot.get(s.id) ?? [] })),
    });
  });

  router.post("/api/milo/antrenman-programi", async (request, env) => {
    const body = await readJson<{
      grup: string; gun: number; baslangicSaat: string; bitisSaat: string; dersPlani?: string | null; kapasite?: number | null;
    }>(request);
    if (!body.grup || body.gun === undefined || body.gun === null || !body.baslangicSaat || !body.bitisSaat) {
      return badRequest("grup, gun, baslangicSaat, bitisSaat are required");
    }
    const now = Date.now();
    const res = await env.DB_MILO.prepare(
      `INSERT INTO antrenman_programi (grup, gun, baslangicSaat, bitisSaat, hatirlatmaAktif, hatirlatmaDakika, sonHatirlatmaTarihi, dersPlani, kapasite, olusturulma, guncelleme)
       VALUES (?, ?, ?, ?, 0, 30, NULL, ?, ?, ?, ?)`
    )
      .bind(body.grup, body.gun, body.baslangicSaat, body.bitisSaat, body.dersPlani ?? null, body.kapasite ?? null, now, now)
      .run();
    return json({ applied: true, id: res.meta.last_row_id });
  });

  const MILO_SLOT_UPDATABLE_FIELDS = ["grup", "gun", "baslangicSaat", "bitisSaat", "dersPlani", "kapasite"] as const;

  router.put("/api/milo/antrenman-programi/:id", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const body = await readJson<Partial<Pick<MiloSlotRow, (typeof MILO_SLOT_UPDATABLE_FIELDS)[number]>>>(request);
    const columns = Object.keys(body);
    if (!columns.length) return badRequest("no fields to update");
    const invalid = columns.filter((c) => !(MILO_SLOT_UPDATABLE_FIELDS as readonly string[]).includes(c));
    if (invalid.length > 0) return badRequest(`invalid field(s): ${invalid.join(", ")}`);
    const setClause = columns.map((c) => `${c} = ?`).join(", ");
    const values = columns.map((c) => (body as Record<string, unknown>)[c]);
    await env.DB_MILO.prepare(`UPDATE antrenman_programi SET ${setClause}, guncelleme = ? WHERE id = ?`)
      .bind(...values, Date.now(), id)
      .run();
    return json({ applied: true });
  });

  router.delete("/api/milo/antrenman-programi/:id", async (_request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    // D1/SQLite'ta ON DELETE CASCADE PRAGMA foreign_keys=ON olmadikca garanti degil — ana app'teki
    // deleteSlot() ile AYNI sekilde katilimci/istisna satirlari burada ACIKCA temizleniyor.
    await env.DB_MILO.prepare("DELETE FROM antrenman_programi_katilimci WHERE slotId = ?").bind(id).run();
    await env.DB_MILO.prepare("DELETE FROM antrenman_programi_istisna WHERE slotId = ?").bind(id).run();
    await env.DB_MILO.prepare("DELETE FROM antrenman_programi WHERE id = ?").bind(id).run();
    return json({ applied: true });
  });

  router.post("/api/milo/antrenman-programi/:id/katilimci", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const body = await readJson<{ grup: string; ad: string }>(request);
    if (!body.grup || !body.ad) return badRequest("grup, ad are required");
    await env.DB_MILO.prepare(
      `INSERT OR IGNORE INTO antrenman_programi_katilimci (slotId, grup, ad, eklenme) VALUES (?, ?, ?, ?)`
    )
      .bind(id, body.grup, body.ad, Date.now())
      .run();
    return json({ applied: true });
  });

  router.delete("/api/milo/antrenman-programi/:id/katilimci", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const url = new URL(request.url);
    const grup = url.searchParams.get("grup");
    const ad = url.searchParams.get("ad");
    if (!grup || !ad) return badRequest("grup, ad are required");
    await env.DB_MILO.prepare(`DELETE FROM antrenman_programi_katilimci WHERE slotId = ? AND grup = ? AND ad = ?`)
      .bind(id, grup, ad)
      .run();
    return json({ applied: true });
  });

  router.post("/api/milo/antrenman-programi/:id/istisna", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const body = await readJson<{ tarih: string; sebep?: string }>(request);
    if (!body.tarih) return badRequest("tarih is required");
    await env.DB_MILO.prepare(
      `INSERT INTO antrenman_programi_istisna (slotId, tarih, sebep, olusturulma) VALUES (?, ?, ?, ?)
       ON CONFLICT(slotId, tarih) DO UPDATE SET sebep = excluded.sebep`
    )
      .bind(id, body.tarih, body.sebep ?? null, Date.now())
      .run();
    return json({ applied: true });
  });

  router.delete("/api/milo/antrenman-programi/:id/istisna", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const tarih = new URL(request.url).searchParams.get("tarih");
    if (!tarih) return badRequest("tarih is required");
    await env.DB_MILO.prepare(`DELETE FROM antrenman_programi_istisna WHERE slotId = ? AND tarih = ?`).bind(id, tarih).run();
    return json({ applied: true });
  });
}
