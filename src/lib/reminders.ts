import type { Env } from "../env";
import { listAllReminderActive, markReminded, listKatilimcilar, hasIstisna } from "../db/antrenmanProgrami";
import { sendPushToGroup, sendPushToAthlete } from "./push";

const GUN_ADI = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const GUN_KISA_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Cloudflare Workers runtime'ında Date nesnesinin "yerel" getter'ları (getDay/getHours/vb.) UTC
 * döner — makinenin/isolate'in bir zaman dilimi ayarı yoktur. Kulüp Türkiye'de çalıştığı için
 * antrenman saatleri (baslangicSaat "18:00" gibi) hep Türkiye duvar saati anlamına gelir. Bu yüzden
 * cron mantığı UTC'yi Intl ile Europe/Istanbul'a çevirerek "şu an Türkiye'de kaçıncı gün/saat"i
 * kendi hesaplıyor — Date'in yerel getter'larına asla güvenmiyor. */
function turkiyeSaatBilgisi(simdi: Date): { gun: number; saat: number; dakika: number; tarih: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(simdi);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    gun: GUN_KISA_MAP[get("weekday")] ?? simdi.getUTCDay(),
    saat: Number(get("hour")),
    dakika: Number(get("minute")),
    tarih: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/** Cron tetiklendiğinde (bkz. src/index.ts scheduled()) her ~5 dakikada bir çağrılır.
 * Hatırlatması açık her program satırı için "şu an (Türkiye saatiyle) başlangıca hatırlatmaDakika
 * kaldı mı" kontrol eder (5 dakikalık polling penceresiyle örtüşecek şekilde), eşleşirse ve bugün
 * için daha önce gönderilmediyse (sonHatirlatmaTarihi) o SLOT'UN KATILIMCI listesindeki her sporcuya
 * ayrı ayrı push atar — artık slot.grup'a değil, çünkü bir sporcu nominal grubu farklı bile olsa o
 * derse kayıtlı olabilir (bkz. antrenman_programi_katilimci, migrations/0032). Roster boşsa (henüz
 * kimse eklenmemiş yeni bir slot) hiç kimseye gönderilmez — bu doğru davranış. */
export async function checkAndSendReminders(env: Env): Promise<void> {
  const slots = await listAllReminderActive(env);
  if (!slots.length) return;

  const su = turkiyeSaatBilgisi(new Date());
  const nowDakika = su.saat * 60 + su.dakika;

  for (const slot of slots) {
    if (slot.gun !== su.gun) continue;
    if (slot.sonHatirlatmaTarihi === su.tarih) continue;

    const [saat, dakika] = slot.baslangicSaat.split(":").map(Number);
    if (Number.isNaN(saat) || Number.isNaN(dakika)) continue;

    const kalanDakika = saat * 60 + dakika - nowDakika;
    // 5 dakikalık polling penceresi: (hatirlatmaDakika-5, hatirlatmaDakika] arasında yakala
    if (kalanDakika > slot.hatirlatmaDakika || kalanDakika <= slot.hatirlatmaDakika - 5) continue;

    // Bu HAFTAKİ oluşum tek seferlik iptal edilmişse (bkz. antrenman_programi_istisna, migrations/0033)
    // hiç kimseye bildirim gitmesin — haftalık tanım bozulmadan sadece bu tarih atlanıyor.
    if (await hasIstisna(env, slot.id, su.tarih)) continue;

    const katilimcilar = await listKatilimcilar(env, slot.id);
    await Promise.all(
      katilimcilar.map((k) =>
        sendPushToAthlete(env, k.grup, k.ad, {
          title: "⏰ Antrenman Hatırlatması",
          body: `${GUN_ADI[slot.gun]} ${slot.baslangicSaat} dersin ${slot.hatirlatmaDakika} dakika sonra başlıyor!`,
          tag: "antrenman-" + slot.id,
          data: { kind: "antrenman-hatirlatma", grup: k.grup, slotId: slot.id },
        })
      )
    );
    await markReminded(env, slot.id, su.tarih);
  }
}

/** Her ayın 5'i, Türkiye saatiyle 10:00 civarı (5dk'lık cron penceresiyle örtüşecek şekilde) çalışır.
 * O ayı henüz ödememiş her aktif sporcuya (kendi cihazına, abone olduysa) bir kez hatırlatma push'u
 * atar — aidat_hatirlatma_log aynı ay için tekrar göndermeyi engeller. */
export async function checkAndSendAidatReminders(env: Env): Promise<void> {
  const su = turkiyeSaatBilgisi(new Date());
  const gunNo = Number(su.tarih.split("-")[2]);
  if (gunNo !== 5 || su.saat !== 10 || su.dakika >= 5) return;

  const ayStr = su.tarih.slice(0, 7);

  const { results: athletes } = await env.DB.prepare("SELECT grup, ad FROM athletes WHERE pasif = 0").all<{ grup: string; ad: string }>();
  if (!athletes.length) return;

  const { results: duesRows } = await env.DB.prepare("SELECT ad FROM dues WHERE ay = ? AND odendi = 1").bind(ayStr).all<{ ad: string }>();
  const odenenSet = new Set(duesRows.map((d) => d.ad));

  const { results: hatirlatilanlar } = await env.DB.prepare("SELECT ad FROM aidat_hatirlatma_log WHERE ay = ?").bind(ayStr).all<{ ad: string }>();
  const hatirlatilanSet = new Set(hatirlatilanlar.map((h) => h.ad));

  for (const a of athletes) {
    if (odenenSet.has(a.ad) || hatirlatilanSet.has(a.ad)) continue;

    await sendPushToAthlete(env, a.grup, a.ad, {
      title: "💳 Aidat Hatırlatması",
      body: `${ayStr} ayı aidatınız henüz görünmüyor. Ödediyseniz kulübe bildirmeniz yeterli 🧡`,
      tag: "aidat-" + ayStr,
      data: { kind: "aidat-hatirlatma", ay: ayStr },
    });
    await env.DB.prepare("INSERT INTO aidat_hatirlatma_log (ad, ay, t) VALUES (?, ?, ?) ON CONFLICT(ad, ay) DO NOTHING")
      .bind(a.ad, ayStr, Date.now())
      .run();
  }
}

const BELGE_UYARI_GUN = 14;

/** Her gün Türkiye saatiyle ~09:00 civarı (5dk'lık cron penceresiyle örtüşecek şekilde) çalışır.
 * Sağlık raporu veya lisansının bitiş tarihine BELGE_UYARI_GUN gün veya daha az kalmış (ya da süresi
 * zaten dolmuş) her aktif sporcuya bir hatırlatma push'u atar. `belge_hatirlatma_log`'daki anahtar
 * (ad, tip, tarih) — tarih burada bitiş tarihinin KENDİSİ olduğu için, rapor/lisans yenilenip yeni bir
 * bitiş tarihi girilince otomatik olarak yeniden hatırlatılabilir (eski tarih için tekrar gönderilmez). */
export async function checkAndSendBelgeReminders(env: Env): Promise<void> {
  const su = turkiyeSaatBilgisi(new Date());
  if (su.saat !== 9 || su.dakika >= 5) return;

  const { results: athletes } = await env.DB.prepare(
    "SELECT grup, ad, saglikRaporuBitis, lisansBitis FROM athletes WHERE pasif = 0 AND (saglikRaporuBitis IS NOT NULL OR lisansBitis IS NOT NULL)"
  ).all<{ grup: string; ad: string; saglikRaporuBitis: string | null; lisansBitis: string | null }>();
  if (!athletes.length) return;

  const bugun = new Date(su.tarih + "T00:00:00Z").getTime();
  const kontrolEt = async (tip: "saglik" | "lisans", ad: string, grup: string, bitisTarihi: string, baslik: string) => {
    const bitisT = new Date(bitisTarihi + "T00:00:00Z").getTime();
    const kalanGun = Math.round((bitisT - bugun) / 86400000);
    if (kalanGun > BELGE_UYARI_GUN) return;

    const zatenGonderildi = await env.DB.prepare("SELECT 1 FROM belge_hatirlatma_log WHERE ad = ? AND tip = ? AND tarih = ?")
      .bind(ad, tip, bitisTarihi)
      .first();
    if (zatenGonderildi) return;

    const durum = kalanGun < 0 ? "süresi doldu" : `${kalanGun} gün kaldı`;
    await sendPushToAthlete(env, grup, ad, {
      title: baslik,
      body: `${bitisTarihi} tarihli belgenizin ${durum}. Lütfen kulübe güncel belgenizi iletin.`,
      tag: `belge-${tip}-${ad}`,
      data: { kind: "belge-hatirlatma", tip },
    });
    await env.DB.prepare("INSERT INTO belge_hatirlatma_log (ad, tip, tarih, t) VALUES (?, ?, ?, ?) ON CONFLICT(ad, tip, tarih) DO NOTHING")
      .bind(ad, tip, bitisTarihi, Date.now())
      .run();
  };

  for (const a of athletes) {
    if (a.saglikRaporuBitis) await kontrolEt("saglik", a.ad, a.grup, a.saglikRaporuBitis, "🩺 Sağlık Raporu Hatırlatması");
    if (a.lisansBitis) await kontrolEt("lisans", a.ad, a.grup, a.lisansBitis, "🪪 Lisans Hatırlatması");
  }
}

/** Her gün Türkiye saatiyle ~08:00 civarı (5dk'lık cron penceresiyle örtüşecek şekilde) çalışır.
 * `dogumTarihi`'nin ay-gün kısmı bugüne denk gelen her aktif sporcu için gruba tek bir kutlama
 * push'u atar (hem kutlanan sporcuya hem grup arkadaşlarına aynı çağrıda ulaşır).
 * `dogum_gunu_hatirlatma_log`'daki (ad, yil) anahtarı aynı yıl içinde tekrar göndermeyi engeller —
 * bir sonraki yıl otomatik olarak tekrar gönderilebilir olur. */
export async function checkAndSendBirthdayReminders(env: Env): Promise<void> {
  const su = turkiyeSaatBilgisi(new Date());
  if (su.saat !== 8 || su.dakika >= 5) return;

  const bugunAyGun = su.tarih.slice(5); // "MM-DD"
  const yil = Number(su.tarih.slice(0, 4));

  const { results: athletes } = await env.DB.prepare(
    "SELECT grup, ad, dogumTarihi FROM athletes WHERE pasif = 0 AND dogumTarihi IS NOT NULL"
  ).all<{ grup: string; ad: string; dogumTarihi: string }>();
  if (!athletes.length) return;

  for (const a of athletes) {
    if (a.dogumTarihi.length < 10 || a.dogumTarihi.slice(5) !== bugunAyGun) continue;

    const zatenGonderildi = await env.DB.prepare("SELECT 1 FROM dogum_gunu_hatirlatma_log WHERE ad = ? AND yil = ?")
      .bind(a.ad, yil)
      .first();
    if (zatenGonderildi) continue;

    await sendPushToGroup(env, a.grup, {
      title: "🎂 Bugün Doğum Günü!",
      body: `${a.ad} bugün doğum günü kutluyor — DAĞ S.K. ailesi olarak tebrik edelim! 🏹`,
      tag: `dogum-gunu-${a.ad}-${yil}`,
      data: { kind: "dogum-gunu", ad: a.ad },
    });
    await env.DB.prepare("INSERT INTO dogum_gunu_hatirlatma_log (ad, yil, t) VALUES (?, ?, ?) ON CONFLICT(ad, yil) DO NOTHING")
      .bind(a.ad, yil, Date.now())
      .run();
  }
}