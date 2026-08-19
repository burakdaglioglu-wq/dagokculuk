import type { Router } from "../router";
import { json, readJson } from "../lib/json";
import { broadcast } from "../lib/broadcast";
import { bumpMetaIfNewer } from "../db/meta";
import * as backupsDb from "../db/backups";

export function registerBackupRoutes(router: Router): void {
  router.get("/api/backups", async (_request, env) => {
    return json({ backups: await backupsDb.listBackups(env) });
  });

  router.post("/api/backups/daily-check", async (_request, env) => {
    const tarih = new Date().toISOString().slice(0, 10);
    await backupsDb.createDailyBackup(env, tarih);
    await backupsDb.pruneOldBackups(env);
    return json({ applied: true, tarih });
  });

  router.post("/api/backups/:tarih/restore", async (request, env, params) => {
    const body = await readJson<{ deviceId?: string }>(request).catch(() => ({}) as { deviceId?: string });
    const result = await backupsDb.restoreBackup(env, params.tarih);
    if (result.applied) {
      const guncelleme = Date.now();
      await bumpMetaIfNewer(env, "sonGeriYukleme", guncelleme);
      await broadcast(env, {
        type: "daily-backup-restored",
        deviceId: body.deviceId ?? null,
        payload: { tarih: params.tarih, guncelleme },
      });
    }
    return json(result);
  });
}
