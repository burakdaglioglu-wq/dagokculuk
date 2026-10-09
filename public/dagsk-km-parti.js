/* ================================================================================================
   🎉 OK PARTİSİ — Karışık Sınıf › Oyunlar (2026-10-10, kullanıcı: "Pummel Party içindeki oyunlar gibi bir oyun
   yap, önce tarayıcıda sun" → taslak onaylandı, "YAYINLA"). Yalnızca ilk açılışta yüklenir (kmSekme('parti') →
   kmEkCalistir). app.js genellerini kullanır (_kmListe, _skorKaydetCekirdek, onayIste, showToast, esc…).

   Oyun: 2-4 takım tur tahtasında (7x7 çevre, 24 kare) ilerler. Zar yerine GERÇEK seri: her 5 puan = 1 kare,
   27+ "altın seri" +1 anahtar. Kareler: anahtar, tuzak, mağaza (kalkan / çift hamle), takas (liderle yer
   değiştir), sürpriz olay. 3 anahtarla kupa sandığına varan (ya da üstünden geçen) kupayı alır, sandık
   ışınlanır. Her tur sonunda mini oyun (hepsi 3 okluk seri — kullanıcı: "tek ok muhabbeti olmasın, serinin en
   yükseği"): Sadece Altın, Sıcak Patates, Renk Avcısı, Düello. En çok kupa kazanır.
   Gerçek kayıt: her seri, o takımda sırası gelen sporcunun GERÇEK serisi olarak _skorKaydetCekirdek ile yazılır
   (kmOyunIlerlet'in yolu: limit dolunca onayIste ile uzatma, klasman + otomatik yoklama). Atan sporcu takım
   içinde otomatik döner, çipe dokunarak değiştirilir. Durum konum başına localStorage'da (sayfa yenilense de sürer).
   ================================================================================================ */
const KP_TAKIM = [
    { ad: 'Tilkiler', res: '/hayvankarakter/yeni/tilki.webp', r: '#FF8A3D' },
    { ad: 'Ahtapotlar', res: '/hayvankarakter/yeni/ahtapot.webp', r: '#FF5FA2' },
    { ad: 'Kediler', res: '/hayvankarakter/yeni/kedi.webp', r: '#FFD23F' },
    { ad: 'Timsahlar', res: '/hayvankarakter/yeni/timsah.webp', r: '#3DDC97' },
];
const KP_KUPA_FIYAT = 3;
const KP_PED = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];
const KP_RENK = { X: 'altin', '10': 'altin', '9': 'altin', '8': 'kirmizi', '7': 'kirmizi', '6': 'mavi', '5': 'mavi', '4': 'siyah', '3': 'siyah', '2': 'beyaz', '1': 'beyaz', M: 'gri' };
const KP_RENK_AD = { altin: 'SARI', kirmizi: 'KIRMIZI', mavi: 'MAVİ', siyah: 'SİYAH' };
const kpDeger = (v) => v === 'X' ? 10 : v === 'M' ? 0 : +v;
const kpOkSira = (v) => v === 'X' ? 11 : kpDeger(v);
const kpEnIyi = (oklar) => oklar.map(kpOkSira).sort((a, b) => b - a);
const kpKarsilastir = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (b[i] || 0) - (a[i] || 0); if (d) return d; } return 0; };
const kpEnYuksekOk = (oklar) => oklar.slice().sort((a, b) => kpOkSira(b) - kpOkSira(a))[0];
const KP_KONUM = []; for (let c = 0; c < 7; c++) KP_KONUM.push([0, c]); for (let r = 1; r < 6; r++) KP_KONUM.push([r, 6]); for (let c = 6; c >= 0; c--) KP_KONUM.push([6, c]); for (let r = 5; r >= 1; r--) KP_KONUM.push([r, 0]);
const KP_TIPLER = ['basla', 'anahtar', 'bos', 'tuzak', 'anahtar', 'olay', 'magaza', 'anahtar', 'bos', 'takas', 'tuzak', 'anahtar', 'olay', 'bos', 'anahtar', 'tuzak', 'magaza', 'anahtar', 'bos', 'olay', 'takas', 'anahtar', 'tuzak', 'bos'];
const KP_TIP_YAZI = { basla: ['🚩', 'Başla'], anahtar: ['🔑', 'Anahtar'], bos: ['·', ''], tuzak: ['🌵', 'Tuzak'], magaza: ['🛒', 'Mağaza'], takas: ['🔁', 'Takas'], olay: ['❓', 'Olay'] };
const KP_MINI = [
    { id: 'altin', ad: 'Sadece Altın', cocuk: 'Sarıyı vur! 🟡', acik: 'Her takım 3 ok atar. Yalnız sarı halka (X-10-9) sayılır. En çok sarı vuran +3 🔑, ikinci +1 🔑.' },
    { id: 'patates', ad: 'Sıcak Patates', cocuk: 'Bomba sende kalmasın! 💣', acik: 'Her takım 3 ok atar, serinin EN YÜKSEK oku sayılır. En düşük olanın elinde bomba patlar: −2 🔑.' },
    { id: 'renk', ad: 'Renk Avcısı', cocuk: 'Söylenen rengi vur! 🎨', acik: 'Hedef renk açıklanır. Her takım 3 ok atar. O renge en çok isabet ettiren +3 🔑.' },
    { id: 'duello', ad: 'Düello', cocuk: 'En iyi okun kazanır! ⚔️', acik: 'Her takım 3 ok atar, serinin EN YÜKSEK oku sayılır. En yüksek olan 🏆 KUPA kazanır! Eşitse eşit olanlar bir seri daha atar.' },
];

let _kp = null, _kpKurulum = { n: 2, tur: 5, gercek: true }, _kpPedHedef = null, _kpSes = null, _kpKarisik = null;
function kpAnahtar() { return 'dag_km_parti_' + (_kmAktifKonum || 'varsayilan'); }
function kpKaydetDurum() { try { if (_kp) localStorage.setItem(kpAnahtar(), JSON.stringify(_kp)); else localStorage.removeItem(kpAnahtar()); } catch (e) {} }
function kpYukle() { try { const v = JSON.parse(localStorage.getItem(kpAnahtar()) || 'null'); _kp = v && v.surum === 1 && !v.bitti ? v : null; } catch (e) { _kp = null; } if (_kp) { _kp.kilit = false; _kp.oklar = []; } }
const kp$ = (id) => document.getElementById(id);
const kpBekle = (ms) => new Promise((r) => setTimeout(r, ms));
function kpBip(f = 660, d = 0.07, tip = 'triangle') { try { _kpSes = _kpSes || new (window.AudioContext || window.webkitAudioContext)(); const o = _kpSes.createOscillator(), g = _kpSes.createGain(); o.type = tip; o.frequency.value = f; g.gain.setValueAtTime(0.12, _kpSes.currentTime); g.gain.exponentialRampToValueAtTime(0.001, _kpSes.currentTime + d); o.connect(g).connect(_kpSes.destination); o.start(); o.stop(_kpSes.currentTime + d); } catch (e) {} }
function kpUcan(m, renk = '#fff') { const k = kp$('kp-kok'); if (!k) return; const e = document.createElement('div'); e.className = 'kp-uc'; e.style.color = renk; e.textContent = m; k.appendChild(e); setTimeout(() => e.remove(), 1300); }
function kpLog(m) { _kp.gunluk.unshift(m); _kp.gunluk = _kp.gunluk.slice(0, 40); const g = kp$('kp-gunluk'); if (g) g.innerHTML = _kp.gunluk.map((x) => `<div>${x}</div>`).join(''); }

