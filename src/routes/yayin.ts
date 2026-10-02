import type { Router } from "../router";
import { json, badRequest, notFound, readJson } from "../lib/json";

/** Form Lab "Telefondan yayın al" (2026-10-03) — WebRTC eşleşme odası. Kullanıcı: "PC'den ana ekrana yansıtıyorum,
 * çocukları telefonla çekiyorum, telefondaki görüntüyü canlı buraya nasıl aktarırım".
 * Akış: bilgisayar oda açar → QR'daki kamera.html teklifini (SDP) yazar → bilgisayar cevabını yazar →
 * görüntü iki cihaz arasında doğrudan akar. Telefon tarafı oturumsuzdur; her istek oda kodu + gizli anahtar ister.
 * Telefon yeniden bağlanırsa teklif_surum artar, bilgisayar yeni teklife yeniden cevap verir. */
const OMUR_MS = 2 * 60 * 60 * 1000, SDP_SINIR = 30000;

function rastgele(n: number, harfler: string): string {
  const b = new Uint8Array(n); crypto.getRandomValues(b);
  return Array.from(b, (x) => harfler[x % harfler.length]).join("");
}
interface Oda { kod: string; gizli: string; teklif: string | null; teklif_surum: number; cevap: string | null; cevap_surum: number; olusturma: number; guncelleme: number }

async function odaAl(env: { DB: D1Database }, kod: string, gizli: string | null): Promise<Oda | null> {
  if (!gizli || !/^[A-Z0-9]{6}$/.test(kod)) return null;
  const o = await env.DB.prepare("SELECT * FROM yayin_oda WHERE kod = ?").bind(kod).first<Oda>();
  if (!o || o.gizli !== gizli || Date.now() - o.olusturma > OMUR_MS) return null;
  return o;
}

export function registerYayinRoutes(router: Router): void {
  // oda aç — oturumsuz da açılabilir (Karışık Sınıf girişsiz de açılıyor); oda rastgele kod + 32 haneli gizli anahtarla korunur
  router.post("/api/yayin", async (_request, env) => {
    await env.DB.prepare("DELETE FROM yayin_oda WHERE olusturma < ?").bind(Date.now() - OMUR_MS).run();
    const kod = rastgele(6, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"), gizli = rastgele(32, "abcdefghijklmnopqrstuvwxyz0123456789"), t = Date.now();
    await env.DB.prepare("INSERT INTO yayin_oda (kod, gizli, olusturma, guncelleme) VALUES (?, ?, ?, ?)").bind(kod, gizli, t, t).run();
    return json({ kod, gizli });
  });
  router.get("/api/yayin/:kod", async (request, env, params) => {
    const o = await odaAl(env, params.kod, new URL(request.url).searchParams.get("g"));
    if (!o) return notFound("oda yok");
    return json({ teklif: o.teklif, teklifSurum: o.teklif_surum, cevap: o.cevap, cevapSurum: o.cevap_surum }, { headers: { "cache-control": "no-store" } });
  });
  // telefon (oturumsuz, gizli anahtarla): teklif yaz
  router.put("/api/yayin/:kod/teklif", async (request, env, params) => {
    const o = await odaAl(env, params.kod, new URL(request.url).searchParams.get("g"));
    if (!o) return notFound("oda yok");
    const b = await readJson<{ sdp?: string }>(request);
    if (!b.sdp || b.sdp.length > SDP_SINIR) return badRequest("sdp");
    const surum = o.teklif_surum + 1;
    await env.DB.prepare("UPDATE yayin_oda SET teklif = ?, teklif_surum = ?, cevap = NULL, guncelleme = ? WHERE kod = ?").bind(b.sdp, surum, Date.now(), o.kod).run();
    return json({ surum });
  });
  // bilgisayar: cevap yaz (hangi teklife cevap verdiğiyle)
  router.put("/api/yayin/:kod/cevap", async (request, env, params) => {
    const o = await odaAl(env, params.kod, new URL(request.url).searchParams.get("g"));
    if (!o) return notFound("oda yok");
    const b = await readJson<{ sdp?: string; surum?: number }>(request);
    if (!b.sdp || b.sdp.length > SDP_SINIR || typeof b.surum !== "number") return badRequest("sdp");
    if (b.surum !== o.teklif_surum) return json({ eski: true }, { status: 409 });
    await env.DB.prepare("UPDATE yayin_oda SET cevap = ?, cevap_surum = ?, guncelleme = ? WHERE kod = ?").bind(b.sdp, b.surum, Date.now(), o.kod).run();
    return json({ ok: true });
  });
}
