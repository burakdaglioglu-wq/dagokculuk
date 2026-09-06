import type { Router } from "../../router";
import { json, badRequest, readJson } from "../../lib/json";

interface MiloSlotRow {
  id: number;
  grup: string;
  gun: number; // LEGACY, artık OKUNMUYOR — bkz. antrenman_programi_gun (migrations_milo/0007)
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
 * (2026-08-20 genisleme: roster/katilimci, tek-seferlik iptal/istisna, kapasite, ders plani; aynı gün
 * "haftada birden fazla gün" desteği eklendi) — ayri DB_MILO'da, Milo'nun kendi kurulu deseniyle (DB
 * erisimi ayri bir db/ dosyasina degil, dogrudan bu route dosyasinin icinde — Milo'nun DIGER TUM
 * modulleri ayni sekilde). v1'de hatirlatma cron'u yok (bkz. plan — push/reminder kapsam disi), bu
 * turda da eklenmedi — bu yüzden ana app'teki reminders.ts'e karşılık gelen bir güncelleme burada YOK. */
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
    const { results: gunRows } = await env.DB_MILO.prepare(`SELECT slotId, gun FROM antrenman_programi_gun`).all<{ slotId: number; gun: number }>();
    const gunBySlot = new Map<number, number[]>();
    for (const g of gunRows) {
      if (!gunBySlot.has(g.slotId)) gunBySlot.set(g.slotId, []);
      gunBySlot.get(g.slotId)!.push(g.gun);
    }
    return json({
      slots: slots.map((s) => ({
        ...s,
        katilimcilar: bySlot.get(s.id) ?? [],
        istisnalar: istisnaBySlot.get(s.id) ?? [],
        gunler: (gunBySlot.get(s.id) ?? [s.gun]).slice().sort((a, b) => a - b),
      })),
    });
  });

  router.post("/api/milo/antrenman-programi", async (request, env) => {
    const body = await readJson<{
      grup: string; gunler: number[]; baslangicSaat: string; bitisSaat: string; dersPlani?: string | null; kapasite?: number | null;
    }>(request);
    if (!body.grup || !Array.isArray(body.gunler) || !body.gunler.length || !body.baslangicSaat || !body.bitisSaat) {
      return badRequest("grup, gunler (non-empty array), baslangicSaat, bitisSaat are required");
    }
    const now = Date.now();
    const gunLegacy = Math.min(...body.gunler);
    const res = await env.DB_MILO.prepare(
      `INSERT INTO antrenman_programi (grup, gun, baslangicSaat, bitisSaat, hatirlatmaAktif, hatirlatmaDakika, sonHatirlatmaTarihi, dersPlani, kapasite, olusturulma, guncelleme)
       VALUES (?, ?, ?, ?, 0, 30, NULL, ?, ?, ?, ?)`
    )
      .bind(body.grup, gunLegacy, body.baslangicSaat, body.bitisSaat, body.dersPlani ?? null, body.kapasite ?? null, now, now)
      .run();
    const id = res.meta.last_row_id as number;
    for (const gun of body.gunler) {
      await env.DB_MILO.prepare(`INSERT OR IGNORE INTO antrenman_programi_gun (slotId, gun) VALUES (?, ?)`).bind(id, gun).run();
    }
    return json({ applied: true, id });
  });

  const MILO_SLOT_UPDATABLE_FIELDS = ["grup", "baslangicSaat", "bitisSaat", "dersPlani", "kapasite"] as const;

  router.put("/api/milo/antrenman-programi/:id", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const body = await readJson<Partial<Pick<MiloSlotRow, (typeof MILO_SLOT_UPDATABLE_FIELDS)[number]>> & { gunler?: number[] }>(request);
    const { gunler, ...rest } = body;
    if (gunler !== undefined && !gunler.length) return badRequest("gunler cannot be empty");
    const columns = Object.keys(rest);
    const invalid = columns.filter((c) => !(MILO_SLOT_UPDATABLE_FIELDS as readonly string[]).includes(c));
    if (invalid.length > 0) return badRequest(`invalid field(s): ${invalid.join(", ")}`);
    if (!columns.length && !gunler) return badRequest("no fields to update");

    if (columns.length || gunler) {
      const setCols = columns.map((c) => `${c} = ?`);
      const values: unknown[] = columns.map((c) => (rest as Record<string, unknown>)[c]);
      if (gunler !== undefined) {
        setCols.push("gun = ?");
        values.push(Math.min(...gunler));
      }
      setCols.push("guncelleme = ?");
      values.push(Date.now());
      values.push(id);
      await env.DB_MILO.prepare(`UPDATE antrenman_programi SET ${setCols.join(", ")} WHERE id = ?`)
        .bind(...values)
        .run();
    }
    if (gunler !== undefined) {
      await env.DB_MILO.prepare(`DELETE FROM antrenman_programi_gun WHERE slotId = ?`).bind(id).run();
      for (const gun of gunler) {
        await env.DB_MILO.prepare(`INSERT OR IGNORE INTO antrenman_programi_gun (slotId, gun) VALUES (?, ?)`).bind(id, gun).run();
      }
    }
    return json({ applied: true });
  });

  router.delete("/api/milo/antrenman-programi/:id", async (_request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    // D1/SQLite'ta ON DELETE CASCADE PRAGMA foreign_keys=ON olmadikca garanti degil — ana app'teki
    // deleteSlot() ile AYNI sekilde katilimci/istisna/gun satirlari burada ACIKCA temizleniyor.
    await env.DB_MILO.prepare("DELETE FROM antrenman_programi_katilimci WHERE slotId = ?").bind(id).run();
    await env.DB_MILO.prepare("DELETE FROM antrenman_programi_istisna WHERE slotId = ?").bind(id).run();
    await env.DB_MILO.prepare("DELETE FROM antrenman_programi_gun WHERE slotId = ?").bind(id).run();
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
