import type { Env } from "../env";

/** 🎬 Tanıtım sitesi videoları: /video/<ad>.mp4 → /site-video/<ad>.mp4 dosyası, Range (206) desteğiyle.
 * Neden: statik dosya sunumu Range başlığını yok sayıp 200 dönüyor; iPhone/Safari videoyu Range olmadan OYNATMAZ. */
export async function siteVideo(request: Request, env: Env, ad: string): Promise<Response> {
  if (!/^[a-z0-9-]+$/.test(ad)) return new Response("Bulunamadı", { status: 404 });
  const kok = new URL(request.url).origin;
  const dosya = await env.ASSETS.fetch(new Request(`${kok}/site-video/${ad}.mp4`, { method: "GET" }));
  if (!dosya.ok || !(dosya.headers.get("content-type") || "").startsWith("video/")) return new Response("Bulunamadı", { status: 404 });
  const veri = await dosya.arrayBuffer();
  const boy = veri.byteLength;
  const bas: Record<string, string> = { "content-type": "video/mp4", "accept-ranges": "bytes", "cache-control": "public, max-age=86400" };
  const gonder = (govde: ArrayBuffer | null, status: number) => new Response(request.method === "HEAD" ? null : govde, { status, headers: bas });
  const r = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
  if (!r || (!r[1] && !r[2])) { bas["content-length"] = String(boy); return gonder(veri, 200); }
  let ilk = r[1] ? Number(r[1]) : Math.max(0, boy - Number(r[2]));
  const son = r[1] && r[2] ? Math.min(Number(r[2]), boy - 1) : boy - 1;
  if (ilk > son || ilk >= boy) { bas["content-range"] = `bytes */${boy}`; return gonder(null, 416); }
  bas["content-range"] = `bytes ${ilk}-${son}/${boy}`;
  bas["content-length"] = String(son - ilk + 1);
  return gonder(veri.slice(ilk, son + 1), 206);
}
