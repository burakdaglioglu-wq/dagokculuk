import type { Env } from "../env";

export async function ziyaretKaydet(env: Env, gun: string): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO tanitim_ziyaret (gun, sayac) VALUES (?, 1) ON CONFLICT(gun) DO UPDATE SET sayac = sayac + 1"
  )
    .bind(gun)
    .run();
}

/** Sitede deneme dersi talebi (form gönderimi / "deneme dersi" WhatsApp düğmesi) — yalnız SAYI, kişi bilgisi yok.
 * Ayrı tablo açmamak için ziyaret tablosunda "talep:YYYY-MM-DD" anahtarıyla tutulur (ay özetinin LIKE 'YYYY-MM%'
 * sorgusuna karışmaz). */
export async function talepKaydet(env: Env, gun: string): Promise<void> {
  await ziyaretKaydet(env, "talep:" + gun);
}

export async function aralikToplam(env: Env, ilkGun: string, talep: boolean): Promise<number> {
  const row = await env.DB.prepare("SELECT SUM(sayac) AS toplam FROM tanitim_ziyaret WHERE gun >= ? AND gun < ?")
    .bind(talep ? "talep:" + ilkGun : ilkGun, talep ? "talep;" : "9999")
    .first<{ toplam: number | null }>();
  return row?.toplam ?? 0;
}

export async function ayOzetiGetir(env: Env, ayPrefix: string): Promise<number> {
  const row = await env.DB.prepare("SELECT SUM(sayac) AS toplam FROM tanitim_ziyaret WHERE gun LIKE ?")
    .bind(ayPrefix + "%")
    .first<{ toplam: number | null }>();
  return row?.toplam ?? 0;
}

export interface KulupNabzi {
  okSayisi: number;
  seriSayisi: number;
  sporcuSayisi: number;
  gunSayisi: number;
  /** uygulamaya geçildiğinden beri kaydedilen toplam ok ve ilk kayıt günü */
  toplamOk: number;
  ilkTarih: string | null;
}

/** Tanıtım sitesindeki "Canlı Kulüp Nabzı" widget'ı için — gerçek series/attendance_auto tablolarından son 30 günün
 * gerçek sayılarını çeker, hiçbir uydurma/örnek değer yok. Ok sayısı serilerin ok dizisinden sayılır (shot_log hiç
 * doldurulmadığı için eskiden hep 0 çıkıyordu). Ay başında rakamlar sönük kalmasın diye takvim ayı değil kayan 30 gün. */
export async function kulupNabziGetir(env: Env, baslangic: string): Promise<KulupNabzi> {
  const [seri, devam, toplam] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(json_array_length(oklar_json)), 0) AS ok FROM series WHERE tarih >= ? AND iptal = 0")
      .bind(baslangic)
      .first<{ n: number; ok: number }>(),
    env.DB.prepare("SELECT COUNT(DISTINCT ad) AS sporcu, COUNT(DISTINCT tarih) AS gun FROM attendance_auto WHERE tarih >= ?")
      .bind(baslangic)
      .first<{ sporcu: number; gun: number }>(),
    env.DB.prepare("SELECT COALESCE(SUM(json_array_length(oklar_json)), 0) AS ok, MIN(tarih) AS ilk FROM series WHERE iptal = 0")
      .first<{ ok: number; ilk: string | null }>(),
  ]);
  return {
    okSayisi: seri?.ok ?? 0,
    seriSayisi: seri?.n ?? 0,
    sporcuSayisi: devam?.sporcu ?? 0,
    gunSayisi: devam?.gun ?? 0,
    toplamOk: toplam?.ok ?? 0,
    ilkTarih: toplam?.ilk ?? null,
  };
}

export interface DersSaati { gun: number; bas: string; bit: string }

/** Tanıtım sitesindeki haftalık ders saatleri — kullanıcı kararı (2026-10-02): tüm dersler, grup adı ve doluluk
 * OLMADAN, yalnız gün + saat. Aynı gün aynı saatteki farklı grupların dersleri tek satıra iner. */
export async function dersSaatleriGetir(env: Env): Promise<DersSaati[]> {
  const { results } = await env.DB.prepare(
    "SELECT DISTINCT g.gun AS gun, p.baslangicSaat AS bas, p.bitisSaat AS bit FROM antrenman_programi p JOIN antrenman_programi_gun g ON g.slotId = p.id"
  ).all<DersSaati>();
  const sira = (g: number) => (g + 6) % 7; // Pazartesi başta
  return (results || []).sort((a, b) => sira(a.gun) - sira(b.gun) || a.bas.localeCompare(b.bas));
}
