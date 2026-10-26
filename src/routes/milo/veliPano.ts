// 🎡 Milo veli panosu (2026-10-26, kullanıcı taslaklardan "2 · Halka pano"yu seçti) — sporcu girişinde dönen ek bilgiler:
// 8 derslik paket (Öğrenci Defteri'nin hesabı), telafi hakkı, ödeme durumu (tutar YOK), çocuğun dersleri (sıradaki dersi istemci
// hesaplar — cihaz saatiyle), Ders Günlüğü'nden son "neler yaptık". Hepsi mevcut kayıtlardan okunur, yeni tablo yok.
// Paket kuralları public/milo/milo-defter.js mdGun / mdPaketler ile BİREBİR aynı — biri değişirse öbürü de.

type Durum = "g" | "y" | "h" | "t" | "k";
interface Kayit { iso: string; s: Durum }
interface Paket { no: number; dersler: Kayit[]; telafiler: Kayit[]; hak: number }

async function metaOku(db: D1Database, key: string): Promise<Record<string, any>> {
  const r = await db.prepare("SELECT value FROM meta WHERE key = ?").bind(key).first<{ value: string | null }>();
  try { return r?.value ? JSON.parse(r.value) : {}; } catch { return {}; }
}

// Ders Günlüğü yaş grubu (public/milo/milo-gunluk.js mgYasBul ile aynı)
function yasBul(ad: string): string | null {
  const s = String(ad || "").toLocaleLowerCase("tr-TR");
  if (/18\s*-\s*24/.test(s)) return "18-24 ay";
  if (/7\s*-\s*9/.test(s)) return "7-9 yaş";
  if (/4\s*-\s*6/.test(s)) return "4-6 yaş";
  if (/(^|\D)3\s*ya/.test(s)) return "3 yaş";
  if (/(^|\D)2\s*ya/.test(s)) return "2 yaş";
  return null;
}

function paketler(kayitlar: Kayit[]): Paket[] {
  const pk: Paket[] = [];
  const yeni = (): Paket => { const p: Paket = { no: pk.length + 1, dersler: [], telafiler: [], hak: 0 }; pk.push(p); return p; };
  for (const r of kayitlar) {
    const cur = pk[pk.length - 1]; // istemcideki "cur" = her zaman son açılan paket
    if (r.s === "t") { (pk.find((p) => p.hak > p.telafiler.length) || cur || yeni()).telafiler.push(r); continue; }
    if (r.s === "k") continue; // başka güne kaydı: paketten ders yemez
    const p = cur && cur.dersler.length < 8 ? cur : yeni();
    p.dersler.push(r);
    if (r.s === "y" || r.s === "h") p.hak++;
  }
  return pk;
}

