import type { Router } from "../router";
import { json } from "../lib/json";
import { ziyaretKaydet, ayOzetiGetir, kulupNabziGetir } from "../db/tanitim";

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

  router.get("/api/tanitim/ziyaret-ozet", async (_request, env) => {
    const ayPrefix = turkiyeGunu().slice(0, 7); // YYYY-MM
    const toplam = await ayOzetiGetir(env, ayPrefix);
    return json({ ay: ayPrefix, toplam });
  });

  router.get("/api/tanitim/nabiz", async (_request, env) => {
    const ayPrefix = turkiyeGunu().slice(0, 7); // YYYY-MM
    const nabiz = await kulupNabziGetir(env, ayPrefix);
    return json({ ay: ayPrefix, ...nabiz });
  });
}
