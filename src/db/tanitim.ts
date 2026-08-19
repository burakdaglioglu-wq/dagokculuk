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

/** Tanıtım sitesindeki "Canlı Kulüp Nabzı" widget'ı için — gerçek shot_log/series/attendance_auto
 * tablolarından bu ayın gerçek sayılarını çeker, hiçbir uydurma/örnek değer yok. */
export async function kulupNabziGetir(env: Env, ayPrefix: string): Promise<KulupNabzi> {
  const like = ayPrefix + "%";
  const [ok, seri, devam] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS n FROM shot_log WHERE tarih LIKE ?").bind(like).first<{ n: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM series WHERE tarih LIKE ? AND iptal = 0").bind(like).first<{ n: number }>(),
    env.DB.prepare("SELECT COUNT(DISTINCT ad) AS sporcu, COUNT(DISTINCT tarih) AS gun FROM attendance_auto WHERE tarih LIKE ?")
      .bind(like)
      .first<{ sporcu: number; gun: number }>(),
  ]);
  return {
    okSayisi: ok?.n ?? 0,
    seriSayisi: seri?.n ?? 0,
    sporcuSayisi: devam?.sporcu ?? 0,
    gunSayisi: devam?.gun ?? 0,
  };
}
