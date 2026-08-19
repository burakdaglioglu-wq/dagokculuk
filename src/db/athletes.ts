import type { Env } from "../env";
import { resolveAthleteRedirect } from "./moves";

export interface AthleteRow {
  grup: string;
  ad: string;
  kod: string | null;
  dogumYili: number | null;
  sinif: string | null;
  yay: string | null;
  cinsiyet: string | null;
  pasif: number;
  donduruldu: number;
  toplamSkor: number;
  xAdet: number;
  sonSkorZamani: number | null;
  lastModified: number;
  coin: number;
  coinT: number;
  gamification_json: string;
  kartGecmisi_json: string;
  gecmisSezonlar_json: string;
  detayliOklar_json: string;
  biyomotorTestleri_json: string;
  ekipmanBilgisi_json: string;
  acilKisi: string | null;
  acilTelefon: string | null;
  antrenmanNotu: string | null;
  genelNot: string | null;
  dogumTarihi: string | null;
  katilmaTarihi: string | null;
  aileMeslek: string | null;
  aidatMuaf: number;
  saglikRaporuBitis: string | null;
  lisansBitis: string | null;
  hazirOlma_json: string | null;
  fotoUrl: string | null;
}

export interface AthleteDTO {
  grup: string;
  ad: string;
  kod: string | null;
  dogumYili: number | null;
  sinif: string | null;
  yay: string | null;
  cinsiyet: string | null;
  pasif: boolean;
  donduruldu: boolean;
  toplamSkor: number;
  xAdet: number;
  sonSkorZamani: number | null;
  lastModified: number;
  coin: number;
  coinT: number;
  kartGecmisi: unknown[];
  gecmisSezonlar: unknown[];
  detayliOklar: unknown[];
  biyomotorTestleri: unknown[];
  ekipmanBilgisi: { nisangah: unknown[]; bakim: unknown[]; notlar: unknown[] };
  acilKisi: string | null;
  acilTelefon: string | null;
  antrenmanNotu: string | null;
  genelNot: string | null;
  dogumTarihi: string | null;
  katilmaTarihi: string | null;
  aileMeslek: string | null;
  aidatMuaf: boolean;
  saglikRaporuBitis: string | null;
  lisansBitis: string | null;
  hazirOlma: { tarih: string; uyku: number; yorgunluk: number; motivasyon: number } | null;
  // Admin tarafından yüklenen profil fotoğrafı — özellikle Karışık Sınıf'ta görsel tanıma için.
  // BİLEREK gamification_json blob'una girmiyor (self-servis "kapak" fotoğrafından FARKLI, admin-yönetimli).
  fotoUrl: string | null;
  [gamificationField: string]: unknown;
}

function toDTO(row: AthleteRow): AthleteDTO {
  const gamification = JSON.parse(row.gamification_json || "{}");
  return {
    grup: row.grup,
    ad: row.ad,
    kod: row.kod,
    dogumYili: row.dogumYili,
    sinif: row.sinif,
    yay: row.yay,
    cinsiyet: row.cinsiyet,
    pasif: !!row.pasif,
    donduruldu: !!row.donduruldu,
    toplamSkor: row.toplamSkor,
    xAdet: row.xAdet,
    sonSkorZamani: row.sonSkorZamani,
    lastModified: row.lastModified,
    coin: row.coin,
    coinT: row.coinT,
    kartGecmisi: JSON.parse(row.kartGecmisi_json || "[]"),
    gecmisSezonlar: JSON.parse(row.gecmisSezonlar_json || "[]"),
    detayliOklar: JSON.parse(row.detayliOklar_json || "[]"),
    biyomotorTestleri: JSON.parse(row.biyomotorTestleri_json || "[]"),
    ekipmanBilgisi: JSON.parse(row.ekipmanBilgisi_json || '{"nisangah":[],"bakim":[],"notlar":[]}'),
    acilKisi: row.acilKisi,
    acilTelefon: row.acilTelefon,
    antrenmanNotu: row.antrenmanNotu,
    genelNot: row.genelNot,
    dogumTarihi: row.dogumTarihi,
    katilmaTarihi: row.katilmaTarihi,
    aileMeslek: row.aileMeslek,
    aidatMuaf: !!row.aidatMuaf,
    saglikRaporuBitis: row.saglikRaporuBitis,
    lisansBitis: row.lisansBitis,
    hazirOlma: row.hazirOlma_json ? JSON.parse(row.hazirOlma_json) : null,
    fotoUrl: row.fotoUrl,
    ...gamification,
  };
}

