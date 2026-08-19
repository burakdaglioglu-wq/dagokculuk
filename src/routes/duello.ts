import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcast } from "../lib/broadcast";
import { sendPushToAthlete } from "../lib/push";
import { createInvite, updateInviteStatus, listPendingFor, listSentBy } from "../db/duello";

const DAVET_GECERLILIK_MS = 10 * 60 * 1000; // 10 dakikadan eski davetler artık gösterilmez/beklenmez

/** Düello Modu (Gerçek Rakip) canlı eşleştirme akışı. Ok-ok senkron hâlâ tamamen ephemeral (D1'e
 * yazılmaz) — ama davet/yanıt artık D1'de kalıcı olarak tutuluyor: WS bağlantısı davet anında kopuk
 * olan (arka planda, ekranı kapalı vb.) bir cihaz daveti kaçırsa bile, uygulamayı açtığında/Düello
 * sekmesine girdiğinde GET /api/duello/bekleyen ile daveti hâlâ görebiliyor. */
export function registerDuelloRoutes(router: Router): void {
  router.get("/api/duello/bekleyen", async (request, env) => {
    const url = new URL(request.url);
    const grup = url.searchParams.get("grup"), ad = url.searchParams.get("ad");
    if (!grup || !ad) return badRequest("grup and ad are required");
    const davetler = await listPendingFor(env, grup, ad, Date.now() - DAVET_GECERLILIK_MS);
    return json({ davetler });
  });

  router.get("/api/duello/gonderdigim", async (request, env) => {
    const url = new URL(request.url);
    const grup = url.searchParams.get("grup"), ad = url.searchParams.get("ad");
    if (!grup || !ad) return badRequest("grup and ad are required");
    const davetler = await listSentBy(env, grup, ad, Date.now() - DAVET_GECERLILIK_MS);
    return json({ davetler });
  });

  router.post("/api/duello/davet", async (request, env) => {
    const body = await readJson<{
      duelId: string; davetciAd: string; davetciGrup: string; rakipAd: string; rakipGrup: string; seriSayisi: number; okSayisi: number;
      sureAktif?: boolean; sureSaniye?: number; deviceId?: string;
    }>(request);
    if (!body.duelId || !body.davetciAd || !body.rakipAd) return badRequest("duelId, davetciAd and rakipAd are required");

    await createInvite(env, {
      duelId: body.duelId, davetciAd: body.davetciAd, davetciGrup: body.davetciGrup,
      rakipAd: body.rakipAd, rakipGrup: body.rakipGrup, seriSayisi: body.seriSayisi, okSayisi: body.okSayisi,
      sureAktif: body.sureAktif ? 1 : 0, sureSaniye: body.sureSaniye ?? 60,
      olusturulma: Date.now(),
    });

    await broadcast(env, {
      type: "duello-davet",
      deviceId: body.deviceId ?? null,
      payload: {
        duelId: body.duelId, davetciAd: body.davetciAd, davetciGrup: body.davetciGrup,
        rakipAd: body.rakipAd, rakipGrup: body.rakipGrup, seriSayisi: body.seriSayisi, okSayisi: body.okSayisi,
        sureAktif: !!body.sureAktif, sureSaniye: body.sureSaniye ?? 60,
      },
    });

    await sendPushToAthlete(env, body.rakipGrup, body.rakipAd, {
      title: "⚔️ Düello Daveti",
      body: `${body.davetciAd} seni düelloya davet etti — kabul et ve yarış!`,
      tag: "duello-" + body.duelId,
      data: {
        kind: "duello-davet", duelId: body.duelId, davetciAd: body.davetciAd, davetciGrup: body.davetciGrup,
        rakipAd: body.rakipAd, rakipGrup: body.rakipGrup, seriSayisi: body.seriSayisi, okSayisi: body.okSayisi,
      },
      actions: [
        { action: "kabul", title: "✅ Kabul Et" },
        { action: "reddet", title: "✕ Reddet" },
      ],
    });

    return json({ applied: true });
  });

  router.post("/api/duello/yanit", async (request, env) => {
    const body = await readJson<{
      duelId: string; kabul: boolean; davetciAd: string; davetciGrup: string; rakipAd: string; rakipGrup: string; seriSayisi: number; okSayisi: number;
      sureAktif?: boolean; sureSaniye?: number; deviceId?: string;
    }>(request);
    if (!body.duelId || !body.davetciAd) return badRequest("duelId and davetciAd are required");

    await updateInviteStatus(env, body.duelId, body.kabul ? "kabul" : "red");

    await broadcast(env, {
      type: "duello-yanit",
      deviceId: body.deviceId ?? null,
      payload: {
        duelId: body.duelId, kabul: !!body.kabul, davetciAd: body.davetciAd, davetciGrup: body.davetciGrup,
        rakipAd: body.rakipAd, rakipGrup: body.rakipGrup, seriSayisi: body.seriSayisi, okSayisi: body.okSayisi,
        sureAktif: !!body.sureAktif, sureSaniye: body.sureSaniye ?? 60,
      },
    });

    if (body.kabul) {
      await sendPushToAthlete(env, body.davetciGrup, body.davetciAd, {
        title: "⚔️ Düello Kabul Edildi!",
        body: `${body.rakipAd} davetini kabul etti — düello başlıyor!`,
        tag: "duello-" + body.duelId,
        data: { kind: "duello-yanit", duelId: body.duelId },
      });
    }

    return json({ applied: true });
  });

  router.post("/api/duello/ok", async (request, env) => {
    const body = await readJson<{
      duelId: string; kimAd: string; kimGrup: string; seriIndex: number; ok: string;
      seriToplam?: number | null; tamamlandiSeriSayisi?: number | null; tumSeriPuanlari?: number[] | null; deviceId?: string;
    }>(request);
    if (!body.duelId || !body.kimAd) return badRequest("duelId and kimAd are required");

    await broadcast(env, {
      type: "duello-ok",
      deviceId: body.deviceId ?? null,
      payload: {
        duelId: body.duelId, kimAd: body.kimAd, kimGrup: body.kimGrup, seriIndex: body.seriIndex, ok: body.ok,
        seriToplam: body.seriToplam ?? null, tamamlandiSeriSayisi: body.tamamlandiSeriSayisi ?? null,
        tumSeriPuanlari: body.tumSeriPuanlari ?? null,
      },
    });
    return json({ applied: true });
  });

  router.post("/api/duello/iptal", async (request, env) => {
    const body = await readJson<{ duelId: string; kimAd: string; kimGrup: string; deviceId?: string }>(request);
    if (!body.duelId || !body.kimAd) return badRequest("duelId and kimAd are required");

    await updateInviteStatus(env, body.duelId, "iptal");

    await broadcast(env, {
      type: "duello-iptal",
      deviceId: body.deviceId ?? null,
      payload: { duelId: body.duelId, kimAd: body.kimAd, kimGrup: body.kimGrup },
    });
    return json({ applied: true });
  });
}
