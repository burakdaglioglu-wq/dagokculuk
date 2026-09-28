import type { Router } from "../router";
import { json, badRequest, notFound } from "../lib/json";
import { resolveIzleKodu } from "../db/athletes";
import { listByGrupWithKatilimcilar } from "../db/antrenmanProgrami";

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

    return json({
      ad: hedef.ad,
      grup: hedef.grup,
      ay,
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
