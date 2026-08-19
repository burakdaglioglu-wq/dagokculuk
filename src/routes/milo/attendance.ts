import type { Router } from "../../router";
import { json, badRequest, readJson } from "../../lib/json";

/** MILO FITT KIDS yoklama — okculuktaki attendance.ts ile ayni sekil, ayri DB_MILO'da. */
export function registerMiloAttendanceRoutes(router: Router): void {
  router.get("/api/milo/attendance/auto", async (request, env) => {
    const tarih = new URL(request.url).searchParams.get("tarih");
    const stmt = tarih
      ? env.DB_MILO.prepare("SELECT * FROM attendance_auto WHERE tarih = ?").bind(tarih)
      : env.DB_MILO.prepare("SELECT * FROM attendance_auto");
    const { results } = await stmt.all();
    return json({ attendance: results });
  });

  router.post("/api/milo/attendance/auto", async (request, env) => {
    const body = await readJson<{ tarih: string; ad: string; grup?: string | null; saat: string; elle?: boolean; geldi?: boolean }>(request);
    if (!body.tarih || !body.ad || !body.saat) return badRequest("tarih, ad, saat are required");
    const elle = body.elle ? 1 : 0;
    const geldi = body.geldi === false ? 0 : 1;

    await env.DB_MILO.prepare(
      `INSERT INTO attendance_auto (tarih, ad, grup, saat, elle, geldi) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(tarih, ad) DO UPDATE SET saat = excluded.saat, grup = excluded.grup, elle = excluded.elle, geldi = excluded.geldi
       WHERE excluded.elle = 1 OR (attendance_auto.elle = 0 AND excluded.saat <= attendance_auto.saat)`
    )
      .bind(body.tarih, body.ad, body.grup ?? null, body.saat, elle, geldi)
      .run();

    return json({ applied: true });
  });

  router.get("/api/milo/attendance/personnel", async (request, env) => {
    const tarih = new URL(request.url).searchParams.get("tarih");
    const stmt = tarih
      ? env.DB_MILO.prepare("SELECT * FROM personnel_attendance WHERE tarih = ?").bind(tarih)
      : env.DB_MILO.prepare("SELECT * FROM personnel_attendance");
    const { results } = await stmt.all();
    return json({ attendance: results });
  });

  router.post("/api/milo/attendance/personnel", async (request, env) => {
    const body = await readJson<{ tarih: string; personelId: string; elle?: boolean; geldi?: boolean }>(request);
    if (!body.tarih || !body.personelId) return badRequest("tarih and personelId are required");
    const elle = body.elle ? 1 : 0;
    const geldi = body.geldi === false ? 0 : 1;

    await env.DB_MILO.prepare(
      `INSERT INTO personnel_attendance (tarih, personel_id, elle, geldi) VALUES (?, ?, ?, ?)
       ON CONFLICT(tarih, personel_id) DO UPDATE SET elle = excluded.elle, geldi = excluded.geldi
       WHERE excluded.elle = 1 OR personnel_attendance.elle = 0`
    )
      .bind(body.tarih, body.personelId, elle, geldi)
      .run();
    return json({ applied: true });
  });
}
