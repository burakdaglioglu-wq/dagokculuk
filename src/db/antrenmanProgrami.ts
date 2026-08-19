import type { Env } from "../env";

export interface AntrenmanProgramiRow {
  id: number;
  grup: string;
  gun: number; // JS Date.getDay(): 0=Pazar..6=Cumartesi
  baslangicSaat: string; // "18:00"
  bitisSaat: string; // "19:30"
  hatirlatmaAktif: number; // D1'de 0/1
  hatirlatmaDakika: number;
  sonHatirlatmaTarihi: string | null; // "YYYY-MM-DD"
  dersPlani: string | null; // "bugün ne çalışacağız" kısa notu
  kapasite: number | null; // null = sınırsız
  olusturulma: number;
  guncelleme: number;
}

export async function listByGrup(env: Env, grup?: string): Promise<AntrenmanProgramiRow[]> {
  if (grup) {
    const rows = await env.DB.prepare(`SELECT * FROM antrenman_programi WHERE grup = ? ORDER BY gun, baslangicSaat`).bind(grup).all<AntrenmanProgramiRow>();
    return rows.results;
  }
  const rows = await env.DB.prepare(`SELECT * FROM antrenman_programi ORDER BY grup, gun, baslangicSaat`).all<AntrenmanProgramiRow>();
  return rows.results;
}

export interface Katilimci {
  grup: string;
  ad: string;
}

export interface Istisna {
  tarih: string; // "YYYY-MM-DD" — o slotun İPTAL EDİLEN spesifik bir haftalık oluşumu
  sebep: string | null;
}

/** Her slot'a kendi katılımcı listesini VE istisna (tek seferlik iptal) listesini gömerek döner —
 * istemci hem haftalık ızgarayı hem her dersin roster'ını/iptallerini TEK istekte alsın diye (N+1 fetch
 * olmasın). Sporcu tarafındaki "sıradaki ders" hesabı da aynı uç noktayı (grupsuz) kullanıyor. */
export async function listByGrupWithKatilimcilar(
  env: Env,
  grup?: string
): Promise<(AntrenmanProgramiRow & { katilimcilar: Katilimci[]; istisnalar: Istisna[] })[]> {
  const slots = await listByGrup(env, grup);
  if (!slots.length) return [];
  const { results: katilimcilar } = await env.DB.prepare(`SELECT slotId, grup, ad FROM antrenman_programi_katilimci`).all<{ slotId: number; grup: string; ad: string }>();
  const bySlot = new Map<number, Katilimci[]>();
  for (const k of katilimcilar) {
    if (!bySlot.has(k.slotId)) bySlot.set(k.slotId, []);
    bySlot.get(k.slotId)!.push({ grup: k.grup, ad: k.ad });
  }
  const { results: istisnalar } = await env.DB.prepare(`SELECT slotId, tarih, sebep FROM antrenman_programi_istisna`).all<{ slotId: number; tarih: string; sebep: string | null }>();
  const istisnaBySlot = new Map<number, Istisna[]>();
  for (const i of istisnalar) {
    if (!istisnaBySlot.has(i.slotId)) istisnaBySlot.set(i.slotId, []);
    istisnaBySlot.get(i.slotId)!.push({ tarih: i.tarih, sebep: i.sebep });
  }
  return slots.map((s) => ({ ...s, katilimcilar: bySlot.get(s.id) ?? [], istisnalar: istisnaBySlot.get(s.id) ?? [] }));
}

export async function listKatilimcilar(env: Env, slotId: number): Promise<Katilimci[]> {
  const { results } = await env.DB.prepare(`SELECT grup, ad FROM antrenman_programi_katilimci WHERE slotId = ?`).bind(slotId).all<Katilimci>();
  return results;
}

export async function addKatilimci(env: Env, slotId: number, grup: string, ad: string): Promise<void> {
  await env.DB.prepare(`INSERT OR IGNORE INTO antrenman_programi_katilimci (slotId, grup, ad, eklenme) VALUES (?, ?, ?, ?)`)
    .bind(slotId, grup, ad, Date.now())
    .run();
}

