import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";

interface AttendanceRow {
  tarih: string;
  ad: string;
  grup: string | null;
  saat: string | null;
  elle: number | null;
  geldi: number;
}

export function registerAttendanceRoutes(router: Router): void {
  router.get("/api/attendance/auto", async (request, env) => {
    const tarih = new URL(request.url).searchParams.get("tarih");
    const stmt = tarih
      ? env.DB.prepare("SELECT * FROM attendance_auto WHERE tarih = ?").bind(tarih)
      : env.DB.prepare("SELECT * FROM attendance_auto");
    const { results } = await stmt.all<AttendanceRow>();
    return json({ attendance: results });
  });

  // otomatikYoklamaMerge: auto arrivals use earliest-saat-wins (first arrival of the day).
  // Elle (manual admin correction) always wins over whatever is already stored, and once a manual
  // entry exists a later auto-detected arrival can no longer silently overwrite it.
  // DÜZELTME: fanOutMasterPayload TÜM geçmiş yoklama kayıtlarını (aylarca birikmiş) her 10sn'lik tam
  // anlık görüntü gönderiminde tek tek buraya postalıyordu — her biri ayrı bir Durable Object isteğiydi.
  // Bu, ücretsiz DO kotasının dolmasının en büyük tek sebebiydi. Broadcast kaldırıldı.
  router.post("/api/attendance/auto", async (request, env) => {
    const body = await readJson<{ tarih: string; ad: string; grup?: string | null; saat: string; elle?: boolean; geldi?: boolean; deviceId?: string }>(request);
    if (!body.tarih || !body.ad || !body.saat) return badRequest("tarih, ad, saat are required");
    const elle = body.elle ? 1 : 0;
    const geldi = body.geldi === false ? 0 : 1;

    await env.DB.prepare(
      `INSERT INTO attendance_auto (tarih, ad, grup, saat, elle, geldi) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(tarih, ad) DO UPDATE SET saat = excluded.saat, grup = excluded.grup, elle = excluded.elle, geldi = excluded.geldi
       WHERE excluded.elle = 1 OR (attendance_auto.elle = 0 AND excluded.saat <= attendance_auto.saat)`
    )
      .bind(body.tarih, body.ad, body.grup ?? null, body.saat, elle, geldi)
      .run();

    return json({ applied: true });
  });

  router.get("/api/attendance/personnel", async (request, env) => {
    const tarih = new URL(request.url).searchParams.get("tarih");
    const stmt = tarih
      ? env.DB.prepare("SELECT * FROM personnel_attendance WHERE tarih = ?").bind(tarih)
      : env.DB.prepare("SELECT * FROM personnel_attendance");
    const { results } = await stmt.all();
    return json({ attendance: results });
  });

  // Elle (manuel personel yoklama düzeltmesi) her zaman kazanır — aynı /api/attendance/auto deseni.
  // Broadcast burada da yok (bkz. yukarıdaki DÜZELTME notu) — per-record senkron, DO kotasını zorlamasın.
  router.post("/api/attendance/personnel", async (request, env) => {
    const body = await readJson<{ tarih: string; personelId: string; elle?: boolean; geldi?: boolean; deviceId?: string }>(request);
    if (!body.tarih || !body.personelId) return badRequest("tarih and personelId are required");
    const elle = body.elle ? 1 : 0;
    const geldi = body.geldi === false ? 0 : 1;

    await env.DB.prepare(
      `INSERT INTO personnel_attendance (tarih, personel_id, elle, geldi) VALUES (?, ?, ?, ?)
       ON CONFLICT(tarih, personel_id) DO UPDATE SET elle = excluded.elle, geldi = excluded.geldi
       WHERE excluded.elle = 1 OR personnel_attendance.elle = 0`
    )
      .bind(body.tarih, body.personelId, elle, geldi)
      .run();
    return json({ applied: true });
  });
}
