import type { Router } from "../router";
import type { Env } from "../env";
import { json, unauthorized } from "../lib/json";
import { oturumBul } from "../lib/giris";

/** Instagram bağlantısı (2026-11-12). Meta'nın yeni uygulamalarında Instagram-login yolu yok → Facebook Login for Business
 * (yapılandırma = IG_CONFIG_ID). Akış: yönetici "Bağla"ya basar → POST /api/instagram/baslat tek kullanımlık state üretir →
 * Facebook izin penceresi → GET /api/instagram/donus?code&state → sunucu code'u App Secret ile anahtara çevirir, 60 günlüğe
 * uzatır, sayfa anahtarını (süresiz) ve bağlı Instagram hesabını kaydeder. Hiçbir anahtar istemciye dönmez.
 *   POST /api/instagram/baslat   (yönetici)  → { url }
 *   GET  /api/instagram/donus    (Facebook dönüşü, oturumsuz; state ile korunur) → HTML
 *   GET  /api/instagram/durum    (oturumlu okuma) → { bagli, sayfa, kullanici, tarih, bitis }
 *   POST /api/instagram/kes      (yönetici) → bağlantıyı siler */
const GRAPH = "https://graph.facebook.com";
const STATE_SURE = 10 * 60 * 1000;
const NO_STORE = { "cache-control": "no-store" };

function donusAdresi(request: Request): string {
  return new URL(request.url).origin + "/api/instagram/donus";
}

async function graph<T>(yol: string, params: Record<string, string>): Promise<T> {
  const u = new URL(GRAPH + yol);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u.toString());
  const d = (await r.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!r.ok || d.error) throw new Error((d.error && d.error.message) || "Graph " + r.status);
  return d;
}