export async function removeKatilimci(env: Env, slotId: number, grup: string, ad: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM antrenman_programi_katilimci WHERE slotId = ? AND grup = ? AND ad = ?`).bind(slotId, grup, ad).run();
}

/** Bir slotun BUGÜN (verilen tarih) için istisnası (tek seferlik iptali) var mı — hatırlatma cron'u
 * gönderim yapmadan önce bunu kontrol ediyor. */
export async function hasIstisna(env: Env, slotId: number, tarih: string): Promise<boolean> {
  const row = await env.DB.prepare(`SELECT 1 FROM antrenman_programi_istisna WHERE slotId = ? AND tarih = ?`).bind(slotId, tarih).first();
  return !!row;
}

export async function addIstisna(env: Env, slotId: number, tarih: string, sebep: string | null): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO antrenman_programi_istisna (slotId, tarih, sebep, olusturulma) VALUES (?, ?, ?, ?)
     ON CONFLICT(slotId, tarih) DO UPDATE SET sebep = excluded.sebep`
  )
    .bind(slotId, tarih, sebep, Date.now())
    .run();
}

export async function removeIstisna(env: Env, slotId: number, tarih: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM antrenman_programi_istisna WHERE slotId = ? AND tarih = ?`).bind(slotId, tarih).run();
}

export async function createSlot(
  env: Env,
  row: Omit<AntrenmanProgramiRow, "id" | "sonHatirlatmaTarihi" | "guncelleme">
): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO antrenman_programi (grup, gun, baslangicSaat, bitisSaat, hatirlatmaAktif, hatirlatmaDakika, sonHatirlatmaTarihi, dersPlani, kapasite, olusturulma, guncelleme)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`
  )
    .bind(row.grup, row.gun, row.baslangicSaat, row.bitisSaat, row.hatirlatmaAktif, row.hatirlatmaDakika, row.dersPlani ?? null, row.kapasite ?? null, row.olusturulma, row.olusturulma)
    .run();
  return res.meta.last_row_id as number;
}

const SLOT_UPDATABLE_FIELDS = ["grup", "gun", "baslangicSaat", "bitisSaat", "hatirlatmaAktif", "hatirlatmaDakika", "dersPlani", "kapasite"] as const;

export async function updateSlot(
  env: Env,
  id: number,
  fields: Partial<Pick<AntrenmanProgramiRow, (typeof SLOT_UPDATABLE_FIELDS)[number]>>
): Promise<void> {
  // Savunma derinliği: bugün tek çağıran (src/routes/antrenmanProgrami.ts) zaten sabit-şekilli bir
  // obje inşa ediyor, yani şu an dışarıdan gelen keyfi bir JSON key'i buraya asla ulaşamıyor — Milo'daki
  // aynı desen (routes/milo/antrenmanProgrami.ts) da KENDİ allowlist'iyle (MILO_SLOT_UPDATABLE_FIELDS)
  // aynı korumaya sahip (2026-08-20 doğrulandı, önceki bir not burayı "enjekte edilebilir" diye
  // işaretlemişti — o zamanki hal düzeltilmiş, bu satır güncel). İleride bu fonksiyona (ya da Milo'daki
  // eşine) `body`'yi doğrudan geçiren yeni bir çağıran eklenirse aynı hataya düşülmesin diye burada da
  // çalışma zamanı doğrulaması var.
  const cols: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    if (!(SLOT_UPDATABLE_FIELDS as readonly string[]).includes(k)) throw new Error(`invalid field: ${k}`);
    cols.push(`${k} = ?`);
    values.push(v);
  }
  if (!cols.length) return;
  cols.push("guncelleme = ?");
  values.push(Date.now());
  values.push(id);
  await env.DB.prepare(`UPDATE antrenman_programi SET ${cols.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function deleteSlot(env: Env, id: number): Promise<void> {
  // D1/SQLite'ta FK ON DELETE CASCADE, bağlantı PRAGMA foreign_keys=ON olmadıkça garanti değil —
  // katılımcı VE istisna satırlarını burada AÇIKÇA temizliyoruz, deklaratif CASCADE'e güvenmiyoruz.
  await env.DB.prepare(`DELETE FROM antrenman_programi_katilimci WHERE slotId = ?`).bind(id).run();
  await env.DB.prepare(`DELETE FROM antrenman_programi_istisna WHERE slotId = ?`).bind(id).run();
  await env.DB.prepare(`DELETE FROM antrenman_programi WHERE id = ?`).bind(id).run();
}

/** Cron için: hatırlatması açık tüm satırlar. */
export async function listAllReminderActive(env: Env): Promise<AntrenmanProgramiRow[]> {
  const rows = await env.DB.prepare(`SELECT * FROM antrenman_programi WHERE hatirlatmaAktif = 1`).all<AntrenmanProgramiRow>();
  return rows.results;
}

export async function markReminded(env: Env, id: number, tarih: string): Promise<void> {
  await env.DB.prepare(`UPDATE antrenman_programi SET sonHatirlatmaTarihi = ?, guncelleme = ? WHERE id = ?`).bind(tarih, Date.now(), id).run();
}