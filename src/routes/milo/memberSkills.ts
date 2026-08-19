import type { Router } from "../../router";
import { json, badRequest, readJson } from "../../lib/json";

interface MiloMemberSkillRow {
  ad: string;
  dersId: string;
  durum: "henuz_degil" | "gelisiyor" | "ogrendi";
  guncelleme: number;
  baslik: string;
  tip: string;
  seviye: string;
}

/** MILO FITT KIDS beceri takibi — Dersler sekmesindeki hareketleri (ders_icerikleri, salt-okunur
 * JOIN) her uyeye (ad ile, grup ile DEGIL — bkz. members.ts'teki grup-degisim upsert+delete deseni)
 * bagliyor. Yeni bir tablo, mevcut ders_icerikleri route'larina hic dokunulmuyor. */
export function registerMiloMemberSkillsRoutes(router: Router): void {
  router.get("/api/milo/member-skills", async (request, env) => {
    const ad = new URL(request.url).searchParams.get("ad");
    const stmt = ad
      ? env.DB_MILO.prepare(
          `SELECT s.ad, s.dersId, s.durum, s.guncelleme, d.baslik, d.tip, d.seviye
           FROM member_skills s JOIN ders_icerikleri d ON d.id = s.dersId WHERE s.ad = ?`
        ).bind(ad)
      : env.DB_MILO.prepare(
          `SELECT s.ad, s.dersId, s.durum, s.guncelleme, d.baslik, d.tip, d.seviye
           FROM member_skills s JOIN ders_icerikleri d ON d.id = s.dersId`
        );
    const { results } = await stmt.all<MiloMemberSkillRow>();
    return json({ skills: results });
  });

  router.put("/api/milo/member-skills/:ad/:dersId", async (request, env, params) => {
    const body = await readJson<{ durum: string }>(request);
    if (!["henuz_degil", "gelisiyor", "ogrendi"].includes(body.durum)) return badRequest("gecersiz durum");

    await env.DB_MILO.prepare(
      `INSERT INTO member_skills (ad, dersId, durum, guncelleme) VALUES (?, ?, ?, ?)
       ON CONFLICT(ad, dersId) DO UPDATE SET durum = excluded.durum, guncelleme = excluded.guncelleme`
    )
      .bind(params.ad, params.dersId, body.durum, Date.now())
      .run();

    return json({ applied: true });
  });
}