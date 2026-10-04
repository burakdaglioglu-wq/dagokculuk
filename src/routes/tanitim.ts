import type { Router } from "../router";
import { json } from "../lib/json";
import { ziyaretKaydet, talepKaydet, aralikToplam, ayOzetiGetir, kulupNabziGetir, dersSaatleriGetir } from "../db/tanitim";

/** Türkiye (UTC+3, DST yok) yerel gününü YYYY-MM-DD olarak döner — toISOString() ham UTC kullanır
 * ve gece yarısına yakın ziyaretleri yanlış güne/aya yazdırır. */
function turkiyeGunu(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function registerTanitimRoutes(router: Router): void {
  router.post("/api/tanitim/ziyaret", async (_request, env) => {
    await ziyaretKaydet(env, turkiyeGunu());
    return json({ ok: true });
  });

  router.post("/api/tanitim/talep", async (_request, env) => {
    await talepKaydet(env, turkiyeGunu());
    return json({ ok: true });
  });

  router.get("/api/tanitim/ziyaret-ozet", async (_request, env) => {
    const ayPrefix = turkiyeGunu().slice(0, 7); // YYYY-MM
    const toplam = await ayOzetiGetir(env, ayPrefix);
    // Deneme Dersleri hunisi (2026-10-05): son 90 günün ziyaret ve site talebi sayısı
    const ilk90 = new Date(Date.now() + 3 * 60 * 60 * 1000 - 89 * 86400000).toISOString().slice(0, 10);
    const [ziyaret90, talep90, talepAy] = await Promise.all([aralikToplam(env, ilk90, false), aralikToplam(env, ilk90, true), aralikToplam(env, ayPrefix + "-01", true)]);
    return json({ ay: ayPrefix, toplam, talep: talepAy, son90: { ziyaret: ziyaret90, talep: talep90 } });
  });

  router.get("/api/tanitim/nabiz", async (request, env) => {
    // Herkese açık sayfa her açılışta tüm series tablosunu taramasın: yanıt 5 dk kenar önbelleğinde tutulur.
    const onbellek = (caches as unknown as { default: Cache }).default;
    const anahtar = new Request(new URL("/api/tanitim/nabiz", request.url).toString());
    const hazir = await onbellek.match(anahtar);
    if (hazir) return hazir;
    // son 30 gün (Türkiye günü) — ay başında da anlamlı rakam görünsün
    const baslangic = new Date(Date.now() + 3 * 60 * 60 * 1000 - 29 * 86400000).toISOString().slice(0, 10);
    const nabiz = await kulupNabziGetir(env, baslangic);
    const yanit = json({ baslangic, ...nabiz }, { headers: { "cache-control": "public, max-age=300" } });
    await onbellek.put(anahtar, yanit.clone());
    return yanit;
  });

  router.get("/api/tanitim/ders-saatleri", async (request, env) => {
    const onbellek = (caches as unknown as { default: Cache }).default;
    const anahtar = new Request(new URL("/api/tanitim/ders-saatleri", request.url).toString());
    const hazir = await onbellek.match(anahtar);
    if (hazir) return hazir;
    const yanit = json({ saatler: await dersSaatleriGetir(env) }, { headers: { "cache-control": "public, max-age=600" } });
    await onbellek.put(anahtar, yanit.clone());
    return yanit;
  });
}