export async function veliPanoVerisi(db: D1Database, uye: { grup: string; ad: string }) {
  const [attRes, ayniAd, yoklamaDurum, paketOdeme, gunluk] = await Promise.all([
    db.prepare("SELECT tarih, grup, geldi FROM attendance_auto WHERE ad = ? ORDER BY tarih").bind(uye.ad).all<{ tarih: string; grup: string | null; geldi: number }>(),
    db.prepare("SELECT grup FROM members WHERE ad = ?").bind(uye.ad).all<{ grup: string }>(),
    metaOku(db, "yoklama_durum"),
    metaOku(db, "paket_odeme"),
    metaOku(db, "ders_gunlugu"),
  ]);

  // ---- paket
  const gruplar = new Set(ayniAd.results.map((m) => m.grup));
  const kayitlar: Kayit[] = [];
  for (const a of attRes.results) {
    if (a.grup && a.grup !== uye.grup && gruplar.has(a.grup)) continue; // aynı adlı başka üyenin kaydı
    const e = yoklamaDurum[a.tarih + "|" + uye.ad], d = e && !e.sil ? e.d : null;
    const s: Durum = a.geldi ? (d === "telafi" ? "t" : "g") : d === "hasta" ? "h" : d === "baska" ? "k" : "y";
    kayitlar.push({ iso: a.tarih, s });
  }
  const pk = paketler(kayitlar);
  const son = pk[pk.length - 1] || null;
  const telafiHakki = pk.reduce((t, p) => t + Math.max(0, p.hak - p.telafiler.length), 0);
  const odeme = son ? paketOdeme[uye.grup + "|" + uye.ad + "|" + son.no] : null;
  const paket = son ? {
    no: son.no,
    dersler: son.dersler.map((r) => r.s),
    telafi: son.telafiler.length,
    odendi: !!(odeme && odeme.odendi),
    odemeTarihi: odeme && odeme.odendi ? odeme.odemeTarihi || null : null,
    telafiHakki,
  } : null;

  // ---- dersleri (programda kayıtlı olduğu saatler; yoksa grubunun saatleri)
  let { results: slotlar } = await db.prepare(
    `SELECT p.id, p.grup, p.gun, p.baslangicSaat, p.bitisSaat FROM antrenman_programi p
     JOIN antrenman_programi_katilimci k ON k.slotId = p.id WHERE k.grup = ? AND k.ad = ?`
  ).bind(uye.grup, uye.ad).all<{ id: number; grup: string; gun: number; baslangicSaat: string; bitisSaat: string }>();
  if (!slotlar.length) {
    ({ results: slotlar } = await db.prepare("SELECT id, grup, gun, baslangicSaat, bitisSaat FROM antrenman_programi WHERE grup = ?")
      .bind(uye.grup).all<{ id: number; grup: string; gun: number; baslangicSaat: string; bitisSaat: string }>());
  }
  const dersler: { grup: string; gunler: number[]; bas: string; bit: string; iptal: string[] }[] = [];
  if (slotlar.length) {
    const ids = slotlar.map((s) => s.id), yer = ids.map(() => "?").join(",");
    const [gunR, ipR] = await Promise.all([
      db.prepare(`SELECT slotId, gun FROM antrenman_programi_gun WHERE slotId IN (${yer})`).bind(...ids).all<{ slotId: number; gun: number }>(),
      db.prepare(`SELECT slotId, tarih FROM antrenman_programi_istisna WHERE slotId IN (${yer})`).bind(...ids).all<{ slotId: number; tarih: string }>(),
    ]);
    for (const s of slotlar) {
      const g = gunR.results.filter((x) => x.slotId === s.id).map((x) => x.gun);
      dersler.push({ grup: s.grup, gunler: g.length ? g.sort((a, b) => a - b) : [s.gun], bas: s.baslangicSaat, bit: s.bitisSaat, iptal: ipR.results.filter((x) => x.slotId === s.id).map((x) => x.tarih) });
    }
  }

  // ---- Ders Günlüğü: çocuğun yaş grubuna / dersine yazılmış son gün (son 14 gün)
  const yas = yasBul(uye.grup), sinir = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  const uygunHepsi = Object.values(gunluk).filter((k: any) => k && !k.sil && k.tarih && (
    (yas && Array.isArray(k.yaslar) && k.yaslar.includes(yas)) ||
    (k.slot && String(k.slot).startsWith(uye.grup + " ")) ||
    ((!k.yaslar || !k.yaslar.length) && !k.slot)
  )) as any[];
  const uygun = uygunHepsi.filter((k) => k.tarih >= sinir);
  uygun.sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0));
  const sonGun = uygun.length ? uygun[0].tarih : null;
  const buHafta = uygun.filter((k) => k.tarih === sonGun).slice(0, 3).map((k) => ({
    tarih: k.tarih, konu: String(k.konu || "").slice(0, 200), yapilanlar: String(k.yapilanlar || "").slice(0, 600), beceriler: Array.isArray(k.beceriler) ? k.beceriler.slice(0, 8) : [],
  }));

  // ---- "Bunları kazanacak" (2026-10-26, kullanıcı: "öğrendiği becerileri bunları kazanacak diye değiştirelim"): son 30 günde çocuğun
  // yaş grubunda / dersinde çalışılan beceriler, kaç derste çalışıldığıyla (Ders Günlüğü). Beceri işaretleme ekranı Milo'da kullanılmıyor.
  const sinir30 = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10), say: Record<string, number> = {};
  for (const k of uygunHepsi.filter((k) => k.tarih >= sinir30)) for (const b of Array.isArray(k.beceriler) ? k.beceriler : []) say[b] = (say[b] || 0) + 1;
  const kazanacak = Object.keys(say).sort((a, b) => say[b] - say[a]).slice(0, 8).map((id) => ({ id, ders: say[id] }));
  const buAy = new Date().toISOString().slice(0, 7), buAyGeldi = kayitlar.filter((r) => r.iso.slice(0, 7) === buAy && (r.s === "g" || r.s === "t")).length;

  return { paket, dersler, buHafta, kazanacak, buAyGeldi };
}
