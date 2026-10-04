import type { Router } from "../router";
import { json, badRequest, notFound } from "../lib/json";
import { resolveIzleKodu } from "../db/athletes";
import { listByGrupWithKatilimcilar } from "../db/antrenmanProgrami";
import { getMeta } from "../db/meta";

/** Veliye aylık rapor (2026-09-28) — public/rapor.html. Canlı İzleme ile AYNI tahmin edilemez sporcu kodunu
 * (athletes.izleKodu) kullanır; kod tek bir sporcuya çözülür ve YALNIZCA onun o ayki devamı, kayıtlı olduğu
 * derslerin saatleri ve seri özetleri döner. Telefon, not, aidat gibi hiçbir kişisel/iç bilgi dönmez. */
export function registerVeliRaporRoutes(router: Router): void {
  router.get("/api/veli-rapor/:kod", async (request, env, params) => {
    const hedef = await resolveIzleKodu(env, params.kod);
    if (!hedef) return notFound("invalid code");
    const ay = new URL(request.url).searchParams.get("ay") || "";
    if (!/^\d{4}-\d{2}$/.test(ay)) return badRequest("ay=YYYY-MM required");
    const like = ay + "-%";

    const { results: yoklama } = await env.DB.prepare(
      `SELECT tarih, saat, geldi, grup FROM attendance_auto WHERE ad = ?1 AND tarih LIKE ?2
       UNION ALL SELECT tarih, saat, geldi, grup FROM attendance_auto_archive WHERE ad = ?1 AND tarih LIKE ?2`
    ).bind(hedef.ad, like).all<{ tarih: string; saat: string | null; geldi: number; grup: string | null }>();

    const { results: seriler } = await env.DB.prepare(
      "SELECT tarih, puan, oklar_json FROM series WHERE grup = ? AND ad = ? AND tarih LIKE ? AND iptal = 0 ORDER BY t ASC"
    ).bind(hedef.grup, hedef.ad, like).all<{ tarih: string; puan: number; oklar_json: string }>();

    const slots = await listByGrupWithKatilimcilar(env);
    const dersler = slots
      .filter((s) => (s.katilimcilar || []).some((k) => k.grup === hedef.grup && k.ad === hedef.ad))
      .map((s) => ({
        ad: s.grup,
        gunler: s.gunler,
        baslangicSaat: s.baslangicSaat,
        bitisSaat: s.bitisSaat,
        iptaller: (s.istisnalar || []).filter((i) => (i.tarih || "").startsWith(ay)).map((i) => i.tarih),
      }));

    // 2026-10-05 veli sayfası genişletmesi: aidat DURUMU (tutar yok; muafsa hiç gösterilmez), son 6 ay devam + ok ortalaması,
    // Form Lab karnesinin son kayıtları (puan + bulgu başlıkları), o ay skor girilen günler (yoklamaya işlenmemiş gelişler).
    const ayEkle = (a: string, n: number) => { const [y, m] = a.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"); };
    const aylar = [-5, -4, -3, -2, -1, 0].map((n) => ayEkle(ay, n)), ilk = aylar[0] + "-01", son = ay + "-31";
    const sp = await env.DB.prepare("SELECT aidatMuaf FROM athletes WHERE grup = ? AND ad = ?").bind(hedef.grup, hedef.ad).first<{ aidatMuaf: number }>();
    const due = await env.DB.prepare("SELECT odendi, notMetin FROM dues WHERE ad = ? AND ay = ?").bind(hedef.ad, ay).first<{ odendi: number; notMetin: string | null }>();
    const aidat = sp?.aidatMuaf ? null : { durum: due?.odendi ? "odendi" : "bekleniyor", paket: due?.odendi && due.notMetin && due.notMetin.startsWith("📦") ? due.notMetin.split(" · ")[0] : null };
    const { results: y6 } = await env.DB.prepare(
      `SELECT tarih, geldi, grup FROM attendance_auto WHERE ad = ?1 AND tarih BETWEEN ?2 AND ?3
       UNION ALL SELECT tarih, geldi, grup FROM attendance_auto_archive WHERE ad = ?1 AND tarih BETWEEN ?2 AND ?3`
    ).bind(hedef.ad, ilk, son).all<{ tarih: string; geldi: number; grup: string | null }>();
    const { results: s6 } = await env.DB.prepare("SELECT tarih, puan, oklar_json FROM series WHERE grup = ? AND ad = ? AND tarih BETWEEN ? AND ? AND iptal = 0")
      .bind(hedef.grup, hedef.ad, ilk, son).all<{ tarih: string; puan: number; oklar_json: string }>();
    const gun: Record<string, Set<string>> = {}, ok: Record<string, { p: number; n: number }> = {};
    y6.forEach((r) => { if (r.geldi === 0 || (r.grup && r.grup !== hedef.grup)) return; (gun[r.tarih.slice(0, 7)] ??= new Set()).add(r.tarih); });
    s6.forEach((s) => {
      const a = s.tarih.slice(0, 7); (gun[a] ??= new Set()).add(s.tarih);
      let n = 0; try { n = (JSON.parse(s.oklar_json || "[]") as unknown[]).length; } catch { n = 0; }
      const o = (ok[a] ??= { p: 0, n: 0 }); o.p += s.puan || 0; o.n += n;
    });
    const gelisim = aylar.map((a) => ({ ay: a, gun: gun[a]?.size ?? 0, okOrt: ok[a]?.n ? Math.round((ok[a].p / ok[a].n) * 10) / 10 : null }));
    let formLab: { tarih: string; puan: number; n: number; bulgular: string[]; takipSn: number | null }[] = [];
    try {
      const v = await getMeta(env, "form_lab"), o = (v ? JSON.parse(v) : {}) as Record<string, { t?: number; sil?: boolean; tarih: string; puan: number; n: number; bulgular?: string[]; takipSn?: number | null }>, on = hedef.grup + "|" + hedef.ad + "|";
      formLab = Object.keys(o).filter((k) => k.startsWith(on) && o[k] && !o[k].sil).map((k) => o[k]).sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, 5)
        .map((r) => ({ tarih: r.tarih, puan: r.puan, n: r.n, bulgular: (r.bulgular || []).slice(0, 2), takipSn: r.takipSn ?? null }));
    } catch { formLab = []; }

    return json({
      ad: hedef.ad,
      grup: hedef.grup,
      ay,
      aidat,
      gelisim,
      formLab,
      skorGunleri: [...new Set(seriler.map((s) => s.tarih))],
      // aynı isimde başka gruptan bir sporcunun kaydı karışmasın
      yoklama: yoklama.filter((y) => !y.grup || y.grup === hedef.grup).map((y) => ({ tarih: y.tarih, saat: y.saat, geldi: y.geldi !== 0 })),
      seriler: seriler.map((s) => {
        let okSay = 0;
        try { okSay = (JSON.parse(s.oklar_json || "[]") as unknown[]).length; } catch { okSay = 0; }
        return { tarih: s.tarih, puan: s.puan, okSay };
      }),
      dersler,
    });
  });
}
