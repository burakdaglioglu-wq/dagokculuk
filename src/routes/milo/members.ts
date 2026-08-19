import type { Router } from "../../router";
import { json, badRequest, notFound, readJson } from "../../lib/json";

export interface MiloMemberRow {
  grup: string;
  ad: string;
  sinif: string | null;
  cinsiyet: string | null;
  dogumTarihi: string | null;
  katilmaTarihi: string | null;
  aileMeslek: string | null;
  acilKisi: string | null;
  acilTelefon: string | null;
  antrenmanNotu: string | null;
  genelNot: string | null;
  aidatMuaf: number;
  pasif: number;
  lastModified: number;
  boy: number | null;
  kilo: number | null;
  saglikNotu: string | null;
}

/** MILO FITT KIDS uye kartlari — okculuk `athletes` tablosunun sadece genel/aidat-ilişkili
 * alanlari, ayri DB_MILO veritabaninda. Skor/coin/gamification/yay gibi okculuga ozgu hicbir
 * alan yok. Basit senkron kararı geregi merge/lastModified-guard yok — duz upsert/update. */
export function registerMiloMemberRoutes(router: Router): void {
  router.get("/api/milo/members", async (request, env) => {
    const grup = new URL(request.url).searchParams.get("grup");
    const stmt = grup
      ? env.DB_MILO.prepare("SELECT * FROM members WHERE grup = ?").bind(grup)
      : env.DB_MILO.prepare("SELECT * FROM members");
    const { results } = await stmt.all<MiloMemberRow>();
    return json({ members: results.map((r) => ({ ...r, aidatMuaf: !!r.aidatMuaf, pasif: !!r.pasif })) });
  });

  router.get("/api/milo/members/:grup/:ad", async (_request, env, params) => {
    const row = await env.DB_MILO.prepare("SELECT * FROM members WHERE grup = ? AND ad = ?").bind(params.grup, params.ad).first<MiloMemberRow>();
    return row ? json({ member: { ...row, aidatMuaf: !!row.aidatMuaf, pasif: !!row.pasif } }) : notFound("member not found");
  });

  router.post("/api/milo/members", async (request, env) => {
    const body = await readJson<{
      grup: string; ad: string; sinif?: string | null; cinsiyet?: string | null;
      dogumTarihi?: string | null; katilmaTarihi?: string | null; aileMeslek?: string | null;
      acilKisi?: string | null; acilTelefon?: string | null; antrenmanNotu?: string | null; genelNot?: string | null;
      boy?: number | null; kilo?: number | null; saglikNotu?: string | null;
    }>(request);
    if (!body.grup || !body.ad) return badRequest("grup and ad are required");

    await env.DB_MILO.prepare(
      `INSERT INTO members (grup, ad, sinif, cinsiyet, dogumTarihi, katilmaTarihi, aileMeslek, acilKisi, acilTelefon, antrenmanNotu, genelNot, boy, kilo, saglikNotu, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(grup, ad) DO UPDATE SET
         sinif = excluded.sinif, cinsiyet = excluded.cinsiyet, dogumTarihi = excluded.dogumTarihi,
         katilmaTarihi = excluded.katilmaTarihi, aileMeslek = excluded.aileMeslek, acilKisi = excluded.acilKisi,
         acilTelefon = excluded.acilTelefon, antrenmanNotu = excluded.antrenmanNotu, genelNot = excluded.genelNot,
         boy = excluded.boy, kilo = excluded.kilo, saglikNotu = excluded.saglikNotu,
         lastModified = excluded.lastModified`
    )
      .bind(
        body.grup, body.ad, body.sinif ?? null, body.cinsiyet ?? null, body.dogumTarihi ?? null,
        body.katilmaTarihi ?? null, body.aileMeslek ?? null, body.acilKisi ?? null, body.acilTelefon ?? null,
        body.antrenmanNotu ?? null, body.genelNot ?? null, body.boy ?? null, body.kilo ?? null, body.saglikNotu ?? null, Date.now()
      )
      .run();

    const member = await env.DB_MILO.prepare("SELECT * FROM members WHERE grup = ? AND ad = ?").bind(body.grup, body.ad).first<MiloMemberRow>();
    return json({ applied: true, member: member ? { ...member, aidatMuaf: !!member.aidatMuaf, pasif: !!member.pasif } : null });
  });

  const MILO_MEMBER_UPDATABLE_FIELDS = [
    "sinif", "cinsiyet", "dogumTarihi", "katilmaTarihi", "aileMeslek",
    "acilKisi", "acilTelefon", "antrenmanNotu", "genelNot", "aidatMuaf",
    "pasif", "boy", "kilo", "saglikNotu",
  ] as const;

  router.patch("/api/milo/members/:grup/:ad", async (request, env, params) => {
    const body = await readJson<Partial<Omit<MiloMemberRow, "grup" | "ad" | "lastModified">>>(request);
    const columns = Object.keys(body);
    if (!columns.length) return badRequest("no fields to update");
    const invalid = columns.filter((c) => !(MILO_MEMBER_UPDATABLE_FIELDS as readonly string[]).includes(c));
    if (invalid.length > 0) return badRequest(`invalid field(s): ${invalid.join(", ")}`);
    const setClause = columns.map((c) => `${c} = ?`).join(", ");
    const values = columns.map((c) => (body as Record<string, unknown>)[c]);
    await env.DB_MILO.prepare(`UPDATE members SET ${setClause}, lastModified = ? WHERE grup = ? AND ad = ?`)
      .bind(...values, Date.now(), params.grup, params.ad)
      .run();
    return json({ applied: true });
  });

  router.delete("/api/milo/members/:grup/:ad", async (_request, env, params) => {
    await env.DB_MILO.prepare("DELETE FROM members WHERE grup = ? AND ad = ?").bind(params.grup, params.ad).run();
    return json({ applied: true });
  });
}
