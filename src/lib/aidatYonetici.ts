import type { Env } from "../env";
import { getMeta, setMeta } from "../db/meta";
import { sendPushToGroup } from "./push";
import { turkiyeSaatBilgisi } from "./reminders";

/** Yöneticinin "Bu telefona gelsin" dediği cihazlar push_subscriptions'ta bu grup adıyla durur (sporcu grubu değil). */
export const YONETICI_GRUP = "__yonetici";
const GECIKME_PAY = 7;

const ayEkle = (a: string, n: number) => { const [y, m] = a.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"); };
const AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/** meta aidat_ayar (kyDepo biçimi: { alan: { v, t } }) içindeki bildirimGun — 0/yok = kapalı. */
async function bildirimGunu(env: Env): Promise<number> {
  try { const d = JSON.parse((await getMeta(env, "aidat_ayar")) || "{}"); return parseInt(d?.bildirimGun?.v) || 0; } catch { return 0; }
}

/** Ödemeyenler + alışılmadık gecikenler. Panelle aynı fikir (yonetim-panel.js hesapla): aidatı takip edilmeyen (son 6 ayda
 * hiç ödemesi olmayan) sporcu, muaf, dondurulmuş/pasif ve bu ay dondurulmuş sayılmaz. Alışılmadık = son 6 ayda kendi ayı içinde
 * en az 3 ödeme, gün ortancası + 7 gün geçti. */
export async function aidatYoneticiOzet(env: Env, ay: string, bugunGun: number): Promise<{ odemeyen: string[]; alisilmadik: { ad: string; gun: number }[] }> {
  const { results: sp } = await env.DB.prepare("SELECT ad FROM athletes WHERE pasif = 0 AND donduruldu = 0 AND aidatMuaf = 0").all<{ ad: string }>();
  const { results: dues } = await env.DB.prepare("SELECT ad, ay, odendi, notMetin, odemeTarihi FROM dues WHERE ay BETWEEN ? AND ?")
    .bind(ayEkle(ay, -6), ay).all<{ ad: string; ay: string; odendi: number; notMetin: string | null; odemeTarihi: string | null }>();
  const k: Record<string, typeof dues> = {};
  dues.forEach((d) => { (k[d.ad] ??= []).push(d); });
  const odemeyen: string[] = [], alisilmadik: { ad: string; gun: number }[] = [];
  for (const { ad } of sp) {
    const l = k[ad] || [], bu = l.find((d) => d.ay === ay);
    if (bu?.odendi || (bu?.notMetin || "").startsWith("❄️")) continue;
    const once = l.filter((d) => d.ay < ay && d.odendi);
    if (!once.length) continue; // takipsiz
    odemeyen.push(ad);
    const gunler = once.filter((d) => d.odemeTarihi && d.odemeTarihi.slice(0, 7) === d.ay).map((d) => +String(d.odemeTarihi).slice(8, 10)).sort((a, b) => a - b);
    if (gunler.length >= 3) { const g = gunler[Math.floor((gunler.length - 1) / 2)]; if (bugunGun > g + GECIKME_PAY) alisilmadik.push({ ad, gun: g }); }
  }
  return { odemeyen, alisilmadik };
}

/** Her ay yöneticinin seçtiği gün Türkiye saatiyle 10:00'da (5 dk'lık cron penceresi) abone yönetici telefonlarına özet bildirimi. */
export async function checkAndSendAidatYoneticiOzet(env: Env): Promise<void> {
  const su = turkiyeSaatBilgisi(new Date());
  if (su.saat !== 10 || su.dakika >= 5) return;
  const gun = await bildirimGunu(env), bugunGun = Number(su.tarih.split("-")[2]);
  if (!gun || gun !== bugunGun) return;
  const ay = su.tarih.slice(0, 7);
  if ((await getMeta(env, "aidat_yon_bildirim_son")) === ay) return;
  await setMeta(env, "aidat_yon_bildirim_son", ay);
  await sendPushToGroup(env, YONETICI_GRUP, await ozetBildirim(env, ay, bugunGun));
}

export async function ozetBildirim(env: Env, ay: string, bugunGun: number, deneme = false) {
  const o = await aidatYoneticiOzet(env, ay, bugunGun), ayAd = AY[+ay.slice(5, 7) - 1];
  const ilk = (l: string[]) => l.slice(0, 4).join(", ") + (l.length > 4 ? ` +${l.length - 4}` : "");
  const body = o.odemeyen.length
    ? `${o.odemeyen.length} sporcu henüz ödemedi: ${ilk(o.odemeyen)}.` + (o.alisilmadik.length ? ` ⚠ ${o.alisilmadik.length} kişi her zamanki gününü geçti: ${ilk(o.alisilmadik.map((x) => x.ad))}.` : "") + " Listeyi açmak için dokun."
    : "Bu ay ödemeyen görünmüyor 🎉";
  return { title: `${deneme ? "(Deneme) " : ""}💳 ${ayAd} aidatı`, body, tag: "aidat-yonetici-" + ay, data: { kind: "aidat-yonetici", ay } };
}

export async function yoneticiAboneSayisi(env: Env): Promise<number> {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM push_subscriptions WHERE grup = ?").bind(YONETICI_GRUP).first<{ n: number }>();
  return r?.n ?? 0;
}
