import type { Env } from "./env";
import { Router } from "./router";
import { yetkiliOturum } from "./auth";
import { gunluk } from "./lib/giris";
import { registerGirisRoutes, GIRIS_ACIK_YOLLAR } from "./routes/giris";
import { unauthorized } from "./lib/json";
import { registerAthleteRoutes } from "./routes/athletes";
import { registerSeriesRoutes } from "./routes/series";
import { registerTeamRoutes } from "./routes/teams";
import { registerBracketRoutes } from "./routes/brackets";
import { registerSeasonRoutes } from "./routes/season";
import { registerLockRoutes } from "./routes/locks";
import { registerResetSignalRoutes } from "./routes/resetSignal";
import { registerBackupRoutes } from "./routes/backups";
import { registerDuesRoutes } from "./routes/dues";
import { registerAttendanceRoutes } from "./routes/attendance";
import { registerPersonnelRoutes } from "./routes/personnel";
import { registerMetaRoutes } from "./routes/meta";
import { registerLiveRoutes } from "./routes/live";
import { registerPushRoutes } from "./routes/push";
import { registerDuelloRoutes } from "./routes/duello";
import { registerDuyuruRoutes } from "./routes/duyuru";
import { registerWeatherRoutes } from "./routes/weather";
import { registerGiderRoutes } from "./routes/gider";
import { registerAntrenmanProgramiRoutes } from "./routes/antrenmanProgrami";
import { registerDersIcerikleriRoutes } from "./routes/dersIcerikleri";
import { registerMiloMemberRoutes } from "./routes/milo/members";
import { registerMiloDuesRoutes } from "./routes/milo/dues";
import { registerMiloAttendanceRoutes } from "./routes/milo/attendance";
import { registerMiloPersonnelRoutes } from "./routes/milo/personnel";
import { registerMiloAntrenmanProgramiRoutes } from "./routes/milo/antrenmanProgrami";
import { registerMiloDersIcerikleriRoutes } from "./routes/milo/dersIcerikleri";
import { registerMiloMetaRoutes } from "./routes/milo/meta";
import { registerMiloMemberSkillsRoutes } from "./routes/milo/memberSkills";
import { registerMiloGunlukNotRoutes } from "./routes/milo/gunlukNot";
import { registerMiloSporcuGirisiRoutes } from "./routes/milo/sporcuGirisi";
import { registerMiloGruplarRoutes } from "./routes/milo/gruplar";
import { registerTanitimRoutes } from "./routes/tanitim";
import { registerIhtiyacRoutes } from "./routes/ihtiyac";
import { registerTeknikAnalizRoutes } from "./routes/teknikAnaliz";
import { checkAndSendReminders, checkAndSendAidatReminders, checkAndSendBelgeReminders, checkAndSendBirthdayReminders } from "./lib/reminders";
import { archiveOldAttendance } from "./lib/attendanceArchive";

export { ClubSync } from "./durable-objects/ClubSync";

const router = new Router();
registerAthleteRoutes(router);
registerSeriesRoutes(router);
registerTeamRoutes(router);
registerBracketRoutes(router);
registerSeasonRoutes(router);
registerLockRoutes(router);
registerResetSignalRoutes(router);
registerBackupRoutes(router);
registerDuesRoutes(router);
registerAttendanceRoutes(router);
registerPersonnelRoutes(router);
registerMetaRoutes(router);
registerLiveRoutes(router);
registerPushRoutes(router);
registerDuelloRoutes(router);
registerDuyuruRoutes(router);
registerWeatherRoutes(router);
registerGiderRoutes(router);
registerAntrenmanProgramiRoutes(router);
registerDersIcerikleriRoutes(router);
registerMiloMemberRoutes(router);
registerMiloDuesRoutes(router);
registerMiloAttendanceRoutes(router);
registerMiloPersonnelRoutes(router);
registerMiloAntrenmanProgramiRoutes(router);
registerMiloDersIcerikleriRoutes(router);
registerMiloMetaRoutes(router);
registerMiloMemberSkillsRoutes(router);
registerMiloGunlukNotRoutes(router);
registerMiloSporcuGirisiRoutes(router);
registerMiloGruplarRoutes(router);
registerTanitimRoutes(router);
registerIhtiyacRoutes(router);
registerTeknikAnalizRoutes(router);
registerGirisRoutes(router, "/api/giris", (env) => env.DB);
registerGirisRoutes(router, "/api/milo/giris", (env) => env.DB_MILO);

