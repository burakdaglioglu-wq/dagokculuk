import type { Router } from "../router";
import type { Env } from "../env";
import { json, badRequest, readJson, unauthorized } from "../lib/json";

// 🔑 Sporcu girişleri + sporcunun kendi fotoğrafı (2026-10-25) — bkz. migrations/0045_sporcu_giris.sql.
//   POST /api/sporcu-giris            { grup, ad, kod } — girişsiz; kod doğruysa son giriş yazılır. { ok, kapali? }
//   GET  /api/sporcu-girisler         { liste: { 'grup|ad': { kapali, son, sayi } } } — oturum ister (index.ts)
//   PUT  /api/sporcu-giris/:anahtar   { kapali } — oturum ister (index.ts genel yazma kapısı)
//   PUT  /api/foto-sporcu             { grup, ad, kod, veri } — girişsiz; sporcu kendi fotoğrafını değiştirir (veli izni değişmez)
// Kod kontrolü istemcideki girişle aynı: athletes.kod, yoksa doğum yılı.
const GRUP = /^(buyukler|yildizlar|kucukler|minikler)$/;
const VERI = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export async function sporcuKodDogru(env: Env, grup: string, ad: string, kod: unknown): Promise<boolean> {
  if (!GRUP.test(grup) || !ad || kod == null || String(kod).trim() === "") return false;
  const r = await env.DB.prepare("SELECT kod, dogumYili FROM athletes WHERE grup = ? AND ad = ?").bind(grup, ad).first<{ kod: string | null; dogumYili: number | null }>();
  if (!r) return false;
  const dogru = String(r.kod || r.dogumYili || "").trim();
  return dogru !== "" && dogru === String(kod).trim();
}
async function girisKapali(env: Env, anahtar: string): Promise<boolean> {
  const r = await env.DB.prepare("SELECT kapali FROM sporcu_giris WHERE anahtar = ?").bind(anahtar).first<{ kapali: number }>();
  return !!r && r.kapali === 1;
}

export function registerSporcuGirisRoutes(router: Router): void {
  router.post("/api/sporcu-giris", async (request, env) => {
    const b = await readJson<{ grup: string; ad: string; kod: string }>(request);
    if (!(await sporcuKodDogru(env, b.grup, b.ad, b.kod))) return json({ ok: false, sebep: "kod" });
    const anahtar = b.grup + "|" + b.ad;
    if (await girisKapali(env, anahtar)) return json({ ok: false, kapali: true });
    await env.DB.prepare(
      "INSERT INTO sporcu_giris (anahtar, son, sayi) VALUES (?, ?, 1) ON CONFLICT(anahtar) DO UPDATE SET son = excluded.son, sayi = sayi + 1"
    ).bind(anahtar, Date.now()).run();
    return json({ ok: true });
  });

  router.get("/api/sporcu-girisler", async (_request, env) => {
    const { results } = await env.DB.prepare("SELECT anahtar, kapali, son, sayi FROM sporcu_giris").all<{ anahtar: string; kapali: number; son: number | null; sayi: number }>();
    const liste: Record<string, { kapali: boolean; son: number | null; sayi: number }> = {};
    results.forEach((r) => { liste[r.anahtar] = { kapali: r.kapali === 1, son: r.son, sayi: r.sayi }; });
    return json({ liste });
  });

  router.put("/api/sporcu-giris/:anahtar", async (request, env, params) => {
    const [grup] = params.anahtar.split("|");
    if (!GRUP.test(grup || "")) return badRequest("gecersiz anahtar");
    const b = await readJson<{ kapali: boolean }>(request);
    await env.DB.prepare(
      "INSERT INTO sporcu_giris (anahtar, kapali) VALUES (?, ?) ON CONFLICT(anahtar) DO UPDATE SET kapali = excluded.kapali"
    ).bind(params.anahtar, b.kapali ? 1 : 0).run();
    return json({ applied: true, kapali: !!b.kapali });
  });

  router.put("/api/foto-sporcu", async (request, env) => {
    const b = await readJson<{ grup: string; ad: string; kod: string; veri: string | null }>(request);
    if (!(await sporcuKodDogru(env, b.grup, b.ad, b.kod))) return unauthorized("kod");
    const anahtar = "s:" + b.grup + "|" + b.ad;
    if (await girisKapali(env, b.grup + "|" + b.ad)) return unauthorized("kapali");
    let veri: string | null = null;
    if (b.veri) {
      if (typeof b.veri !== "string" || !VERI.test(b.veri) || b.veri.length > 300_000) return badRequest("gecersiz foto (jpeg/png/webp, en fazla ~220 KB)");
      veri = b.veri;
    }
    const t = Date.now();
    // izin (veli izni) yalnız yöneticide — mevcut değer korunur
    await env.DB.prepare(
      "INSERT INTO fotolar (anahtar, veri, izin, t) VALUES (?, ?, NULL, ?) ON CONFLICT(anahtar) DO UPDATE SET veri = excluded.veri, t = excluded.t"
    ).bind(anahtar, veri, t).run();
    const r = await env.DB.prepare("SELECT izin FROM fotolar WHERE anahtar = ?").bind(anahtar).first<{ izin: number | null }>();
    return json({ applied: true, t, izin: r ? r.izin : null, var: !!veri });
  });
}
