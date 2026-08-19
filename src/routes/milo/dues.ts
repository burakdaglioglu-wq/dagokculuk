import type { Router } from "../../router";
import { json, badRequest, readJson } from "../../lib/json";

interface MiloDuesRow {
  ad: string;
  ay: string;
  odendi: number;
  tutar: number | null;
  tarih: string | null;
  notMetin: string | null;
  odemeTarihi: string | null;
}

/** MILO FITT KIDS aidat — okculuktaki dues.ts ile ayni sekil/upsert deseni, ayri DB_MILO'da. */
export function registerMiloDuesRoutes(router: Router): void {
  router.get("/api/milo/dues", async (request, env) => {
    const ad = new URL(request.url).searchParams.get("ad");
    const stmt = ad ? env.DB_MILO.prepare("SELECT * FROM dues WHERE ad = ?").bind(ad) : env.DB_MILO.prepare("SELECT * FROM dues");
    const { results } = await stmt.all<MiloDuesRow>();
    return json({ dues: results.map((r) => ({ ...r, odendi: !!r.odendi })) });
  });

  router.put("/api/milo/dues/:ad/:ay", async (request, env, params) => {
    const body = await readJson<{ odendi: boolean; tutar?: number | null; tarih?: string | null; notMetin?: string | null; odemeTarihi?: string | null }>(request);
    if (typeof body.odendi !== "boolean") return badRequest("odendi is required");

    await env.DB_MILO.prepare(
      `INSERT INTO dues (ad, ay, odendi, tutar, tarih, notMetin, odemeTarihi) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(ad, ay) DO UPDATE SET
         odendi = excluded.odendi, tutar = excluded.tutar, tarih = excluded.tarih, notMetin = excluded.notMetin, odemeTarihi = excluded.odemeTarihi`
    )
      .bind(params.ad, params.ay, body.odendi ? 1 : 0, body.tutar ?? null, body.tarih ?? null, body.notMetin ?? null, body.odemeTarihi ?? null)
      .run();

    return json({ applied: true });
  });
}
