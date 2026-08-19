import type { Router } from "../../router";
import { json, badRequest, readJson } from "../../lib/json";

interface MiloMemberRow {
  grup: string;
  ad: string;
  dogumTarihi: string | null;
  genelNot: string | null;
  pasif: number;
  devamDuzeltme: number;
}

function turkceNormalize(s: string): string {
  return (s || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .trim()
    .replace(/\s+/g, " ");
}

// Beceri sekmesindeki client tarafiyla BIREBIR ayni esikler — bkz. public/milo/app.js miloSeviyeHesapla/miloRozetleriHesapla.
function seviyeHesapla(ogrenilenSayisi: number): string {
  if (ogrenilenSayisi >= 8) return "İleri";
  if (ogrenilenSayisi >= 3) return "Gelişen";
  return "Başlangıç";
}
function rozetleriHesapla(ogrenilenSayisi: number, seviye: string): string[] {
  const rozetler: string[] = [];
  if (ogrenilenSayisi >= 1) rozetler.push("🥉 İlk Beceri");
  if (seviye === "Gelişen" || seviye === "İleri") rozetler.push("🥈 Gelişen Sporcu");
  if (seviye === "İleri") rozetler.push("🥇 İleri Seviye");
  if (ogrenilenSayisi >= 5) rozetler.push("⭐ 5 Beceri Ustası");
  return rozetler;
}

// public/milo/app.js miloSiradakiHedefler ile BIREBIR ayni esik/mantik — iki yerde senkron tutulur.
const SEVIYE_KOD: Record<string, string> = { Başlangıç: "baslangic", Gelişen: "gelisen", İleri: "ileri" };
const SONRAKI_SEVIYE: Record<string, string> = { Başlangıç: "Gelişen", Gelişen: "İleri" };
const SEVIYE_ESIK: Record<string, number> = { Başlangıç: 3, Gelişen: 8 };

/** MILO FITT KIDS sporcu girisi — PIN'siz, isim + dogum yili ile (okculuktaki sporcuGirisDene'nin
 * ayni guvenlik seviyesindeki karsiligi). TEK bilinclil acik uc: idari alanlar (acilKisi/acilTelefon/
 * aileMeslek) hicbir zaman donmez, sadece eslesen TEK sporcunun sade ozeti donuyor. */
export function registerMiloSporcuGirisiRoutes(router: Router): void {
  router.post("/api/milo/sporcu-girisi", async (request, env) => {
    const body = await readJson<{ ad: string; dogumYili: string | number }>(request);
    if (!body.ad || !body.dogumYili) return badRequest("ad ve dogumYili gerekli");

    const aranan = turkceNormalize(body.ad);
    const aranankYil = String(body.dogumYili).trim();

    const { results } = await env.DB_MILO.prepare("SELECT grup, ad, dogumTarihi, genelNot, pasif, devamDuzeltme FROM members").all<MiloMemberRow>();
    const eslesen = results.find((m) => {
      if (m.pasif) return false;
      if (turkceNormalize(m.ad) !== aranan) return false;
      const yil = m.dogumTarihi ? m.dogumTarihi.slice(0, 4) : null;
      return yil === aranankYil;
    });

    if (!eslesen) return json({ found: false });

    const devamRow = await env.DB_MILO.prepare("SELECT COUNT(*) AS c FROM attendance_auto WHERE ad = ? AND geldi = 1")
      .bind(eslesen.ad)
      .first<{ c: number }>();
    const devamSayisi = (devamRow?.c ?? 0) + (eslesen.devamDuzeltme ?? 0);

    const { results: beceriler } = await env.DB_MILO.prepare(
      `SELECT s.dersId, s.durum, d.baslik FROM member_skills s JOIN ders_icerikleri d ON d.id = s.dersId WHERE s.ad = ?`
    )
      .bind(eslesen.ad)
      .all<{ dersId: string; durum: string; baslik: string }>();

    const ogrenilenBeceriler = beceriler.filter((b) => b.durum === "ogrendi").map((b) => b.baslik);
    const gelisenBeceriler = beceriler.filter((b) => b.durum === "gelisiyor").map((b) => b.baslik);
    const ogrenilenDersIdleri = new Set(beceriler.filter((b) => b.durum === "ogrendi").map((b) => b.dersId));
    const seviye = seviyeHesapla(ogrenilenBeceriler.length);
    const rozetler = rozetleriHesapla(ogrenilenBeceriler.length, seviye);

    // ===== Sıradaki Hedefler — bir üst seviyeye geçmek için eksik beceriler =====
    let siradakiHedefler: { mesaj: string; dersler: { baslik: string }[] };
    if (seviye === "İleri") {
      siradakiHedefler = { mesaj: "🏆 En üst seviyedesin! Yeni beceriler eklemeye devam et.", dersler: [] };
    } else {
      const seviyeKodu = SEVIYE_KOD[seviye];
      const { results: adaylar } = await env.DB_MILO.prepare("SELECT id, baslik FROM ders_icerikleri WHERE seviye = ?")
        .bind(seviyeKodu)
        .all<{ id: string; baslik: string }>();
      const dersler = adaylar.filter((d) => !ogrenilenDersIdleri.has(d.id)).slice(0, 6).map((d) => ({ baslik: d.baslik }));
      const gerekenSayi = Math.max((SEVIYE_ESIK[seviye] ?? 0) - ogrenilenBeceriler.length, 0);
      siradakiHedefler = { mesaj: `${SONRAKI_SEVIYE[seviye]} seviyeye geçmek için ${gerekenSayi} beceri daha tamamlaman gerekiyor.`, dersler };
    }

    // ===== Yaş Kategorisi / Grup / Gün-Saat — sadece isim eslesirse dolar, yoksa null (hata vermez) =====
    let grupBilgisi: { yasKategorisi: string; grup: string; program: { gun: number; baslangicSaat: string; bitisSaat: string }[] } | null = null;
    const grupRow = await env.DB_MILO.prepare("SELECT id, yasKategorisiId FROM gruplar WHERE ad = ?")
      .bind(eslesen.grup)
      .first<{ id: number; yasKategorisiId: number }>();
    if (grupRow) {
      const yasRow = await env.DB_MILO.prepare("SELECT ad FROM yas_kategorileri WHERE id = ?").bind(grupRow.yasKategorisiId).first<{ ad: string }>();
      const { results: programSatirlari } = await env.DB_MILO.prepare(
        "SELECT gun, baslangicSaat, bitisSaat FROM antrenman_programi WHERE grup = ? ORDER BY gun, baslangicSaat"
      )
        .bind(eslesen.grup)
        .all<{ gun: number; baslangicSaat: string; bitisSaat: string }>();
      grupBilgisi = { yasKategorisi: yasRow?.ad ?? "", grup: eslesen.grup, program: programSatirlari };
    }

    return json({
      found: true,
      sporcu: {
        ad: eslesen.ad,
        grup: eslesen.grup,
        devamSayisi,
        seviye,
        rozetler,
        ogrenilenBeceriler,
        gelisenBeceriler,
        antrenorNotu: eslesen.genelNot || null,
        siradakiHedefler,
        grupBilgisi,
      },
    });
  });
}