export async function listAthletes(env: Env, grup?: string): Promise<AthleteDTO[]> {
  const stmt = grup
    ? env.DB.prepare("SELECT * FROM athletes WHERE grup = ?").bind(grup)
    : env.DB.prepare("SELECT * FROM athletes");
  const { results } = await stmt.all<AthleteRow>();
  return results.map(toDTO);
}

export async function getAthlete(env: Env, grup: string, ad: string): Promise<AthleteDTO | null> {
  const row = await env.DB.prepare("SELECT * FROM athletes WHERE grup = ? AND ad = ?").bind(grup, ad).first<AthleteRow>();
  return row ? toDTO(row) : null;
}

export async function listDeletedAthletes(env: Env): Promise<Array<{ grup: string; ad: string; tarih: number; tasindi: boolean }>> {
  const { results } = await env.DB.prepare("SELECT grup, ad, tarih, tasindi FROM deleted_athletes").all<{
    grup: string;
    ad: string;
    tarih: number;
    tasindi: number;
  }>();
  return results.map((r) => ({ ...r, tasindi: !!r.tasindi }));
}

interface UpsertInput {
  grup: string;
  ad: string;
  kod?: string | null;
  dogumYili?: number | null;
  sinif?: string | null;
  yay?: string | null;
  cinsiyet?: string | null;
  lastModified: number;
}

/** Create or (redirect-aware) reactivate an athlete, honoring tombstones. */
export async function createAthlete(
  env: Env,
  input: UpsertInput
): Promise<{ applied: boolean; reason?: string; athlete?: AthleteDTO }> {
  const target = await resolveAthleteRedirect(env, { grup: input.grup, ad: input.ad });

  const tombstone = await env.DB.prepare("SELECT tarih, tasindi FROM deleted_athletes WHERE grup = ? AND ad = ?")
    .bind(target.grup, target.ad)
    .first<{ tarih: number; tasindi: number }>();

  if (tombstone && !tombstone.tasindi && input.lastModified <= tombstone.tarih) {
    return { applied: false, reason: "deleted" };
  }
  if (tombstone && !tombstone.tasindi && input.lastModified > tombstone.tarih) {
    await env.DB.prepare("DELETE FROM deleted_athletes WHERE grup = ? AND ad = ?").bind(target.grup, target.ad).run();
  }

  await env.DB.prepare(
    `INSERT INTO athletes (grup, ad, kod, dogumYili, sinif, yay, cinsiyet, lastModified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(grup, ad) DO UPDATE SET
       kod = excluded.kod, dogumYili = excluded.dogumYili, sinif = excluded.sinif,
       yay = excluded.yay, cinsiyet = excluded.cinsiyet, lastModified = excluded.lastModified
     WHERE excluded.lastModified > athletes.lastModified`
  )
    .bind(
      target.grup,
      target.ad,
      input.kod ?? null,
      input.dogumYili ?? null,
      input.sinif ?? null,
      input.yay ?? null,
      input.cinsiyet ?? null,
      input.lastModified
    )
    .run();

  const athlete = await getAthlete(env, target.grup, target.ad);
  return { applied: true, athlete: athlete ?? undefined };
}

/** Conditional last-writer-wins update of the core fields — replaces turnuvaDBMerge's per-athlete LWW. */
export const ATHLETE_UPDATABLE_FIELDS = [
  "kod",
  "dogumYili",
  "sinif",
  "yay",
  "cinsiyet",
  "pasif",
  "donduruldu",
  "toplamSkor",
  "xAdet",
  "sonSkorZamani",
  "kartGecmisi_json",
  "gecmisSezonlar_json",
  "detayliOklar_json",
  "biyomotorTestleri_json",
  "ekipmanBilgisi_json",
  "acilKisi",
  "acilTelefon",
  "antrenmanNotu",
  "genelNot",
  "dogumTarihi",
  "katilmaTarihi",
  "aileMeslek",
  "aidatMuaf",
  "saglikRaporuBitis",
  "lisansBitis",
  "hazirOlma_json",
  "fotoUrl",
] as const;

