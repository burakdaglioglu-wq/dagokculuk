import type { Router } from "../../router";
import { json, badRequest, readJson } from "../../lib/json";

/** MILO FITT KIDS — "bugun ne islendi" notu, tarih basina tek satir. "Kimler vardi" icin ayrica bir
 * tablo yok, o zaten attendance_auto'daki gunun geldi=1 kayitlari (Yoklama sekmesi). */
export function registerMiloGunlukNotRoutes(router: Router): void {
  router.get("/api/milo/gunluk-not/:tarih", async (_request, env, params) => {
    const row = await env.DB_MILO.prepare("SELECT notMetin FROM gunluk_ders_notu WHERE tarih = ?")
      .bind(params.tarih)
      .first<{ notMetin: string | null }>();
    return json({ notMetin: row ? row.notMetin : null });
  });

  router.put("/api/milo/gunluk-not/:tarih", async (request, env, params) => {
    const body = await readJson<{ notMetin: string | null }>(request);
    if (body.notMetin !== null && typeof body.notMetin !== "string") return badRequest("notMetin gerekli");

    await env.DB_MILO.prepare(
      `INSERT INTO gunluk_ders_notu (tarih, notMetin, guncelleme) VALUES (?, ?, ?)
       ON CONFLICT(tarih) DO UPDATE SET notMetin = excluded.notMetin, guncelleme = excluded.guncelleme`
    )
      .bind(params.tarih, body.notMetin ?? null, Date.now())
      .run();

    return json({ applied: true });
  });
}