function kpKaynakYukle() {
    if (!document.getElementById('kp-font')) { const l = document.createElement('link'); l.id = 'kp-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800;900&display=swap'; document.head.appendChild(l); }
    if (document.getElementById('kp-stil')) return;
    const st = document.createElement('style'); st.id = 'kp-stil'; st.textContent = KP_CSS; document.head.appendChild(st);
}
const KP_CSS = `
.kp{--gece:#17112F;--gece2:#231A47;--cizgi:#3A2E6E;--yazi:#F6F1FF;--soluk:#A99BD6;--altin:#FFD23F;--kirmizi:#FF4D6D;--yesil:#3DDC97;--camgok:#4CC9F0;--mor:#B388FF;--turuncu:#FF8A3D;
  --kpf-b:'Baloo 2','Trebuchet MS',system-ui,sans-serif;--kpf-g:'Nunito',system-ui,sans-serif;
  position:relative;color:var(--yazi);font-family:var(--kpf-g);background:radial-gradient(1200px 700px at 50% -10%,#2E2366 0%,var(--gece) 60%),var(--gece);border-radius:22px;padding:16px;display:grid;gap:14px}
.kp:fullscreen{border-radius:0;overflow:auto;padding:22px}
.kp button{font-family:inherit;cursor:pointer}
.kp button:focus-visible{outline:3px solid var(--altin);outline-offset:2px}
.kp-ust{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px;justify-content:space-between}
.kp-logo{font:800 30px/1 var(--kpf-b);display:flex;align-items:center;gap:10px}.kp-logo i{font-style:normal;color:var(--altin)}
.kp-logo small{display:block;font:800 11px var(--kpf-g);letter-spacing:.16em;color:var(--soluk);text-transform:uppercase;margin-top:4px}
.kp-tur{display:flex;gap:8px;align-items:center;font-weight:900}.kp-tur .p{display:inline-flex;gap:5px}
.kp-tur .p span{width:22px;height:10px;border-radius:6px;background:var(--cizgi)}.kp-tur .p span.dolu{background:var(--altin)}.kp-tur .p span.simdi{background:var(--camgok)}
.kp-amac{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;background:linear-gradient(90deg,rgba(255,210,63,.16),rgba(255,210,63,.04));border-radius:18px;padding:10px 14px;box-shadow:inset 0 0 0 2px rgba(255,210,63,.35)}
.kp-amac b{font:800 20px/1.1 var(--kpf-b);color:var(--altin)}.kp-amac span{font-weight:800;font-size:14px}.kp-amac .kp-sag{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap}
.kp-ana{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:14px;align-items:start}
@media (max-width:900px){.kp-ana{grid-template-columns:1fr}}
.kp-tahta{position:relative;display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(7,1fr);gap:6px;aspect-ratio:1;max-width:100%;padding:10px;border-radius:24px;background:linear-gradient(160deg,#2B2058,#1C1540);box-shadow:inset 0 0 0 2px var(--cizgi),0 24px 50px rgba(0,0,0,.35)}
.kp-kare{position:relative;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-direction:column;font:800 clamp(14px,2.4vw,26px)/1 var(--kpf-b);box-shadow:inset 0 -6px 0 rgba(0,0,0,.22);transition:transform .2s}
.kp-kare b{font:900 clamp(7px,.9vw,10px) var(--kpf-g);letter-spacing:.08em;text-transform:uppercase;opacity:.85;margin-top:3px}
.kp-kare.bos{background:#3A3170}.kp-kare.anahtar{background:linear-gradient(#FFC93C,#F2A900);color:#3A2600}.kp-kare.tuzak{background:linear-gradient(#FF6B85,#E23557)}
.kp-kare.magaza{background:linear-gradient(#6EE7B7,#22B37C);color:#05301F}.kp-kare.takas{background:linear-gradient(#7FDBFF,#2BA8D9);color:#062B3A}
.kp-kare.olay{background:linear-gradient(#C9A7FF,#8F5CF0)}.kp-kare.basla{background:linear-gradient(#FFFFFF,#DCD3FF);color:#2B2058}
.kp-kare.vurgu{transform:scale(1.08);box-shadow:0 0 0 4px var(--yazi),0 0 30px rgba(255,255,255,.5)}
.kp-sandik{position:absolute;inset:-6px;border-radius:18px;border:4px dashed var(--altin);animation:kpSandik 1.4s ease-in-out infinite;pointer-events:none}
.kp-sandik::after{content:'🏆';position:absolute;top:-16px;right:-12px;font-size:clamp(18px,2.8vw,28px);filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))}
@keyframes kpSandik{50%{transform:scale(1.06);border-color:#fff}}
.kp-orta{grid-column:2/7;grid-row:2/4;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:10px;padding:12px 8px 6px;text-align:center;min-width:0}
.kp-kontrol{grid-column:2/7;grid-row:4/7;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;padding:6px 8px;text-align:center;min-width:0}
@media (max-width:700px){.kp{padding:12px;gap:10px}.kp-logo{font-size:24px}.kp-amac b{font-size:17px}.kp-amac span{font-size:12.5px}
  .kp-amac .kp-sag{margin-left:0;width:100%}.kp-amac .kp-btn{padding:6px 11px;font-size:12.5px}.kp-kare b{display:none}.kp-kare{font-size:20px}}
@media (max-width:700px){.kp-tahta{aspect-ratio:auto;grid-template-rows:repeat(7,calc((100vw - 120px) / 7)) auto}.kp-orta{grid-row:2/7;justify-content:center}.kp-kontrol{grid-column:1/8;grid-row:8;padding-top:14px}}
.kp-tas{position:absolute;transition:left .22s ease,top .22s ease;z-index:3;pointer-events:none}
.kp-tas img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 6px rgba(0,0,0,.45))}
.kp-tas .hal{position:absolute;inset:8% 4% -6%;border-radius:50%;border:3px solid var(--r);opacity:.9}
.kp-tas.zipla img{animation:kpZipla .22s ease}@keyframes kpZipla{50%{transform:translateY(-38%) scale(1.05)}}
.kp-sira{display:flex;align-items:center;gap:12px;min-width:0}
.kp-sira img{width:clamp(44px,7vw,68px);height:clamp(44px,7vw,68px);object-fit:contain}
.kp-sira h2{margin:0;font:800 clamp(20px,3.2vw,32px)/1 var(--kpf-b)}.kp-sira p{margin:2px 0 0;color:var(--soluk);font-weight:800;font-size:13px}
.kp-atan{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:100%}
.kp-atan button{border:0;border-radius:999px;padding:5px 11px;font:800 12.5px var(--kpf-g);background:rgba(255,255,255,.08);color:var(--yazi)}
.kp-atan button.aktif{background:var(--r);color:#17112F}
.kp-slotlar{display:flex;gap:8px;justify-content:center}
.kp-slot{width:clamp(40px,6.5vw,56px);height:clamp(40px,6.5vw,56px);border-radius:12px;border:3px dashed var(--cizgi);display:flex;align-items:center;justify-content:center;font:800 clamp(18px,2.8vw,26px) var(--kpf-b)}
.kp-slot.dolu{border-style:solid;border-color:transparent}
.kp-ped{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;width:min(100%,420px)}
.kp-ped button{border:0;border-radius:12px;padding:clamp(6px,1.3vw,12px) 0;font:800 clamp(15px,2.2vw,20px) var(--kpf-b);box-shadow:inset 0 -4px 0 rgba(0,0,0,.25)}
.kp-ped button:disabled{opacity:.45;cursor:not-allowed}
.kp .r-altin{background:#FFD23F;color:#2A1E00}.kp .r-kirmizi{background:#EF3B4A;color:#fff}.kp .r-mavi{background:#3D8BFF;color:#fff}.kp .r-siyah{background:#1E1B2E;color:#fff;box-shadow:inset 0 0 0 2px #4B4570}.kp .r-beyaz{background:#F2F0F7;color:#1E1B2E}.kp .r-gri{background:#6B6788;color:#fff}
.kp-eylem{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.kp-btn{border:0;border-radius:999px;padding:10px 18px;font:900 15px var(--kpf-g);background:var(--cizgi);color:var(--yazi)}
.kp-btn.birincil{background:var(--altin);color:#2A1E00;font-size:17px;padding:12px 26px;box-shadow:0 6px 0 #B98E00}
.kp-btn.birincil:disabled{opacity:.45;box-shadow:none;cursor:not-allowed}
.kp-btn.ince{background:transparent;box-shadow:inset 0 0 0 2px var(--cizgi)}
.kp-ipucu{font-size:12.5px;color:var(--soluk);font-weight:700;max-width:46ch}
.kp-yan{display:grid;gap:12px}
.kp-kutu{background:var(--gece2);border-radius:20px;padding:14px;box-shadow:inset 0 0 0 2px var(--cizgi)}
.kp-kutu h3{margin:0 0 10px;font:800 12.5px var(--kpf-g);letter-spacing:.14em;text-transform:uppercase;color:var(--soluk)}
.kp-takim{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center;padding:8px;border-radius:14px}
.kp-takim.aktif{background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 2px var(--r)}
.kp-takim img{width:42px;height:42px;object-fit:contain}
.kp-takim b{font:800 18px/1 var(--kpf-b)}.kp-takim small{display:block;color:var(--soluk);font-weight:800;font-size:12px;margin-top:2px}
.kp-sayac{display:flex;gap:10px;font:800 18px var(--kpf-b);font-variant-numeric:tabular-nums}
.kp-efsane{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;font-size:12.5px;font-weight:800}
.kp-efsane span{display:flex;align-items:center;gap:7px}.kp-efsane i{width:16px;height:16px;border-radius:5px;flex:none}
.kp-gunluk{max-height:180px;overflow:auto;font-size:13px;font-weight:700;display:grid;gap:6px}.kp-gunluk div{color:var(--soluk)}.kp-gunluk div b{color:var(--yazi)}
.kp-katman{position:fixed;inset:0;z-index:9500;background:rgba(10,7,26,.78);display:flex;align-items:center;justify-content:center;padding:16px}
.kp-pencere{width:min(580px,100%);max-height:100%;overflow:auto;background:linear-gradient(170deg,#2E2366,#1C1540);border-radius:26px;padding:22px;box-shadow:0 0 0 3px var(--r,var(--mor)),0 30px 80px rgba(0,0,0,.6);text-align:center;display:grid;gap:12px;animation:kpGel .35s cubic-bezier(.2,1.4,.4,1);color:var(--yazi)}
@keyframes kpGel{from{transform:scale(.7);opacity:0}}
.kp-pencere .etk{font:900 12px var(--kpf-g);letter-spacing:.2em;color:var(--r,var(--mor));text-transform:uppercase}
.kp-pencere h2{margin:0;font:800 clamp(28px,5.5vw,44px)/1.05 var(--kpf-b)}.kp-pencere p{margin:0;color:#DCD3FF;font-weight:700}
.kp-sonuc{display:grid;gap:6px;text-align:left}
.kp-sonuc div{display:grid;grid-template-columns:36px 1fr auto;gap:10px;align-items:center;background:rgba(255,255,255,.06);border-radius:12px;padding:6px 10px;font-weight:800}
.kp-sonuc img{width:36px;height:36px;object-fit:contain}
.kp-bomba{font-size:64px;animation:kpTitre .12s infinite}@keyframes kpTitre{50%{transform:rotate(8deg) scale(1.05)}}
.kp-adimlar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;text-align:left}
@media (max-width:520px){.kp-adimlar{grid-template-columns:1fr}}
.kp-adim{background:rgba(255,255,255,.07);border-radius:16px;padding:12px;display:grid;grid-template-columns:46px 1fr;gap:10px;align-items:center}
.kp-adim em{font-style:normal;font-size:32px;text-align:center}.kp-adim b{display:block;font:800 18px/1.1 var(--kpf-b)}.kp-adim small{display:block;font-weight:700;color:#DCD3FF;font-size:13px;margin-top:2px}
.kp-uc{position:fixed;left:50%;top:36%;transform:translate(-50%,-50%);z-index:9600;font:800 clamp(26px,5.5vw,50px) var(--kpf-b);text-shadow:0 6px 0 rgba(0,0,0,.35);pointer-events:none;animation:kpUc 1.3s ease forwards;white-space:nowrap}
@keyframes kpUc{0%{transform:translate(-50%,-30%) scale(.6);opacity:0}20%{transform:translate(-50%,-50%) scale(1.08);opacity:1}80%{opacity:1}100%{transform:translate(-50%,-90%);opacity:0}}
.kp-konfeti{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9700}
.kp-kur{display:grid;gap:14px;max-width:720px}
.kp-kur h2{margin:0;font:800 34px/1 var(--kpf-b)}.kp-kur h2 i{font-style:normal;color:var(--altin)}
.kp-secim{display:flex;flex-wrap:wrap;gap:8px}
.kp-secim button{border:0;border-radius:999px;padding:9px 16px;font:900 14px var(--kpf-g);background:rgba(255,255,255,.08);color:var(--yazi)}
.kp-secim button.aktif{background:var(--altin);color:#2A1E00}
.kp-onizleme{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
.kp-onizleme div{background:rgba(255,255,255,.06);border-radius:16px;padding:10px 12px;box-shadow:inset 4px 0 0 var(--r)}
.kp-onizleme b{font:800 18px var(--kpf-b);display:flex;align-items:center;gap:8px}.kp-onizleme img{width:34px;height:34px;object-fit:contain}
.kp-onizleme small{display:block;color:var(--soluk);font-weight:700;font-size:12.5px;margin-top:4px}
@media (prefers-reduced-motion:reduce){.kp *{animation:none!important;transition:none!important}}
`;

