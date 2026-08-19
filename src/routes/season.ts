import type { Router } from "../router";
import { json, readJson } from "../lib/json";
import { broadcast } from "../lib/broadcast";

interface SeasonRow {
  ad: string;
  baslangic: string | null;
  bitis: string | null;
  guncelleme: number;
}

export function registerSeasonRoutes(router: Router): void {
  router.get("/api/season", async (_request, env) => {
    const row = await env.DB.prepare("SELECT ad, baslangic, bitis, guncelleme FROM season WHERE id = 1").first<SeasonRow>();
    return json({ season: row });
  });

  router.put("/api/season", async (request, env) => {
    const body = await readJson<{ ad: string; baslangic: string | null; bitis: string | null; deviceId?: string }>(request);
    const guncelleme = Date.now();

    const current = await env.DB.prepare("SELECT guncelleme FROM season WHERE id = 1").first<{ guncelleme: number }>();
    if (current && current.guncelleme >= guncelleme) return json({ applied: false }, { status: 409 });

    await env.DB.prepare("UPDATE season SET ad = ?, baslangic = ?, bitis = ?, guncelleme = ? WHERE id = 1")
      .bind(body.ad, body.baslangic, body.bitis, guncelleme)
      .run();

    await broadcast(env, {
      type: "season-changed",
      deviceId: body.deviceId ?? null,
      payload: { ad: body.ad, baslangic: body.baslangic, bitis: body.bitis, guncelleme },
    });
    return json({ applied: true, guncelleme });
  });
}