function sayfa(baslik: string, govde: string, iyi: boolean): Response {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Instagram bağlantısı</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#170803;color:#FFF1E6;font-family:system-ui,sans-serif;padding:16px}
.k{max-width:440px;background:#2A1208;border-radius:20px;padding:28px;box-shadow:inset 0 0 0 1.5px rgba(253,142,1,.3);text-align:center}
h1{font-size:24px;margin:8px 0}p{color:#D6A88A;line-height:1.5}.i{font-size:48px}a{display:inline-block;margin-top:12px;padding:12px 20px;border-radius:12px;background:#FD8E01;color:#1A0700;font-weight:800;text-decoration:none}</style></head>
<body><div class="k"><div class="i">${iyi ? "✅" : "⚠️"}</div><h1>${esc(baslik)}</h1><p>${esc(govde)}</p><a href="/app.html">Uygulamaya dön</a></div></body></html>`;
  return new Response(html, { status: iyi ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8", ...NO_STORE } });
}

async function yoneticiMi(request: Request, env: Env) {
  const o = await oturumBul(request, env.DB);
  return o && o.rol === "yonetici" ? o : null;
}

export function registerInstagramRoutes(router: Router): void {
  router.post("/api/instagram/baslat", async (request, env) => {
    const o = await yoneticiMi(request, env);
    if (!o) return unauthorized("yonetici-gerekli");
    if (!env.IG_APP_ID || !env.IG_APP_SECRET || !env.IG_CONFIG_ID) return json({ error: "ayar-eksik" }, { status: 503 });
    const b = new Uint8Array(24); crypto.getRandomValues(b);
    const state = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    await env.DB.prepare("DELETE FROM instagram_state WHERE olusturma < ?").bind(Date.now() - STATE_SURE).run();
    await env.DB.prepare("INSERT INTO instagram_state (state, ad, olusturma) VALUES (?, ?, ?)").bind(state, o.ad, Date.now()).run();
    const u = new URL("https://www.facebook.com/dialog/oauth");
    u.searchParams.set("client_id", env.IG_APP_ID);
    u.searchParams.set("config_id", env.IG_CONFIG_ID);
    u.searchParams.set("redirect_uri", donusAdresi(request));
    u.searchParams.set("response_type", "code");
    u.searchParams.set("override_default_response_type", "true");
    u.searchParams.set("state", state);
    return json({ url: u.toString() }, { headers: NO_STORE });
  });

  router.get("/api/instagram/donus", async (request, env) => {
    const q = new URL(request.url).searchParams;
    const state = q.get("state") || "", code = q.get("code") || "";
    if (q.get("error")) return sayfa("Bağlantı iptal edildi", "Facebook izin penceresinde onay verilmedi. Uygulamadan tekrar deneyebilirsin.", false);
    if (!/^[0-9a-f]{48}$/.test(state) || !code) return sayfa("Geçersiz istek", "Bu bağlantı eksik ya da bozuk. Uygulamadaki “Instagram'ı bağla” düğmesinden yeniden başla.", false);
    const s = await env.DB.prepare("DELETE FROM instagram_state WHERE state = ? RETURNING ad, olusturma").bind(state).first<{ ad: string; olusturma: number }>();
    if (!s || Date.now() - s.olusturma > STATE_SURE) return sayfa("Süresi doldu", "Bu bağlantı 10 dakika içinde kullanılmalıydı. Uygulamadan yeniden başla.", false);
    try {
      const kisa = await graph<{ access_token: string }>("/oauth/access_token", { client_id: env.IG_APP_ID!, client_secret: env.IG_APP_SECRET!, redirect_uri: donusAdresi(request), code });
      const uzun = await graph<{ access_token: string; expires_in?: number }>("/oauth/access_token", { grant_type: "fb_exchange_token", client_id: env.IG_APP_ID!, client_secret: env.IG_APP_SECRET!, fb_exchange_token: kisa.access_token });
      const hesaplar = await graph<{ data: { id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }[] }>(
        "/me/accounts", { fields: "id,name,access_token,instagram_business_account{id,username}", access_token: uzun.access_token });
      const liste = hesaplar.data || [];
      const sec = liste.find((p) => p.instagram_business_account) || liste[0];
      if (!sec) return sayfa("Facebook sayfası bulunamadı", "İzin penceresinde bir Facebook sayfası seçilmedi ya da hesabının yönettiği sayfa yok. Instagram hesabının bir Facebook sayfasına bağlı olması gerekiyor.", false);
      const ig = sec.instagram_business_account || null;
      const bitis = uzun.expires_in ? Date.now() + uzun.expires_in * 1000 : Date.now() + 60 * 86400000;
      await env.DB.prepare(`INSERT INTO instagram_baglanti (id, sayfa_id, sayfa_ad, sayfa_token, ig_id, ig_kullanici, kullanici_token, kullanici_bitis, baglayan, tarih)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET sayfa_id=excluded.sayfa_id, sayfa_ad=excluded.sayfa_ad, sayfa_token=excluded.sayfa_token, ig_id=excluded.ig_id,
          ig_kullanici=excluded.ig_kullanici, kullanici_token=excluded.kullanici_token, kullanici_bitis=excluded.kullanici_bitis, baglayan=excluded.baglayan, tarih=excluded.tarih`)
        .bind(sec.id, sec.name, sec.access_token, ig ? ig.id : null, ig ? ig.username || null : null, uzun.access_token, bitis, s.ad, Date.now()).run();
      if (!ig) return sayfa("Sayfa bağlandı, Instagram yok", `“${sec.name}” sayfası bağlandı ama ona bağlı bir Instagram iş hesabı görünmüyor. Instagram'ı bu sayfaya bağlayıp tekrar dene.`, false);
      return sayfa("Instagram bağlandı", `@${ig.username || ig.id} hesabı “${sec.name}” sayfası üzerinden bağlandı. Artık bu pencereyi kapatabilirsin.`, true);
    } catch (e) {
      return sayfa("Bağlanamadı", "Facebook şu cevabı verdi: " + (e as Error).message, false);
    }
  });

  router.get("/api/instagram/durum", async (_request, env) => {
    const r = await env.DB.prepare("SELECT sayfa_ad, ig_kullanici, ig_id, tarih, kullanici_bitis, baglayan FROM instagram_baglanti WHERE id = 1").first<{ sayfa_ad: string; ig_kullanici: string | null; ig_id: string | null; tarih: number; kullanici_bitis: number; baglayan: string }>();
    return json(r ? { bagli: !!r.ig_id, sayfa: r.sayfa_ad, kullanici: r.ig_kullanici, tarih: r.tarih, bitis: r.kullanici_bitis, baglayan: r.baglayan } : { bagli: false }, { headers: NO_STORE });
  });

  router.post("/api/instagram/kes", async (request, env) => {
    if (!(await yoneticiMi(request, env))) return unauthorized("yonetici-gerekli");
    await env.DB.prepare("DELETE FROM instagram_baglanti WHERE id = 1").run();
    return json({ ok: true });
  });
}

