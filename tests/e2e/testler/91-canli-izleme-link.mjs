// 2026-11-02: "🔗 Canlı İzleme Linki" sporcu profiline geri geldi (2026-10-21'de "sistemden atıyor, çirkin sayfa" diye kaldırılmıştı).
// Profil › Canlı izleme linki → link + QR penceresi profilin ÜSTÜNDE açılır, oturum sürer; izle.html açılır ve sporcunun adını gösterir;
// sunucu 401 dönse bile (oturum doğrulanamadı) oturum SİLİNMEZ, yalnız uyarı çıkar.
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 860 });
  try {
    await uygulamaAc(p);
    const s = await p.evaluate(() => { for (const g of ['buyukler', 'yildizlar', 'kucukler', 'minikler']) { const ad = Object.keys(turnuvaDB[g] || {}).find((a) => !turnuvaDB[g][a].pasif); if (ad) return { g, ad }; } return null; });
    dogrula(s, 'testte en az 1 sporcu gerekli');
    await p.evaluate((x) => sporcuProfilAc(x.g + '|' + x.ad), s); await p.waitForSelector('#yn-kart .yn-p-kart');
    // profil düğmelerinin onclick'i tam olmalı (esc tırnak kaçırmadığı için "sporcuKartAc(" diye kesiliyordu)
    const kesik = await p.evaluate(() => [...document.querySelectorAll('#ynk-panel [onclick]')].map((b) => b.getAttribute('onclick')).filter((o) => /\($/.test(o)));
    dogrula(!kesik.length, 'profil düğmelerinde kesik onclick: ' + kesik.join(' | '));
    const btn = p.locator('#yn-kart button', { hasText: 'Canlı izleme' });
    dogrula(await btn.count() === 1, 'profilde Canlı izleme linki düğmesi yok');
    await btn.click(); await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const m = document.getElementById('izle-linki-modal'), ic = m.firstElementChild || m, b = ic.getBoundingClientRect();
      const ust = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return { acik: getComputedStyle(m).display !== 'none', ustte: !!(ust && m.contains(ust)), oturum: !!_oturumToken, link: document.getElementById('izle-linki-input').value };
    });
    dogrula(r.acik, 'link penceresi açılmadı');
    dogrula(r.ustte, 'link penceresi profilin arkasında kaldı');
    dogrula(r.oturum, 'link isteğinden sonra oturum düştü');
    dogrula(/\/izle\.html\?kod=[0-9a-f]+/.test(r.link), 'link biçimi yanlış: ' + r.link);
    // izle.html açılır, sporcunun adını gösterir
    const p2 = await ctx.newPage();
    await p2.goto(r.link.replace(/^https?:\/\/[^/]+/, new URL(p.url()).origin)); await p2.waitForTimeout(2500);
    dogrula((await p2.textContent('body')).includes(s.ad), 'izleme sayfasında sporcu adı yok');
    await p2.close();
    // 401 → oturum silinmez
    await p.evaluate(() => { document.getElementById('izle-linki-modal').style.display = 'none'; });
    await p.route('**/izle-kodu', (rt) => rt.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"oturum-yok"}' }));
    await p.evaluate((x) => canliIzlemeLinkiGoster(x.g, x.ad), s); await p.waitForTimeout(600);
    dogrula(await p.evaluate(() => !!_oturumToken && !!localStorage.getItem('dag_oturum') || !!sessionStorage.getItem('dag_oturum')), '401 sonrası oturum silindi (kullanıcı sistemden atılırdı)');
    await p.unroute('**/izle-kodu');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('profil › link · pencere üstte · oturum sürer · izle.html ad · 401 oturumu silmez');
  } finally { await ctx.close(); }
}
