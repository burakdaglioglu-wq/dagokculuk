import type { Router } from "../router";
import type { Env } from "../env";
import { json, badRequest, notFound, readJson, unauthorized } from "../lib/json";
import { basariliTemizle, basarisizKaydet, bytesB64u, gunluk, kilitKalan, rastgele, sha256Hex } from "../lib/giris";
import { getMeta } from "../db/meta";
import { turkiyeSaatBilgisi } from "../lib/reminders";

/** Veli ödeme ekranı (2026-11-04, public/veli.html). Kullanıcı kararları: önce DAĞ; giriş = kişiye özel link + kayıtlı telefonun son 4 hanesi;
 * veli kendi çocuğunun TUTARINI görür. Herkese açık /api/veli-rapor ve rapor.html'de tutar YOK kuralı aynen sürer: tutar yalnız buradan çıkar.
 * ASLA dönmez: notMetin (yalnız paket adı ayrıştırılır; veliye görünen not ayrı alan: veliNot), giren, telefon, kulübün diğer sporcuları.
 * Veliye yanlış borç göstermemek için: son 6 ayda hiç ödemesi olmayan (takip edilmeyen) sporcuda borç gösterilmez, 6 aydan eski ödenmemiş aylar
 * gecikmiş sayılmaz (aidatYoneticiOzet ile aynı fikir; eski aylarda dues kaydı eksik olabilir). */
const KOD = /^[A-Za-z0-9-]{8,64}$/;
const OTURUM_MS = 180 * 864e5;
const NO_STORE = { "cache-control": "no-store" };

interface DuesSatir { ay: string; odendi: number; tutar: number | null; tarih: string | null; notMetin: string | null; odemeTarihi: string | null; yontem: string | null; veliNot?: string | null }
interface Sporcu { ad: string; acilTelefon: string | null; veli2Telefon: string | null; aidatMuaf: number; pasif: number; donduruldu: number }

