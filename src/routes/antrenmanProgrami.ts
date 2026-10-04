import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcastMasterChanged } from "../lib/broadcast";
import { listByGrupWithKatilimcilar, createSlot, updateSlot, deleteSlot, addKatilimci, removeKatilimci, addIstisna, removeIstisna } from "../db/antrenmanProgrami";
import * as metaDb from "../db/meta";
import { yetkiliOturum } from "../auth";
import type { Env } from "../env";

// Ders programı değişiklik geçmişi (2026-10-04, kullanıcı: "kimi ne zaman hangi derse ekledim görmek istiyorum").
// Her katılımcı ekleme/çıkarma meta 'program_gecmis' kaydına yazılır ({id: {t, islem, slotId, ders, grup, ad, kim}}) —
// hangi ekrandan yapılırsa yapılsın (Ders Programı, Yoklama, Karışık Sınıf 📌). Yazılamazsa asıl işlem ETKİLENMEZ.
// Kişisel bilgi taşıdığı için okuması oturum ister (meta.ts OTURUMLU_META). En çok 800 kayıt / 365 gün tutulur.
const GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
async function programGecmisYaz(request: Request, env: Env, islem: "ekle" | "cikar", slotId: number, grup: string, ad: string): Promise<void> {
  try {
    const ot = await yetkiliOturum(request, env, false);
    const slot = await env.DB.prepare("SELECT grup, gun, baslangicSaat FROM antrenman_programi WHERE id = ?").bind(slotId).first<{ grup: string; gun: number; baslangicSaat: string }>();
    const gunler = await env.DB.prepare("SELECT gun FROM antrenman_programi_gun WHERE slotId = ? ORDER BY gun").bind(slotId).all<{ gun: number }>().then((r) => r.results.map((x) => x.gun)).catch(() => [] as number[]);
    const gunYazi = (gunler.length ? gunler : slot ? [slot.gun] : []).map((g) => GUN_KISA[g] ?? "").join("·");
    let o: Record<string, unknown> = {};
    try { const v = await metaDb.getMeta(env, "program_gecmis"); o = v ? JSON.parse(v) : {}; } catch { o = {}; }
    const t = Date.now();
    o[t.toString(36) + Math.random().toString(36).slice(2, 6)] = { t, islem, slotId, ders: slot ? `${slot.grup} (${gunYazi} ${slot.baslangicSaat})` : "Ders #" + slotId, grup, ad, kim: ot?.ad ?? null };
    const sinir = t - 365 * 86400000;
    const tut = Object.entries(o).filter(([, x]) => ((x as { t?: number }).t ?? 0) >= sinir).sort((a, b) => ((b[1] as { t: number }).t) - ((a[1] as { t: number }).t)).slice(0, 800);
    await metaDb.setMeta(env, "program_gecmis", JSON.stringify(Object.fromEntries(tut)));
  } catch { /* geçmiş yazılamadıysa asıl işlem yine de başarılı */ }
}
async function katilimciVarMi(env: Env, slotId: number, grup: string, ad: string): Promise<boolean> {
  return !!(await env.DB.prepare("SELECT 1 FROM antrenman_programi_katilimci WHERE slotId = ? AND grup = ? AND ad = ?").bind(slotId, grup, ad).first());
}

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
    const vardi = await katilimciVarMi(env, id, body.grup, body.ad);
    await addKatilimci(env, id, body.grup, body.ad);
    if (!vardi) await programGecmisYaz(request, env, "ekle", id, body.grup, body.ad);
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
    const vardi = await katilimciVarMi(env, id, grup, ad);
    await removeKatilimci(env, id, grup, ad);
    if (vardi) await programGecmisYaz(request, env, "cikar", id, grup, ad);
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
      grup: string; gunler: number[]; baslangicSaat: string; bitisSaat: string;
      hatirlatmaAktif?: boolean; hatirlatmaDakika?: number; dersPlani?: string | null; kapasite?: number | null; deviceId?: string;
    }>(request);
    if (!body.grup || !Array.isArray(body.gunler) || !body.gunler.length || !body.baslangicSaat || !body.bitisSaat) {
      return badRequest("grup, gunler (non-empty array), baslangicSaat, bitisSaat are required");
    }
    const id = await createSlot(
      env,
      {
        grup: body.grup, baslangicSaat: body.baslangicSaat, bitisSaat: body.bitisSaat,
        hatirlatmaAktif: body.hatirlatmaAktif ? 1 : 0, hatirlatmaDakika: body.hatirlatmaDakika ?? 30,
        dersPlani: body.dersPlani ?? null, kapasite: body.kapasite ?? null,
        olusturulma: Date.now(),
      },
      body.gunler
    );
    await broadcastMasterChanged(env, body.deviceId ?? null);
    return json({ applied: true, id });
  });

  router.put("/api/antrenman-programi/:id", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const body = await readJson<{
      grup?: string; gunler?: number[]; baslangicSaat?: string; bitisSaat?: string;
      hatirlatmaAktif?: boolean; hatirlatmaDakika?: number; dersPlani?: string | null; kapasite?: number | null; deviceId?: string;
    }>(request);
    if (body.gunler !== undefined && !body.gunler.length) return badRequest("gunler cannot be empty");
    await updateSlot(env, id, {
      grup: body.grup, gunler: body.gunler, baslangicSaat: body.baslangicSaat, bitisSaat: body.bitisSaat,
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