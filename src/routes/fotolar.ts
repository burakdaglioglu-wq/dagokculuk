import type { Router } from "../router";
import { json, badRequest, notFound, readJson, unauthorized } from "../lib/json";
import { yetkiliOturum } from "../auth";

// 📷 Profil fotoğrafları (2026-10-21) — bkz. migrations/0044_fotolar.sql.
//   GET  /api/fotolar          { fotolar: { anahtar: { t, izin, var } } } — küçük sürüm listesi (girişsiz okunur; görsel içermez)
//   GET  /api/foto/:anahtar     JPEG — izin 1 ise herkese (TV, Karışık Sınıf, oyunlar), değilse yalnız oturumla
//   PUT  /api/foto/:anahtar     { veri?: dataURL | null, izin?: 1 | 0 | null } — oturum ister (index.ts genel yazma kapısı)
interface FotoRow { anahtar: string; veri: string | null; izin: number | null; t: number; }
const ANAHTAR = /^(s:(buyukler|yildizlar|kucukler|minikler)\|.{1,80}|p:[A-Za-z0-9_-]{1,60})$/;
const VERI = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export function registerFotoRoutes(router: Router): void {
  router.get("/api/fotolar", async (_request, env) => {
    const { results } = await env.DB.prepare("SELECT anahtar, izin, t, veri IS NOT NULL AS var FROM fotolar").all<{ anahtar: string; izin: number | null; t: number; var: number }>();
    const fotolar: Record<string, { t: number; izin: number | null; var: boolean }> = {};
    results.forEach((r) => { fotolar[r.anahtar] = { t: r.t, izin: r.izin, var: !!r.var }; });
    return json({ fotolar });
  });

  router.get("/api/foto/:anahtar", async (request, env, params) => {
    const r = await env.DB.prepare("SELECT * FROM fotolar WHERE anahtar = ?").bind(params.anahtar).first<FotoRow>();
    if (!r || !r.veri) return notFound("foto yok");
    const acik = r.izin === 1;
    if (!acik && !(await yetkiliOturum(request, env, false))) return unauthorized("izin-yok");
    const m = /^data:(image\/[a-z]+);base64,(.*)$/.exec(r.veri);
    if (!m) return notFound("foto bozuk");
    const bin = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    return new Response(bin, {
      headers: {
        "content-type": m[1],
        // adres sürüm (?v=t) taşıdığı için içerik değişmez; izinsiz fotoğraf paylaşılan önbelleğe girmez
        "cache-control": acik ? "public, max-age=31536000, immutable" : "private, max-age=86400",
      },
    });
  });

  router.put("/api/foto/:anahtar", async (request, env, params) => {
    if (!ANAHTAR.test(params.anahtar)) return badRequest("gecersiz anahtar");
    const body = await readJson<{ veri?: string | null; izin?: number | null }>(request);
    const eski = await env.DB.prepare("SELECT * FROM fotolar WHERE anahtar = ?").bind(params.anahtar).first<FotoRow>();
    let veri = eski ? eski.veri : null, izin = eski ? eski.izin : null;
    if ("veri" in body) {
      if (body.veri === null || body.veri === "") veri = null;
      else if (typeof body.veri === "string" && VERI.test(body.veri) && body.veri.length <= 300_000) veri = body.veri;
      else return badRequest("gecersiz foto (jpeg/png/webp, en fazla ~220 KB)");
    }
    if ("izin" in body) izin = body.izin === 1 ? 1 : body.izin === 0 ? 0 : null;
    const t = Date.now();
    await env.DB.prepare(
      "INSERT INTO fotolar (anahtar, veri, izin, t) VALUES (?, ?, ?, ?) ON CONFLICT(anahtar) DO UPDATE SET veri = excluded.veri, izin = excluded.izin, t = excluded.t"
    ).bind(params.anahtar, veri, izin, t).run();
    return json({ applied: true, t, izin, var: !!veri });
  });
}
