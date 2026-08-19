import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcastMasterChanged } from "../lib/broadcast";
import { listByGrupWithKatilimcilar, createSlot, updateSlot, deleteSlot, addKatilimci, removeKatilimci, addIstisna, removeIstisna } from "../db/antrenmanProgrami";

/** Haftalık antrenman programı (tekrarlanan ders saatleri) — grup bazlı, isteğe bağlı hatırlatma
 * bildirimi (bkz. src/lib/reminders.ts + scheduled() cron handler'ı) taşıyabilir. Her slot artık kendi
 * KATILIMCI listesini de taşıyor (antrenman_programi_katilimci) — bir sporcunun nominal `grup`'u ile o
 * dersin `grup` etiketi eşleşmese bile o derse kayıtlı olabilir (bkz. addKatilimci/removeKatilimci). */
export function registerAntrenmanProgramiRoutes(router: Router): void {
  router.get("/api/antrenman-programi", async (request, env) => {
    const url = new URL(request.url);
    const grup = url.searchParams.get("grup") ?? undefined;
    const slots = await listByGrupWithKatilimcilar(env, grup);
    return json({ slots });
  });

  router.post("/api/antrenman-programi/:id/katilimci", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const body = await readJson<{ grup: string; ad: string; deviceId?: string }>(request);
    if (!body.grup || !body.ad) return badRequest("grup, ad are required");
    await addKatilimci(env, id, body.grup, body.ad);
    await broadcastMasterChanged(env, body.deviceId ?? null);
    return json({ applied: true });
  });

  router.delete("/api/antrenman-programi/:id/katilimci", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const url = new URL(request.url);
    const grup = url.searchParams.get("grup");
    const ad = url.searchParams.get("ad");
    if (!grup || !ad) return badRequest("grup, ad are required");
    await removeKatilimci(env, id, grup, ad);
    await broadcastMasterChanged(env, url.searchParams.get("deviceId"));
    return json({ applied: true });
  });

  router.post("/api/antrenman-programi/:id/istisna", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const body = await readJson<{ tarih: string; sebep?: string; deviceId?: string }>(request);
    if (!body.tarih) return badRequest("tarih is required");
    await addIstisna(env, id, body.tarih, body.sebep ?? null);
    await broadcastMasterChanged(env, body.deviceId ?? null);
    return json({ applied: true });
  });

  router.delete("/api/antrenman-programi/:id/istisna", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const url = new URL(request.url);
    const tarih = url.searchParams.get("tarih");
    if (!tarih) return badRequest("tarih is required");
    await removeIstisna(env, id, tarih);
    await broadcastMasterChanged(env, url.searchParams.get("deviceId"));
    return json({ applied: true });
  });

  router.post("/api/antrenman-programi", async (request, env) => {
    const body = await readJson<{
      grup: string; gun: number; baslangicSaat: string; bitisSaat: string;
      hatirlatmaAktif?: boolean; hatirlatmaDakika?: number; dersPlani?: string | null; kapasite?: number | null; deviceId?: string;
    }>(request);
    if (!body.grup || body.gun === undefined || body.gun === null || !body.baslangicSaat || !body.bitisSaat) {
      return badRequest("grup, gun, baslangicSaat, bitisSaat are required");
    }
    const id = await createSlot(env, {
      grup: body.grup, gun: body.gun, baslangicSaat: body.baslangicSaat, bitisSaat: body.bitisSaat,
      hatirlatmaAktif: body.hatirlatmaAktif ? 1 : 0, hatirlatmaDakika: body.hatirlatmaDakika ?? 30,
      dersPlani: body.dersPlani ?? null, kapasite: body.kapasite ?? null,
      olusturulma: Date.now(),
    });
    await broadcastMasterChanged(env, body.deviceId ?? null);
    return json({ applied: true, id });
  });

  router.put("/api/antrenman-programi/:id", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const body = await readJson<{
      grup?: string; gun?: number; baslangicSaat?: string; bitisSaat?: string;
      hatirlatmaAktif?: boolean; hatirlatmaDakika?: number; dersPlani?: string | null; kapasite?: number | null; deviceId?: string;
    }>(request);
    await updateSlot(env, id, {
      grup: body.grup, gun: body.gun, baslangicSaat: body.baslangicSaat, bitisSaat: body.bitisSaat,
      hatirlatmaAktif: body.hatirlatmaAktif === undefined ? undefined : body.hatirlatmaAktif ? 1 : 0,
      hatirlatmaDakika: body.hatirlatmaDakika,
      dersPlani: body.dersPlani, kapasite: body.kapasite,
    });
    await broadcastMasterChanged(env, body.deviceId ?? null);
    return json({ applied: true });
  });

  router.delete("/api/antrenman-programi/:id", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    await deleteSlot(env, id);
    const url = new URL(request.url);
    await broadcastMasterChanged(env, url.searchParams.get("deviceId"));
    return json({ applied: true });
  });
}