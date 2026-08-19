import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { createDuyuru, listRecentDuyurular } from "../db/duyuru";
import { sendPushToAll, sendPushToGroup } from "../lib/push";
import { broadcast } from "../lib/broadcast";

const GECERLI_GRUPLAR = ["buyukler", "yildizlar", "kucukler", "minikler"];

export function registerDuyuruRoutes(router: Router): void {
  router.get("/api/duyuru", async (_request, env) => {
    const duyurular = await listRecentDuyurular(env, 20);
    return json({ duyurular });
  });

  router.post("/api/duyuru", async (request, env) => {
    const body = await readJson<{ baslik: string; mesaj: string; hedefGrup?: string | null; gonderen?: string; deviceId?: string }>(request);
    const baslik = (body.baslik || "").trim();
    const mesaj = (body.mesaj || "").trim();
    if (!baslik || !mesaj) return badRequest("baslik and mesaj are required");
    if (baslik.length > 100) return badRequest("baslik too long (max 100)");
    if (mesaj.length > 1000) return badRequest("mesaj too long (max 1000)");
    const hedefGrup = body.hedefGrup || null;
    if (hedefGrup && !GECERLI_GRUPLAR.includes(hedefGrup)) return badRequest("invalid hedefGrup");

    const t = Date.now();
    const id = await createDuyuru(env, { baslik, mesaj, hedefGrup, gonderen: body.gonderen || null, t });

    if (hedefGrup) {
      await sendPushToGroup(env, hedefGrup, { title: baslik, body: mesaj, tag: "duyuru-" + id, data: { kind: "duyuru", id } });
    } else {
      await sendPushToAll(env, { title: baslik, body: mesaj, tag: "duyuru-" + id, data: { kind: "duyuru", id } });
    }
    await broadcast(env, { type: "duyuru", deviceId: body.deviceId ?? null, payload: { baslik, mesaj, hedefGrup } });

    return json({ applied: true, id });
  });
}