// ---------------- giriş / kurulum ----------------
function kmPartiCiz() {
    kpKaynakYukle(); kpYukle();
    const ic = kp$('km-icerik'); if (!ic) return;
    if (!_kp) { ic.innerHTML = kpKurulumHTML(); return; }
    kpOyunCiz();
}
function kpTakimlariKur(n) {
    let roster = (_kmListe || []).map((k) => ({ g: k.g, ad: k.ad }));
    if (_kpKarisik) roster = _kpKarisik.filter((x) => roster.some((y) => y.g === x.g && y.ad === x.ad)).concat(roster.filter((y) => !_kpKarisik.some((x) => x.g === y.g && x.ad === y.ad)));
    const t = KP_TAKIM.slice(0, n).map((x) => ({ ...x, uyeler: [] }));
    roster.forEach((s, i) => t[i % n].uyeler.push(s));
    return t;
}
function kpKurulumHTML() {
    const k = _kpKurulum, takimlar = kpTakimlariKur(k.n);
    const sec = (alan, d, yazi) => `<button class="${k[alan] === d ? 'aktif' : ''}" onclick="kpKurSec('${alan}',${JSON.stringify(d)})">${yazi}</button>`;
    return `<div class="kp" id="kp-kok"><div class="kp-kur">
        <div><button class="kp-btn ince" onclick="kmSekme('oyunlar')">← Oyunlar</button></div>
        <h2>🎉 Ok <i>Partisi</i></h2>
        <p style="margin:0;font-weight:700;color:#DCD3FF;max-width:62ch">Takımlar tur tahtasında yarışır. Zar yok: serinin puanı kadar ilerlersin. 🔑 anahtar topla, 3 anahtarla 🏆 sandığına git. Her tur sonunda mini oyun! En çok kupayı toplayan takım kazanır.</p>
        <div><div class="kp-kutu" style="padding:12px 14px"><h3>Kaç takım?</h3><div class="kp-secim">${sec('n', 2, '2 takım')}${sec('n', 3, '3 takım')}${sec('n', 4, '4 takım')}</div></div></div>
        <div><div class="kp-kutu" style="padding:12px 14px"><h3>Kaç tur?</h3><div class="kp-secim">${sec('tur', 3, '3 tur · kısa')}${sec('tur', 5, '5 tur')}${sec('tur', 7, '7 tur · uzun')}</div></div></div>
        <div><div class="kp-kutu" style="padding:12px 14px"><h3>Skorlar</h3><div class="kp-secim">${sec('gercek', true, '✓ Gerçek skora yaz')}${sec('gercek', false, 'Sadece oyun')}</div></div></div>
        <div class="kp-onizleme">${takimlar.map((t) => `<div style="--r:${t.r}"><b><img src="${t.res}" alt="">${t.ad}</b><small>${t.uyeler.length ? t.uyeler.map((u) => esc(u.ad)).join(', ') : 'Sporcu yok'}</small></div>`).join('')}</div>
        <div class="kp-eylem" style="justify-content:flex-start"><button class="kp-btn ince" onclick="kpKaristir()">🔀 Takımları karıştır</button><button class="kp-btn birincil" onclick="kpBaslat()">▶ Partiyi başlat</button></div>
    </div></div>`;
}
function kpKurSec(alan, d) { _kpKurulum[alan] = d; kmPartiCiz(); }
function kpKaristir() { const r = (_kmListe || []).map((k) => ({ g: k.g, ad: k.ad })); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } _kpKarisik = r; kmPartiCiz(); }
function kpBaslat() {
    const takimlar = kpTakimlariKur(_kpKurulum.n).filter((t) => t.uyeler.length);
    if (takimlar.length < 2) { showToast('Ok Partisi için derste en az 2 sporcu olmalı.', 'warning'); return; }
    _kp = { surum: 1, tarih: (typeof bugunISO === 'function' ? bugunISO() : ''), tur: 1, turSayisi: _kpKurulum.tur, gercek: _kpKurulum.gercek, sira: 0, oklar: [], kilit: false, sandik: 12, bitti: false, gunluk: [],
        takimlar: takimlar.map((t) => ({ ad: t.ad, res: t.res, r: t.r, uyeler: t.uyeler, atan: 0, poz: 0, anahtar: 1, kupa: 0, kalkan: 0, cift: 0 })) };
    kpLogSessiz('Parti başladı! Her takıma 1 anahtar.'); kpKaydetDurum(); kpOyunCiz(); kpNasil();
}
function kpLogSessiz(m) { _kp.gunluk.unshift(m); }
function kpNasil() {
    const k = kpPencere(`<div class="etk">Ok Partisi</div><h2>Nasıl oynanır?</h2>
      <p style="font:800 22px var(--kpf-b);color:var(--altin)">En çok 🏆 kupayı toplayan takım kazanır!</p>
      <div class="kp-adimlar">
        <div class="kp-adim"><em>🏹</em><div><b>1. Ok at</b><small>Takımından biri 3 ok atar, skoru girilir.</small></div></div>
        <div class="kp-adim"><em>👣</em><div><b>2. İlerle</b><small>Puanın kadar ilerlersin. 30 puan = 6 kare!</small></div></div>
        <div class="kp-adim"><em>🔑</em><div><b>3. Anahtar topla</b><small>Sarı karelere bas. Kırmızı tuzaklardan kaç!</small></div></div>
        <div class="kp-adim"><em>🏆</em><div><b>4. Kupayı al</b><small>3 anahtarla parlayan sandığa git, kupa senin!</small></div></div>
        <div class="kp-adim"><em>🎉</em><div><b>Her tur sonunda</b><small>Bütün takımlar bir mini oyunda yarışır.</small></div></div>
        <div class="kp-adim"><em>✨</em><div><b>İpucu</b><small>27 ve üstü "altın seri" ekstra anahtar verir.</small></div></div>
      </div><div><button class="kp-btn birincil" data-kapat="1">Hadi başlayalım!</button></div>`, '#FFD23F');
    k.querySelector('[data-kapat]').onclick = () => k.remove();
}