// Sunucu tarafında hiçbir yazma isteği (POST/PUT/PATCH/DELETE) doğrulanmıyordu — PIN sadece
// ekranda bir kilitti, API'nin kendisi açıktı (URL'i bilen biri PIN'i hiç bilmeden veri
// değiştirebilir/silebilirdi). Aşağıdaki yollar İSTİSNA: gerçekten PIN'siz/sporcu-taraflı akışlar
// (skor girişi, canlı atış yayını, düello, push aboneliği, hazır olma anketi vb.) — bunlar
// yönetici/eğitmen PIN'i olmadan da çalışmalı. "/api/athletes/:grup/:ad" özel: alan bazlı kontrol
// (sadece hazırOlma_json gibi öz-servis alanlar PIN'siz) doğrudan athletes.ts içinde yapılıyor.
const PUBLIC_YAZMA_YOLLARI = new Set<string>([
  "/api/series",
  "/api/series/:seriId",
  "/api/series/cancel-batch",
  "/api/canli-atis",
  "/api/attendance/auto",
  // Genel amaçlı anahtar/değer geçişi — düşük riskli ayarlar (Karışık Sınıf konumları/listesi,
  // gider bütçesi, kulüp şehri, sync.js'in "extra_blob" arka plan aynası) burada tutuluyor VE
  // Karışık Sınıf PIN'siz de açılabildiği (ana ekran "🎯 Karışık Sınıf" butonu) için bu anahtar
  // PIN'siz kalmalı — gerçek hassas veri (aidat, personel maaşı, sağlık belgesi) hep kendi özel
  // rotalarında ve onlar admin-only.
  "/api/meta/:key",
  "/api/athletes/:grup/:ad",
  "/api/athletes/:grup/:ad/gamification",
  "/api/duello/davet",
  "/api/duello/yanit",
  "/api/duello/ok",
  "/api/duello/iptal",
  "/api/push/subscribe",
  "/api/push/unsubscribe",
  "/api/tanitim/ziyaret",
  "/api/ihtiyac",
  "/api/milo/sporcu-girisi",
  "/api/ders-icerikleri/:id/kullanim",
  "/api/ders-icerikleri/:id/degerlendir",
  "/api/milo/ders-icerikleri/:id/kullanim",
  "/api/milo/ders-icerikleri/:id/degerlendir",
  // Giriş uç noktaları kendi oturum/yetki kontrollerini içeride yapıyor (bkz. routes/giris.ts).
  ...GIRIS_ACIK_YOLLAR.map((p) => "/api/giris/" + p),
  ...GIRIS_ACIK_YOLLAR.map((p) => "/api/milo/giris/" + p),
]);

// GÜVENLİK (2026-09-28): router yalnızca yazmaları kilitliyordu — aşağıdaki OKUMALAR da oturumsuz açıktı
// (aidat tutarları/notları, personel ücretleri ve giriş günleri, giderler, yedek listesi, öneri/şikayet
// kayıtları, ziyaretçi özeti). Hepsi yalnızca yönetici/eğitmen ekranlarından, oturum başlığıyla okunuyor.
// sync.js bu okumalardan 401 alırsa ilgili alanı ATLAR (yerel veri silinmez), senkronun geri kalanı sürer.
const OTURUMLU_OKUMA_YOLLARI = new Set<string>([
  "/api/dues",
  "/api/personnel",
  "/api/attendance/personnel",
  "/api/gider",
  "/api/backups",
  "/api/ihtiyac",
  "/api/tanitim/ziyaret-ozet",
  "/api/athlete-moves/kopuk",
  "/api/milo/dues",
  "/api/milo/personnel",
  "/api/milo/attendance/personnel",
]);

// "Kim ne yaptı" günlüğü: her yazma değil (senkron yüzlerce istek atıyor), yalnızca silmeler ve hassas
// bölümler (aidat, gider, personel, yedekten geri yükleme) kişi adıyla kaydedilir.
function gunlugeYazilsinMi(method: string, path: string): boolean {
  if (method === "DELETE") return !path.startsWith("/api/lock") && !path.startsWith("/api/push/");
  return path.startsWith("/api/dues") || path.startsWith("/api/milo/dues") || path.startsWith("/api/gider") || path.startsWith("/api/personnel") || path.startsWith("/api/milo/personnel") || path.endsWith("/restore");
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Serve /app and /app/ as /app.html so the page (and its favicon) loads correctly
    if (url.pathname === "/app" || url.pathname === "/app/") {
      return env.ASSETS.fetch(new Request(`${url.origin}/app.html`, { method: "GET", headers: request.headers }));
    }

    // Serve /favicon.ico by redirecting to the existing /favicon.png (some browsers better follow redirects)
    if (url.pathname === "/favicon.ico") {
      return Response.redirect(`${url.origin}/favicon.png`, 302);
    }

    if (url.pathname === "/ws") {
      const id = env.CLUB_SYNC.idFromName("dagsk-club");
      return env.CLUB_SYNC.get(id).fetch(request);
    }

    const match = router.match(request.method, url.pathname);
    if (match) {
      try {
        if (request.method === "GET" && OTURUMLU_OKUMA_YOLLARI.has(match.path)) {
          if (!(await yetkiliOturum(request, env, url.pathname.startsWith("/api/milo/")))) return unauthorized("oturum-yok");
        }
        if (request.method !== "GET" && !PUBLIC_YAZMA_YOLLARI.has(match.path)) {
          const milo = url.pathname.startsWith("/api/milo/");
          const oturum = await yetkiliOturum(request, env, milo);
          if (!oturum) return unauthorized("oturum-yok");
          if (gunlugeYazilsinMi(request.method, match.path)) {
            ctx.waitUntil(gunluk(milo ? env.DB_MILO : env.DB, { kullaniciId: oturum.kullaniciId, ad: oturum.ad }, "islem", request.method + " " + url.pathname).catch(() => {}));
          }
        }
        return await match.handler(request, env, match.params);
      } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(checkAndSendReminders(env));
    ctx.waitUntil(checkAndSendAidatReminders(env));
    ctx.waitUntil(checkAndSendBelgeReminders(env));
    ctx.waitUntil(checkAndSendBirthdayReminders(env));
    ctx.waitUntil(archiveOldAttendance(env));
  },
};