export async function updateAthlete(
  env: Env,
  grup: string,
  ad: string,
  fields: Partial<Pick<AthleteRow, (typeof ATHLETE_UPDATABLE_FIELDS)[number]>>,
  lastModified: number
): Promise<{ applied: boolean }> {
  const target = await resolveAthleteRedirect(env, { grup, ad });
  const columns = Object.keys(fields);
  if (columns.length === 0) return { applied: false };
  const invalid = columns.filter((c) => !(ATHLETE_UPDATABLE_FIELDS as readonly string[]).includes(c));
  if (invalid.length > 0) throw new Error(`invalid field(s): ${invalid.join(", ")}`);

  const setClause = columns.map((c) => `${c} = ?`).join(", ");
  const values = columns.map((c) => (fields as Record<string, unknown>)[c]);

  const result = await env.DB.prepare(
    `UPDATE athletes SET ${setClause}, lastModified = ? WHERE grup = ? AND ad = ? AND lastModified < ?`
  )
    .bind(...values, lastModified, target.grup, target.ad, lastModified)
    .run();

  return { applied: (result.meta.changes ?? 0) > 0 };
}

/** Independent coinT-guarded gamification lane — a scoring write can never clobber concurrently-earned coins. */
export async function updateGamification(
  env: Env,
  grup: string,
  ad: string,
  gamification: Record<string, unknown>,
  coin: number,
  coinT: number
): Promise<{ applied: boolean }> {
  const target = await resolveAthleteRedirect(env, { grup, ad });
  const result = await env.DB.prepare(
    "UPDATE athletes SET coin = ?, coinT = ?, gamification_json = ? WHERE grup = ? AND ad = ? AND coinT < ?"
  )
    .bind(coin, coinT, JSON.stringify(gamification), target.grup, target.ad, coinT)
    .run();
  return { applied: (result.meta.changes ?? 0) > 0 };
}

export async function moveAthlete(
  env: Env,
  fromGrup: string,
  fromAd: string,
  toGrup: string,
  toAd: string,
  zaman: number
): Promise<{ applied: boolean }> {
  const source = await resolveAthleteRedirect(env, { grup: fromGrup, ad: fromAd });

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO deleted_athletes (grup, ad, tarih, tasindi) VALUES (?, ?, ?, 1)
       ON CONFLICT(grup, ad) DO UPDATE SET tarih = excluded.tarih, tasindi = 1`
    ).bind(source.grup, source.ad, zaman),
    env.DB.prepare(
      `INSERT INTO athlete_moves (eski_grup, eski_ad, yeni_grup, yeni_ad, tasindi_zaman) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(eski_grup, eski_ad) DO UPDATE SET yeni_grup = excluded.yeni_grup, yeni_ad = excluded.yeni_ad, tasindi_zaman = excluded.tasindi_zaman`
    ).bind(source.grup, source.ad, toGrup, toAd, zaman),
    env.DB.prepare("UPDATE athletes SET grup = ?, ad = ? WHERE grup = ? AND ad = ?").bind(toGrup, toAd, source.grup, source.ad),
  ]);

  return { applied: true };
}

// "Canlı Veli İzleme" — izleKodu BİLEREK AthleteDTO/toDTO'ya eklenmedi (GET /api/athletes tüm kulübü
// döndürüyor, kod orada da görünseydi "tahmin edilemez link" özelliği anlamsızlaşırdı). Sadece bu iki
// dar fonksiyon üzerinden okunabilir/yazılabilir.
export async function getOrCreateIzleKodu(env: Env, grup: string, ad: string): Promise<string | null> {
  const target = await resolveAthleteRedirect(env, { grup, ad });
  const row = await env.DB.prepare("SELECT izleKodu FROM athletes WHERE grup = ? AND ad = ?").bind(target.grup, target.ad).first<{ izleKodu: string | null }>();
  if (!row) return null;
  if (row.izleKodu) return row.izleKodu;
  const kod = crypto.randomUUID().replace(/-/g, "");
  await env.DB.prepare("UPDATE athletes SET izleKodu = ? WHERE grup = ? AND ad = ?").bind(kod, target.grup, target.ad).run();
  return kod;
}

export async function resolveIzleKodu(env: Env, kod: string): Promise<{ grup: string; ad: string } | null> {
  const row = await env.DB.prepare("SELECT grup, ad FROM athletes WHERE izleKodu = ?").bind(kod).first<{ grup: string; ad: string }>();
  return row ?? null;
}

export async function deleteAthlete(env: Env, grup: string, ad: string, zaman: number): Promise<{ applied: boolean }> {
  const target = await resolveAthleteRedirect(env, { grup, ad });
  await env.DB.prepare(
    `INSERT INTO deleted_athletes (grup, ad, tarih, tasindi) VALUES (?, ?, ?, 0)
     ON CONFLICT(grup, ad) DO UPDATE SET tarih = excluded.tarih, tasindi = 0`
  )
    .bind(target.grup, target.ad, zaman)
    .run();
  return { applied: true };
}
