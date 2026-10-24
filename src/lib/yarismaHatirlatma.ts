import type { Env } from "../env";
import { sendPushToAthlete } from "./push";
import { turkiyeSaatBilgisi } from "./reminders";

/** 🏆 Yarışma skoru hatırlatması (v313, kullanıcı önerisi 5: "dün Eslem hiç girmedi").
 * Cron her ~5 dk'da çağırır; yalnız Türkiye saatiyle 20:00–20:04 (o günün yarışmaları) ve ertesi gün 10:00–10:04
 * (dünün yarışmaları) penceresinde iş yapar. Yarışmaya kayıtlı olup ne seri ne sonuç girmiş, eğitmenin resmi puanı da
 * olmayan sporcunun cihazına bir kez push gönderir. Gönderilenler meta `yarisma_hatirlatma` ({ "id|grup|ad|tur": t })
 * içinde tutulur ki aynı hatırlatma tekrar gitmesin. Veriler kyDepo meta anahtarlarından okunur (yarismalar,
 * yarisma_sporcu, yarisma_hedef — biçim: { anahtar: kayıt }). */
type Kayit = Record<string, any>;

function gunEkle(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

async function metaOku(env: Env, anahtar: string): Promise<Kayit> {
  const row = await env.DB.prepare("SELECT value FROM meta WHERE key = ?").bind(anahtar).first<{ value: string }>();
  if (!row || !row.value) return {};
  try {
    const v = JSON.parse(row.value);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export async function checkAndSendYarismaReminders(env: Env): Promise<void> {
  const su = turkiyeSaatBilgisi(new Date());
  if (su.dakika >= 5 || (su.saat !== 20 && su.saat !== 10)) return;
  const tur = su.saat === 20 ? "aksam" : "sabah";
  const hedefTarih = tur === "aksam" ? su.tarih : gunEkle(su.tarih, -1);

  const yarismalar = await metaOku(env, "yarismalar");
  const bugunku = Object.values(yarismalar).filter((y: any) => y && !y.sil && y.tarih === hedefTarih && Array.isArray(y.katilimci) && y.katilimci.length);
  if (!bugunku.length) return;

  const [sporcu, hedef, log] = await Promise.all([metaOku(env, "yarisma_sporcu"), metaOku(env, "yarisma_hedef"), metaOku(env, "yarisma_hatirlatma")]);
  let yeni = 0;
  for (const y of bugunku as any[]) {
    for (const k of y.katilimci as string[]) {
      const a = y.id + "|" + k, logAnahtar = a + "|" + tur;
      if (log[logAnahtar]) continue;
      const d = sporcu[a] || {}, rs = (hedef[a] || {}).resmi;
      const seri = d.mac && Array.isArray(d.mac.seriler) ? d.mac.seriler.length : 0;
      if (seri || (d.sonuc && d.sonuc.puan) || (rs && rs.puan != null && rs.puan !== "")) continue;
      const i = k.indexOf("|");
      if (i < 0) continue;
      const grup = k.slice(0, i), ad = k.slice(i + 1);
      await sendPushToAthlete(env, grup, ad, {
        title: "🏆 Yarışma skorun",
        body: `${String(y.ad || "Yarışma").trim()} — ${tur === "aksam" ? "bugünkü" : "dünkü"} skorunu henüz girmedin. Yarışma › Benim skorum'dan seri seri girebilirsin 🎯`,
        tag: "yarisma-" + y.id,
        data: { kind: "yarisma-hatirlatma", id: y.id },
      });
      log[logAnahtar] = Date.now();
      yeni++;
    }
  }
  if (!yeni) return;
  // 30 günden eski kayıtları buda, meta'ya yaz
  const sinir = Date.now() - 30 * 864e5;
  for (const x of Object.keys(log)) if (typeof log[x] !== "number" || log[x] < sinir) delete log[x];
  await env.DB.prepare("INSERT INTO meta (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
    .bind("yarisma_hatirlatma", JSON.stringify(log), Date.now())
    .run();
}
