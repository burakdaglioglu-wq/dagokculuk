import type { Env } from "../env";

const SNAPSHOT_TABLES = [
  "athletes",
  "series",
  "deleted_athletes",
  "athlete_moves",
  "teams",
  "bracket_matches",
  "season",
  "dues",
  "attendance_auto",
  "personnel",
  "personnel_attendance",
  "custom_classes",
  "training_sessions",
  "shot_log",
  "club_records",
  "credentials",
  "meta",
  // DÜZELTME: bu tablolar şemada var ama listede eksikti — bir restore sırasında SESSİZCE kaybolurlardı.
  // edit_lock (geçici/ephemeral kilit durumu) ve daily_backups (kendi kendini yedeklemek anlamsız)
  // BİLEREK dışarıda bırakılıyor. "ozel_ders_icerikleri" migration dosyası (0013) repoda var ama
  // gerçek production D1'de tablo hiç oluşturulmamış (muhtemelen 0014'teki ders_kullanim_log/
  // ders_degerlendirme ile değiştirildi) — eklenirse HER backup D1_ERROR ile çökerdi, bu yüzden
  // listeye alınmadı (doğrudan `wrangler d1 execute --remote` ile doğrulandı).
  "duello_davetler",
  "push_subscriptions",
  "antrenman_programi",
  "ders_kullanim_log",
  "ders_degerlendirme",
  "aidat_hatirlatma_log",
  "duyurular",
  "belge_hatirlatma_log",
  "dogum_gunu_hatirlatma_log",
  "gider",
] as const;

type Snapshot = Record<(typeof SNAPSHOT_TABLES)[number], unknown[]>;

async function takeSnapshot(env: Env): Promise<Snapshot> {
  const snapshot = {} as Snapshot;
  for (const table of SNAPSHOT_TABLES) {
    const { results } = await env.DB.prepare(`SELECT * FROM ${table}`).all();
    snapshot[table] = results;
  }
  return snapshot;
}

export async function createDailyBackup(env: Env, tarih: string): Promise<void> {
  const snapshot = await takeSnapshot(env);
  const guncelleme = Date.now();
  await env.DB.prepare(
    "INSERT INTO daily_backups (tarih, veri_json, guncelleme) VALUES (?, ?, ?) ON CONFLICT(tarih) DO UPDATE SET veri_json = excluded.veri_json, guncelleme = excluded.guncelleme"
  )
    .bind(tarih, JSON.stringify(snapshot), guncelleme)
    .run();
}

export async function pruneOldBackups(env: Env, keep = 14): Promise<void> {
  const { results } = await env.DB.prepare("SELECT tarih FROM daily_backups ORDER BY tarih DESC").all<{ tarih: string }>();
  const stale = results.slice(keep);
  if (stale.length === 0) return;
  const placeholders = stale.map(() => "?").join(",");
  await env.DB.prepare(`DELETE FROM daily_backups WHERE tarih IN (${placeholders})`)
    .bind(...stale.map((r) => r.tarih))
    .run();
}

export async function listBackups(env: Env): Promise<Array<{ tarih: string; guncelleme: number; sporcuSayisi: number }>> {
  const { results } = await env.DB.prepare("SELECT tarih, guncelleme, veri_json FROM daily_backups ORDER BY tarih DESC").all<{
    tarih: string;
    guncelleme: number;
    veri_json: string;
  }>();
  return results.map((r) => {
    let sporcuSayisi = 0;
    try {
      sporcuSayisi = (JSON.parse(r.veri_json).athletes ?? []).length;
    } catch {
      sporcuSayisi = 0;
    }
    return { tarih: r.tarih, guncelleme: r.guncelleme, sporcuSayisi };
  });
}

/** Hard overwrite (not merge) — mirrors the client's geriYukleme flag forcing a full apply instead of turnuvaDBMerge. */
export async function restoreBackup(env: Env, tarih: string): Promise<{ applied: boolean }> {
  const row = await env.DB.prepare("SELECT veri_json FROM daily_backups WHERE tarih = ?").bind(tarih).first<{ veri_json: string }>();
  if (!row) return { applied: false };

  const snapshot = JSON.parse(row.veri_json) as Snapshot;
  const statements = [];
  for (const table of SNAPSHOT_TABLES) {
    statements.push(env.DB.prepare(`DELETE FROM ${table}`));
    for (const record of snapshot[table] as Array<Record<string, unknown>>) {
      const columns = Object.keys(record);
      const placeholders = columns.map(() => "?").join(", ");
      statements.push(
        env.DB.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`).bind(...columns.map((c) => record[c]))
      );
    }
  }
  await env.DB.batch(statements);
  return { applied: true };
}