// ---------------- oyun ekranı ----------------
function kpOyunCiz() {
    const ic = kp$('km-icerik'); if (!ic) return;
    ic.innerHTML = `<div class="kp" id="kp-kok">
      <div class="kp-ust"><div class="kp-logo"><span>🎉</span><div>Ok <i>Partisi</i><small>Karışık Sınıf · parti oyunu</small></div></div>
        <div class="kp-tur"><span id="kp-tur-yazi"></span><span class="p" id="kp-tur-p"></span></div></div>
      <div class="kp-amac"><b>🎯 Amaç: en çok 🏆 kupayı topla!</b><span>Ok at → puanın kadar ilerle → 🔑 topla → 3 🔑 ile 🏆 sandığına git.</span>
        <div class="kp-sag"><button class="kp-btn ince" onclick="kpNasil()">❓ Nasıl oynanır?</button><button class="kp-btn ince" onclick="kpTamEkran()">🖥️ Tam ekran</button><button class="kp-btn ince" onclick="kpBitirSor()">✕ Partiyi bitir</button><button class="kp-btn ince" onclick="kmSekme('oyunlar')">← Oyunlar</button></div></div>
      <div class="kp-ana">
        <div class="kp-tahta" id="kp-tahta">
          <div class="kp-orta"><div class="kp-sira" id="kp-sira"></div><div class="kp-atan" id="kp-atan"></div><div class="kp-slotlar" id="kp-slotlar"></div></div>
          <div class="kp-kontrol"><div class="kp-ped" id="kp-ped"></div>
            <div class="kp-eylem"><button class="kp-btn ince" onclick="kpSil()">Son oku sil</button><button class="kp-btn birincil" id="kp-ilerlet" onclick="kpGonder()" disabled>İlerlet</button></div>
            <div class="kp-ipucu">Her 5 puan = 1 kare. 27+ altın seri 1 anahtar daha verir.${_kp.gercek ? ' Seri, seçili sporcunun gerçek skoruna yazılır.' : ''}</div></div>
        </div>
        <aside class="kp-yan">
          <div class="kp-kutu"><h3>Takımlar</h3><div id="kp-takimlar"></div></div>
          <div class="kp-kutu"><h3>Kareler</h3><div class="kp-efsane"><span><i style="background:#F2A900"></i>Anahtar +1</span><span><i style="background:#E23557"></i>Tuzak −1 🔑</span><span><i style="background:#22B37C"></i>Mağaza</span><span><i style="background:#2BA8D9"></i>Takas</span><span><i style="background:#8F5CF0"></i>Sürpriz olay</span><span><i style="border:3px dashed #FFD23F"></i>Kupa sandığı (3 🔑)</span></div></div>
          <div class="kp-kutu"><h3>Olanlar</h3><div class="kp-gunluk" id="kp-gunluk"></div></div>
        </aside>
      </div></div>`;
    kpTahtaCiz(); kpPanel(); kpPedCiz();
    kp$('kp-gunluk').innerHTML = _kp.gunluk.map((x) => `<div>${x}</div>`).join('');
    kp$('kp-ped').addEventListener('click', (e) => { const v = e.target.dataset && e.target.dataset.v; if (!v || _kp.oklar.length >= 3 || _kp.kilit) return; _kp.oklar.push(v); kpBip(400 + kpDeger(v) * 40, 0.05); kpPedCiz(); });
    requestAnimationFrame(() => _kp && _kp.takimlar.forEach((_, i) => kpTasYer(i)));
}
window.addEventListener('resize', () => { if (_kp && kp$('kp-tahta')) _kp.takimlar.forEach((_, i) => kpTasYer(i)); });
function kpTahtaCiz() {
    const t = kp$('kp-tahta'); if (!t) return;
    t.querySelectorAll('.kp-kare,.kp-tas').forEach((e) => e.remove());
    KP_KONUM.forEach(([r, c], i) => {
        const k = document.createElement('div'), tip = KP_TIPLER[i];
        k.className = 'kp-kare ' + tip; k.id = 'kp-k' + i; k.style.gridRow = r + 1; k.style.gridColumn = c + 1;
        k.innerHTML = `${KP_TIP_YAZI[tip][0]}<b>${KP_TIP_YAZI[tip][1]}</b>${i === _kp.sandik ? '<div class="kp-sandik"></div>' : ''}`;
        t.appendChild(k);
    });
    _kp.takimlar.forEach((tk, ti) => { const e = document.createElement('div'); e.className = 'kp-tas'; e.id = 'kp-tas' + ti; e.style.setProperty('--r', tk.r); e.innerHTML = `<div class="hal"></div><img src="${tk.res}" alt="${esc(tk.ad)}">`; t.appendChild(e); kpTasYer(ti); });
}
function kpTasYer(ti) {
    const tk = _kp.takimlar[ti], k = kp$('kp-k' + tk.poz), t = kp$('kp-tahta'), e = kp$('kp-tas' + ti); if (!k || !e || !t) return;
    const kr = k.getBoundingClientRect(), tr = t.getBoundingClientRect();
    const ayni = _kp.takimlar.filter((x) => x.poz === tk.poz), s = ayni.indexOf(tk), kay = [[-.18, -.16], [.18, -.16], [-.18, .18], [.18, .18]][s] || [0, 0];
    const w = kr.width * 0.62;
    e.style.width = w + 'px'; e.style.height = w + 'px';
    e.style.left = (kr.left - tr.left + kr.width / 2 - w / 2 + kay[0] * kr.width) + 'px';
    e.style.top = (kr.top - tr.top + kr.height / 2 - w / 2 + kay[1] * kr.height) + 'px';
}
function kpPanel() {
    if (!kp$('kp-tur-yazi')) return;
    kp$('kp-tur-yazi').textContent = `Tur ${Math.min(_kp.tur, _kp.turSayisi)} / ${_kp.turSayisi}`;
    kp$('kp-tur-p').innerHTML = Array.from({ length: _kp.turSayisi }, (_, i) => `<span class="${i + 1 < _kp.tur ? 'dolu' : i + 1 === _kp.tur ? 'simdi' : ''}"></span>`).join('');
    kp$('kp-takimlar').innerHTML = _kp.takimlar.map((tk, i) => `<div class="kp-takim ${i === _kp.sira && !_kpPedHedef ? 'aktif' : ''}" style="--r:${tk.r}"><img src="${tk.res}" alt=""><div><b>${esc(tk.ad)}</b><small>${tk.kalkan ? '🛡️ kalkan ' : ''}${tk.cift ? '⚡ çift hamle ' : ''}${tk.uyeler.length} sporcu</small></div><div class="kp-sayac"><span>🔑${tk.anahtar}</span><span>🏆${tk.kupa}</span></div></div>`).join('');
}
function kpAktifTakimIdx() { return _kpPedHedef ? _kpPedHedef.ti : _kp.sira; }
function kpPedCiz() {
    if (!kp$('kp-sira')) return;
    const ti = kpAktifTakimIdx(), tk = _kp.takimlar[ti];
    kp$('kp-sira').innerHTML = `<img src="${tk.res}" alt=""><div style="text-align:left"><h2 style="color:${tk.r}">${esc(tk.ad)}</h2><p>${_kpPedHedef ? esc(_kpPedHedef.baslik) : 'sırada · seri gir ve ilerle'}</p></div>`;
    kp$('kp-atan').style.setProperty('--r', tk.r);
    kp$('kp-atan').innerHTML = tk.uyeler.map((u, i) => `<button class="${i === tk.atan ? 'aktif' : ''}" onclick="kpAtanSec(${ti},${i})" title="Bu seriyi kim attı?">${i === tk.atan ? '🏹 ' : ''}${esc(u.ad)}</button>`).join('');
    kp$('kp-slotlar').innerHTML = [0, 1, 2].map((i) => { const v = _kp.oklar[i]; return `<div class="kp-slot ${v !== undefined ? 'dolu r-' + KP_RENK[v] : ''}">${v ?? ''}</div>`; }).join('');
    kp$('kp-ped').innerHTML = KP_PED.map((v) => `<button class="r-${KP_RENK[v]}" data-v="${v}" ${_kp.oklar.length >= 3 || _kp.kilit ? 'disabled' : ''}>${v}</button>`).join('');
    const b = kp$('kp-ilerlet'); b.disabled = _kp.oklar.length < 3 || _kp.kilit; b.textContent = _kpPedHedef ? 'Gönder' : 'İlerlet';
}
function kpAtanSec(ti, i) { _kp.takimlar[ti].atan = i; kpKaydetDurum(); kpPedCiz(); }
function kpSil() { if (_kp.kilit) return; _kp.oklar.pop(); kpPedCiz(); }
function kpGonder() {
    if (_kp.oklar.length < 3 || _kp.kilit) return;
    const ti = kpAktifTakimIdx(), oklar = _kp.oklar.slice();
    kpGercekKayit(_kp.takimlar[ti], oklar, () => {
        _kp.oklar = [];
        if (_kpPedHedef) { const h = _kpPedHedef; _kpPedHedef = null; h.bitti(oklar); } else kpHamle(oklar);
    });
}
// Gerçek kayıt — kmOyunIlerlet ile aynı yol. Limit dolarsa onay ister (iptal edilirse oklar slotlarda kalır).
function kpGercekKayit(tk, oklar, devam) {
    const u = tk.uyeler[tk.atan];
    const ilerlet = () => { tk.atan = (tk.atan + 1) % Math.max(1, tk.uyeler.length); kpKaydetDurum(); devam(); };
    if (!_kp.gercek || !u || typeof _skorKaydetCekirdek !== 'function') { ilerlet(); return; }
    const kayit = oklar.map((v) => ({ puan: v }));
    let sonuc = _skorKaydetCekirdek(u.g, u.ad, kayit);
    const tamam = () => {
        if (!sonuc.ok) { showToast(u.ad + ' bulunamadı — seri yalnız oyunda sayıldı.', 'warning'); ilerlet(); return; }
        try { klasmanDoldur(); } catch (e) {}
        try { otomatikYoklamaIsaretle(u.ad, u.g); } catch (e) {}
        ilerlet();
    };
    if (!sonuc.ok && sonuc.sebep === 'limit-doldu') {
        onayIste(esc(u.ad) + ' için günlük seri limiti (' + sonuc.limit + ') doldu.<br><br>Bu sporcu için seriyi uzatıp bu skoru kaydetmek ister misin?', () => {
            sonuc.grupData.devamModu = true; sonuc.grupData.lastModified = Date.now();
            try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
            try { if (typeof bulutaGonderKontrol === 'function') bulutaGonderKontrol(); } catch (e) {}
            sonuc = _skorKaydetCekirdek(u.g, u.ad, kayit); tamam();
        }, 'Devam Et');
        return;
    }
    tamam();
}
async function kpHamle(oklar) {
    const tk = _kp.takimlar[_kp.sira]; _kp.kilit = true; kpPedCiz();
    const atan = tk.uyeler[(tk.atan - 1 + tk.uyeler.length) % Math.max(1, tk.uyeler.length)];
    const toplam = oklar.reduce((a, v) => a + kpDeger(v), 0);
    let adim = Math.ceil(toplam / 5); if (tk.cift) { adim *= 2; tk.cift = 0; kpUcan('⚡ ÇİFT HAMLE!', '#4CC9F0'); await kpBekle(700); }
    kpLog(`<b>${esc(tk.ad)}</b>${atan ? ' (' + esc(atan.ad) + ')' : ''} ${oklar.join('-')} = ${toplam} → ${adim} kare`);
    if (toplam >= 27) { tk.anahtar++; kpUcan('✨ ALTIN SERİ +🔑', '#FFD23F'); kpBip(1200, 0.15); kpLog(`<b>${esc(tk.ad)}</b> altın seri: +1 anahtar`); await kpBekle(900); }
    if (adim === 0) { kpUcan('Iska! Yerinde sayıyor', '#A99BD6'); await kpBekle(900); }
    for (let s = 0; s < adim; s++) {
        tk.poz = (tk.poz + 1) % 24; const e = kp$('kp-tas' + _kp.sira);
        if (e) { e.classList.remove('zipla'); void e.offsetWidth; e.classList.add('zipla'); }
        _kp.takimlar.forEach((_, i) => kpTasYer(i)); kpBip(520 + s * 30, 0.04);
        await kpBekle(260);
        if (tk.poz === _kp.sandik && s < adim - 1) await kpSandik(tk);
    }
    const kare = kp$('kp-k' + tk.poz); if (kare) kare.classList.add('vurgu'); await kpBekle(250);
    await kpKareEtkisi(tk);
    if (tk.poz === _kp.sandik) await kpSandik(tk);
    const kare2 = kp$('kp-k' + tk.poz); if (kare2) kare2.classList.remove('vurgu');
    _kp.kilit = false; kpKaydetDurum(); kpPanel();
    kpSonrakiSira();
}
async function kpSandik(tk) {
    if (tk.anahtar >= KP_KUPA_FIYAT) {
        tk.anahtar -= KP_KUPA_FIYAT; tk.kupa++; kpUcan('🏆 KUPA!', '#FFD23F'); kpKonfeti(); kpBip(990, 0.12); setTimeout(() => kpBip(1320, 0.2), 140);
        kpLog(`<b>${esc(tk.ad)}</b> 3 anahtarla KUPA aldı! (${tk.kupa})`);
        let yeni; do { yeni = 2 + Math.floor(Math.random() * 21); } while (Math.abs(yeni - _kp.sandik) < 5);
        _kp.sandik = yeni; await kpBekle(1200); kpTahtaCiz(); kpPanel();
    } else if (tk.poz === _kp.sandik) { kpUcan(`Sandık için ${KP_KUPA_FIYAT} 🔑 lazım`, '#A99BD6'); await kpBekle(900); }
}
async function kpKareEtkisi(tk) {
    const tip = KP_TIPLER[tk.poz];
    if (tip === 'anahtar') { tk.anahtar++; kpUcan('+1 🔑', '#FFD23F'); kpBip(880, 0.08); kpLog(`<b>${esc(tk.ad)}</b> anahtar buldu`); await kpBekle(900); }
    else if (tip === 'tuzak') {
        if (tk.kalkan) { tk.kalkan = 0; kpUcan('🛡️ Kalkan korudu!', '#4CC9F0'); kpLog(`<b>${esc(tk.ad)}</b> tuzağı kalkanla savuşturdu`); }
        else { const k = Math.min(1, tk.anahtar); tk.anahtar -= k; kpUcan(k ? '🌵 Tuzak! −1 🔑' : '🌵 Tuzak!', '#FF4D6D'); kpBip(180, 0.25, 'sawtooth'); kpLog(`<b>${esc(tk.ad)}</b> tuzağa düştü`); }
        await kpBekle(1000);
    } else if (tip === 'takas') {
        const lider = _kp.takimlar.filter((x) => x !== tk).sort((a, b) => b.kupa - a.kupa || b.anahtar - a.anahtar)[0];
        kpUcan(`🔁 ${lider.ad} ile yer değiştir!`, '#4CC9F0'); await kpBekle(800);
        [tk.poz, lider.poz] = [lider.poz, tk.poz]; _kp.takimlar.forEach((_, i) => kpTasYer(i)); kpBip(700, 0.1); kpLog(`<b>${esc(tk.ad)}</b> ↔ <b>${esc(lider.ad)}</b> yer değiştirdi`); await kpBekle(700);
    } else if (tip === 'olay') await kpOlay(tk);
    else if (tip === 'magaza') await kpMagaza(tk);
}
function kpPencere(html, renk) { const kok = kp$('kp-kok') || document.body, k = document.createElement('div'); k.className = 'kp-katman'; k.innerHTML = `<div class="kp-pencere" style="--r:${renk || '#B388FF'}">${html}</div>`; kok.appendChild(k); return k; }
function kpOlay(tk) {
    const s = [
        { b: 'Rüzgâr Fırtınası', p: 'Diğer takımlar 1 anahtar düşürüyor!', f: () => _kp.takimlar.forEach((x) => { if (x !== tk && x.anahtar) x.anahtar--; }) },
        { b: 'Hazine Sandıkçığı', p: '+2 anahtar!', f: () => { tk.anahtar += 2; } },
        { b: 'Antrenör Bonusu', p: 'Bir sonraki hamlen çift sayılır ⚡', f: () => { tk.cift = 1; } },
        { b: 'Sandık Kaçtı!', p: 'Kupa sandığı başka bir kareye ışınlandı.', f: () => { _kp.sandik = 2 + Math.floor(Math.random() * 21); } },
    ], o = s[Math.floor(Math.random() * s.length)];
    return new Promise((ok) => { const k = kpPencere(`<div class="etk">Sürpriz olay · ${esc(tk.ad)}</div><h2>${o.b}</h2><p>${o.p}</p><div><button class="kp-btn birincil" data-tamam="1">Tamam</button></div>`, '#B388FF'); kpBip(760, 0.12);
        k.querySelector('[data-tamam]').onclick = () => { o.f(); kpLog(`<b>${esc(tk.ad)}</b>: ${o.b}`); k.remove(); kpTahtaCiz(); kpPanel(); kpKaydetDurum(); ok(); }; });
}
function kpMagaza(tk) {
    return new Promise((ok) => {
        const k = kpPencere(`<div class="etk">Mağaza · ${esc(tk.ad)} · 🔑${tk.anahtar}</div><h2>Ne alalım?</h2>
          <div class="kp-eylem"><button class="kp-btn" data-al="kalkan" ${tk.anahtar < 1 ? 'disabled' : ''}>🛡️ Kalkan · 1🔑</button><button class="kp-btn" data-al="cift" ${tk.anahtar < 2 ? 'disabled' : ''}>⚡ Çift hamle · 2🔑</button></div>
          <p style="font-size:13px">Kalkan bir tuzağı engeller. Çift hamle sıradaki serinin ilerlemesini ikiye katlar.</p><div><button class="kp-btn ince" data-al="">Hiçbir şey alma</button></div>`, '#3DDC97');
        k.addEventListener('click', (e) => { const al = e.target.dataset && e.target.dataset.al; if (al === undefined) return;
            if (al === 'kalkan' && tk.anahtar >= 1) { tk.anahtar -= 1; tk.kalkan = 1; kpLog(`<b>${esc(tk.ad)}</b> kalkan aldı`); }
            if (al === 'cift' && tk.anahtar >= 2) { tk.anahtar -= 2; tk.cift = 1; kpLog(`<b>${esc(tk.ad)}</b> çift hamle aldı`); }
            k.remove(); kpPanel(); kpKaydetDurum(); ok(); });
    });
}
function kpSonrakiSira() {
    _kp.sira++;
    if (_kp.sira >= _kp.takimlar.length) { _kp.sira = 0; kpKaydetDurum(); kpMiniOyun(); return; }
    kpKaydetDurum(); kpPanel(); kpPedCiz();
}
// ---------------- mini oyunlar ----------------
async function kpMiniOyun() {
    const m = KP_MINI[(_kp.tur - 1) % KP_MINI.length];
    let hedefRenk = null; if (m.id === 'renk') hedefRenk = ['altin', 'kirmizi', 'mavi', 'siyah'][Math.floor(Math.random() * 4)];
    await new Promise((ok) => { const k = kpPencere(`<div class="etk">Tur ${_kp.tur} bitti · mini oyun</div><h2>${m.ad}</h2><p style="font:800 26px var(--kpf-b);color:#fff">${m.cocuk}</p>${m.id === 'patates' ? '<div class="kp-bomba">💣</div>' : ''}${hedefRenk ? `<p style="font:800 24px var(--kpf-b);color:#fff">Hedef renk: <span class="r-${hedefRenk}" style="padding:2px 14px;border-radius:10px">${KP_RENK_AD[hedefRenk]}</span></p>` : ''}<p>${m.acik}</p><div><button class="kp-btn birincil" data-basla="1">Başlat</button></div>`, '#FF8A3D');
        kpBip(523, 0.1); setTimeout(() => kpBip(659, 0.1), 120); setTimeout(() => kpBip(784, 0.16), 240); k.querySelector('[data-basla]').onclick = () => { k.remove(); ok(); }; });
    const girisler = []; let katilan = _kp.takimlar.map((_, i) => i);
    for (;;) {
        for (const ti of katilan) girisler[ti] = await new Promise((ok) => { _kpPedHedef = { ti, baslik: `${m.ad} · ${m.cocuk}`, bitti: ok }; _kp.oklar = []; kpPanel(); kpPedCiz(); });
        if (m.id !== 'duello') break;
        const sir = katilan.slice().sort((a, b) => kpKarsilastir(kpEnIyi(girisler[a]), kpEnIyi(girisler[b])));
        const esit = sir.filter((ti) => kpKarsilastir(kpEnIyi(girisler[ti]), kpEnIyi(girisler[sir[0]])) === 0);
        if (esit.length === 1) break;
        kpUcan('Eşitlik! Bir seri daha 🔥', '#FF8A3D'); await kpBekle(1100); katilan = esit;
    }
    const puan = (ti) => { const o = girisler[ti]; if (m.id === 'altin') return o.filter((v) => KP_RENK[v] === 'altin').length; if (m.id === 'renk') return o.filter((v) => KP_RENK[v] === hedefRenk).length; return kpDeger(kpEnYuksekOk(o)); };
    const enIyiSira = (a, b) => kpKarsilastir(kpEnIyi(girisler[a]), kpEnIyi(girisler[b]));
    const sirali = _kp.takimlar.map((_, ti) => ti).sort((a, b) => (m.id === 'patates' || m.id === 'duello') ? enIyiSira(a, b) : puan(b) - puan(a));
    let sonucYazi = '';
    if (m.id === 'altin' || m.id === 'renk') { const k1 = sirali[0]; _kp.takimlar[k1].anahtar += 3; if (m.id === 'altin' && sirali[1] !== undefined && puan(sirali[1]) > 0) _kp.takimlar[sirali[1]].anahtar += 1; sonucYazi = `${_kp.takimlar[k1].ad} kazandı!`; }
    if (m.id === 'patates') { const kb = sirali[sirali.length - 1]; const k = Math.min(2, _kp.takimlar[kb].anahtar); _kp.takimlar[kb].anahtar -= k; sonucYazi = `💥 Bomba ${_kp.takimlar[kb].ad} elinde patladı!`; kpBip(120, 0.5, 'sawtooth'); }
    if (m.id === 'duello') { const k1 = katilan.slice().sort(enIyiSira)[0]; _kp.takimlar[k1].kupa++; sonucYazi = `🏆 ${_kp.takimlar[k1].ad} kupayı kaptı!`; kpKonfeti(); }
    kpLog(`Mini oyun <b>${m.ad}</b>: ${esc(sonucYazi)}`); kpKaydetDurum();
    const satir = sirali.map((ti) => { const tk = _kp.takimlar[ti]; return `<div><img src="${tk.res}" alt=""><span>${esc(tk.ad)} <small style="color:var(--soluk)">${girisler[ti].join(' · ')}</small></span><b>${m.id === 'altin' ? puan(ti) + ' sarı' : m.id === 'renk' ? puan(ti) + ' isabet' : 'en yüksek: ' + kpEnYuksekOk(girisler[ti])}</b></div>`; }).join('');
    await new Promise((ok) => { const k = kpPencere(`<div class="etk">${m.ad} · sonuç</div><h2>${esc(sonucYazi)}</h2><div class="kp-sonuc">${satir}</div><div><button class="kp-btn birincil" data-tamam="1">${_kp.tur >= _kp.turSayisi ? 'Final' : 'Sonraki tur'}</button></div>`, '#FFD23F'); k.querySelector('[data-tamam]').onclick = () => { k.remove(); ok(); }; });
    _kp.tur++; kpKaydetDurum();
    if (_kp.tur > _kp.turSayisi) return kpFinal();
    kpTahtaCiz(); kpPanel(); kpPedCiz();
}
function kpFinal() {
    const s = [..._kp.takimlar].sort((a, b) => b.kupa - a.kupa || b.anahtar - a.anahtar);
    _kp.bitti = true; kpKaydetDurum();
    kpKonfeti(); kpBip(784, 0.15); setTimeout(() => kpBip(988, 0.15), 160); setTimeout(() => kpBip(1175, 0.3), 320);
    const k = kpPencere(`<div class="etk">Parti bitti</div><h2>🏆 ${esc(s[0].ad)} kazandı!</h2><div class="kp-sonuc">${s.map((tk, i) => `<div><img src="${tk.res}" alt=""><span>${i + 1}. ${esc(tk.ad)} <small style="color:var(--soluk)">${tk.uyeler.map((u) => esc(u.ad)).join(', ')}</small></span><b>🏆${tk.kupa} · 🔑${tk.anahtar}</b></div>`).join('')}</div><div class="kp-eylem"><button class="kp-btn birincil" data-yeni="1">Yeni parti</button><button class="kp-btn ince" data-cik="1">← Oyunlar</button></div>`, '#FFD23F');
    k.querySelector('[data-yeni]').onclick = () => { k.remove(); _kp = null; kpKaydetDurum(); kmPartiCiz(); };
    k.querySelector('[data-cik]').onclick = () => { k.remove(); _kp = null; kpKaydetDurum(); kmSekme('oyunlar'); };
}
function kpBitirSor() {
    const k = kpPencere(`<div class="etk">Ok Partisi</div><h2>Partiyi bitirelim mi?</h2><p>Oyun ilerlemesi silinir. Girilen gerçek skorlar kayıtlı kalır.</p><div class="kp-eylem"><button class="kp-btn birincil" data-evet="1">Evet, bitir</button><button class="kp-btn ince" data-hayir="1">Devam et</button></div>`, '#FF4D6D');
    k.querySelector('[data-evet]').onclick = () => { k.remove(); _kp = null; _kpPedHedef = null; kpKaydetDurum(); kmPartiCiz(); };
    k.querySelector('[data-hayir]').onclick = () => k.remove();
}
function kpTamEkran() {
    const el = kp$('kp-kok'); if (!el) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    const f = el.requestFullscreen || el.webkitRequestFullscreen; if (!f) { showToast('Bu cihaz tam ekranı desteklemiyor.', 'warning'); return; }
    const r = f.call(el); if (r && r.catch) r.catch(() => showToast('Tam ekran açılamadı.', 'warning'));
    setTimeout(() => _kp && _kp.takimlar.forEach((_, i) => kpTasYer(i)), 400);
}
function kpKonfeti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const kok = kp$('kp-kok') || document.body, c = document.createElement('canvas'); c.className = 'kp-konfeti'; kok.appendChild(c);
    const x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    const P = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 3, c: ['#FFD23F', '#FF4D6D', '#3DDC97', '#4CC9F0', '#B388FF', '#FF8A3D'][Math.floor(Math.random() * 6)], a: Math.random() * 6 }));
    let t = 0; (function f() { x.clearRect(0, 0, c.width, c.height); P.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.42; p.a += 0.2; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore(); }); if (++t < 110) requestAnimationFrame(f); else c.remove(); })();
}