export const son4Al = (t: string | null | undefined): string | null => { const d = String(t || "").replace(/\D/g, ""); return d.length >= 7 ? d.slice(-4) : null; };
const ayEkle = (a: string, n: number) => { const [y, m] = a.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"); };
const paketAy = (n: string | null): number => { if (!n || !n.startsWith("📦")) return 0; const m = /📦\s*(\d+)\s*aylık/.exec(n); return m ? +m[1] : (/Yıllık/i.test(n) ? 12 : 1); };

/** Saf hesap: testlenebilir, veritabanına dokunmaz. */
export function veliOdemeHesap(g: { dues: DuesSatir[]; muaf: boolean; kapali: boolean; varsayilan: number; bugun: string; yil: number }) {
  const buAy = g.bugun.slice(0, 7), sinir = ayEkle(buAy, -6), m: Record<string, DuesSatir> = {};
  g.dues.forEach((d) => { m[d.ay] = d; });
  const odenen = g.dues.filter((d) => d.odendi).sort((a, b) => a.ay.localeCompare(b.ay));
  const ilk = odenen[0]?.ay || null;
  const takipli = !g.muaf && !g.kapali && odenen.some((d) => d.ay >= sinir);
  const durum = (ay: string): string => {
    const r = m[ay];
    if (r?.odendi) return "odendi";
    if ((r?.notMetin || "").startsWith("❄️")) return "dondu";
    if (g.muaf) return "muaf";
    if (!takipli) return "yok";
    if (ay > buAy) return "gelecek";
    if (ay < sinir || (ilk && ay < ilk)) return "yok";
    return "bekleniyor";
  };
  const tarihAl = (d: DuesSatir) => (d.odemeTarihi || d.tarih || "").slice(0, 10) || null;
  // Aylık karşılık: son tutarlı ödeme, paketse aya bölünür; hiç yoksa kulübün varsayılanı. Ödenmemiş kayıttaki tutar o ayın beklenenidir.
  const sonTutarli = [...odenen].reverse().find((d) => d.tutar);
  const aylik = sonTutarli ? Math.round(sonTutarli.tutar! / Math.max(1, paketAy(sonTutarli.notMetin) || 1)) : (g.varsayilan || null);
  const aylar = Array.from({ length: 12 }, (_, i) => {
    const ay = g.yil + "-" + String(i + 1).padStart(2, "0"), r = m[ay], d = durum(ay), od = d === "odendi";
    return {
      ay, durum: d,
      tutar: od ? (r!.tutar || null) : (d === "bekleniyor" || d === "gelecek" ? (r?.tutar || aylik) : null),
      tarih: od ? tarihAl(r!) : null,
      yontem: od ? (r!.yontem || null) : null,
      veliNot: od ? (r!.veliNot || null) : null, // 💬 yalnız 'Veliye not' alanı; notMetin (iç not) asla
      paket: od ? (paketAy(r!.notMetin) > 1 ? paketAy(r!.notMetin) : (paketAy(r!.notMetin) ? 1 : 0)) : 0,
    };
  });
  let siradaki: { ay: string; tutar: number | null; gun: number; gecikmis: boolean } | null = null, gecikenAy = 0;
  if (takipli) {
    const bas = ilk && ilk > sinir ? ilk : sinir;
    for (let a = bas, i = 0; i < 40; a = ayEkle(a, 1), i++) {
      const d = durum(a);
      if (d === "bekleniyor" && a < buAy) gecikenAy++;
      if ((d === "bekleniyor" || d === "gelecek") && !siradaki) {
        const fark = Math.round((Date.parse(a + "-01T00:00:00Z") - Date.parse(g.bugun + "T00:00:00Z")) / 864e5);
        siradaki = { ay: a, tutar: m[a]?.tutar || aylik, gun: fark, gecikmis: a < buAy };
      }
      if (a >= buAy && siradaki) break;
    }
  }
  const sonOdeme = [...odenen].filter((d) => d.tutar).sort((a, b) => (tarihAl(a) || a.ay).localeCompare(tarihAl(b) || b.ay)).pop() || null;
  const yilOdenen = aylar.filter((a) => a.durum === "odendi");
  return {
    muaf: g.muaf, kapali: g.kapali, takipli, bugun: g.bugun, buAy, yil: g.yil, aylar, siradaki, gecikenAy,
    son: sonOdeme ? { ay: sonOdeme.ay, tutar: sonOdeme.tutar, tarih: tarihAl(sonOdeme), yontem: sonOdeme.yontem || null, veliNot: sonOdeme.veliNot || null } : null,
    yilAySayisi: yilOdenen.length, yilToplam: yilOdenen.reduce((t, a) => t + (a.tutar || 0), 0),
    ilkYil: Math.min(ilk ? +ilk.slice(0, 4) : +g.bugun.slice(0, 4), +g.bugun.slice(0, 4)), sonYil: +g.bugun.slice(0, 4) + 1,
  };
}

async function sporcuBul(env: Env, kod: string): Promise<Sporcu | null> {
  return env.DB.prepare("SELECT ad, acilTelefon, veli2Telefon, aidatMuaf, pasif, donduruldu FROM athletes WHERE izleKodu = ?").bind(kod).first<Sporcu>();
}
const ilkAd = (ad: string) => { const a = String(ad).split(" ")[0]; return a.charAt(0) + a.slice(1).toLocaleLowerCase("tr"); };

export function registerVeliOdemeRoutes(router: Router): void {
  // Giriş ekranı için yalnız ilk ad. Aynı kodla rapor linki zaten tam adı gösteriyor.
  router.get("/api/veli-odeme/bilgi/:kod", async (_request, env, params) => {
    if (!KOD.test(params.kod)) return notFound("kod");
    const s = await sporcuBul(env, params.kod);
    if (!s) return notFound("kod");
    return json({ ad: ilkAd(s.ad), telefonVar: !!(son4Al(s.acilTelefon) || son4Al(s.veli2Telefon)) }, { headers: NO_STORE });
  });

  router.post("/api/veli-odeme/giris", async (request, env) => {
    const b = await readJson<{ kod?: string; son4?: string }>(request).catch(() => ({} as { kod?: string; son4?: string }));
    const kod = String(b.kod || ""), girilen = String(b.son4 || "").trim();
    if (!KOD.test(kod) || !/^\d{4}$/.test(girilen)) return badRequest("kod ve 4 hane gerekli");
    // Sınır yalnız linke bağlı. IP'ye bağlanmaz: telefon operatörleri ve salon Wi-Fi'ı aynı IP'yi paylaşır, linkler herkese aynı gün gider,
    // başka ailelerin yanlış denemeleri doğru numarayı yazan veliyi kilitlerdi. Kod 32 hane rastgele olduğundan koda deneme yapılamaz.
    const kAnahtar = "veli:" + kod;
    const kalan = await kilitKalan(env.DB, [kAnahtar]);
    if (kalan > 0) return json({ ok: false, sebep: "kilit", kalanMs: kalan }, { status: 429, headers: NO_STORE });
    const s = await sporcuBul(env, kod);
    const dogru = !!s && (son4Al(s.acilTelefon) === girilen || son4Al(s.veli2Telefon) === girilen);
    if (!dogru) { await basarisizKaydet(env.DB, [kAnahtar]); return json({ ok: false, sebep: "hatali" }, { status: 401, headers: NO_STORE }); }
    await basariliTemizle(env.DB, [kAnahtar]);
    const now = Date.now(), token = bytesB64u(rastgele(32));
    await env.DB.prepare("DELETE FROM veli_oturum WHERE bitis < ?").bind(now).run();
    await env.DB.prepare("INSERT INTO veli_oturum (token_ozet, izle_kodu, son4, olusturma, bitis) VALUES (?, ?, ?, ?, ?)").bind(await sha256Hex(token), kod, girilen, now, now + OTURUM_MS).run();
    await gunluk(env.DB, { ad: "Veli · " + s!.ad }, "veli-giris").catch(() => {});
    return json({ ok: true, token }, { headers: NO_STORE });
  });

  router.get("/api/veli-odeme", async (request, env) => {
    const token = request.headers.get("x-veli-oturum") || "";
    if (!token) return unauthorized("oturum-yok");
    const ozet = await sha256Hex(token);
    const o = await env.DB.prepare("SELECT izle_kodu, son4, bitis FROM veli_oturum WHERE token_ozet = ?").bind(ozet).first<{ izle_kodu: string; son4: string; bitis: number }>();
    if (!o || o.bitis < Date.now()) return unauthorized("oturum-yok");
    const s = await sporcuBul(env, o.izle_kodu);
    // Link yenilendi ya da numara değişti: oturum biter.
    if (!s || (son4Al(s.acilTelefon) !== o.son4 && son4Al(s.veli2Telefon) !== o.son4)) {
      await env.DB.prepare("DELETE FROM veli_oturum WHERE token_ozet = ?").bind(ozet).run();
      return unauthorized("oturum-yok");
    }
    const bugun = turkiyeSaatBilgisi(new Date()).tarih;
    const y = new URL(request.url).searchParams.get("yil") || "";
    const yil = /^\d{4}$/.test(y) ? +y : +bugun.slice(0, 4);
    const { results } = await env.DB.prepare("SELECT ay, odendi, tutar, tarih, notMetin, odemeTarihi, yontem, veliNot FROM dues WHERE ad = ?").bind(s.ad).all<DuesSatir>();
    let varsayilan = 0;
    try { varsayilan = parseInt(JSON.parse((await getMeta(env, "aidat_ayar")) || "{}")?.tutar?.v) || 0; } catch { /* ayar yok */ }
    return json({ ad: s.ad, ...veliOdemeHesap({ dues: results, muaf: !!s.aidatMuaf, kapali: !!s.pasif || !!s.donduruldu, varsayilan, bugun, yil }) }, { headers: NO_STORE });
  });

  router.post("/api/veli-odeme/cikis", async (request, env) => {
    const token = request.headers.get("x-veli-oturum") || "";
    if (token) await env.DB.prepare("DELETE FROM veli_oturum WHERE token_ozet = ?").bind(await sha256Hex(token)).run();
    return json({ ok: true });
  });
}
