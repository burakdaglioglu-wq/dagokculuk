import type { Env } from "../env";

export async function ziyaretKaydet(env: Env, gun: string): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO tanitim_ziyaret (gun, sayac) VALUES (?, 1) ON CONFLICT(gun) DO UPDATE SET sayac = sayac + 1"
  )
    .bind(gun)
    .run();
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
}

/** Tanıtım sitesindeki "Canlı Kulüp Nabzı" widget'ı için — gerçek series/attendance_auto tablolarından son 30 günün
 * gerçek sayılarını çeker, hiçbir uydurma/örnek değer yok. Ok sayısı serilerin ok dizisinden sayılır (shot_log hiç
 * doldurulmadığı için eskiden hep 0 çıkıyordu). Ay başında rakamlar sönük kalmasın diye takvim ayı değil kayan 30 gün. */
export async function kulupNabziGetir(env: Env, baslangic: string): Promise<KulupNabzi> {
  const [seri, devam] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(json_array_length(oklar_json)), 0) AS ok FROM series WHERE tarih >= ? AND iptal = 0")
      .bind(baslangic)
      .first<{ n: number; ok: number }>(),
    env.DB.prepare("SELECT COUNT(DISTINCT ad) AS sporcu, COUNT(DISTINCT tarih) AS gun FROM attendance_auto WHERE tarih >= ?")
      .bind(baslangic)
      .first<{ sporcu: number; gun: number }>(),
  ]);
  return {
    okSayisi: seri?.ok ?? 0,
    seriSayisi: seri?.n ?? 0,
    sporcuSayisi: devam?.sporcu ?? 0,
    gunSayisi: devam?.gun ?? 0,
  };
}
