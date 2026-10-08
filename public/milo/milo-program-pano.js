/* Milo · Haftalık Program "Pano" (2026-10-08, kullanıcı 3 modelden "3 · Pano"yu seçti; DAĞ'da da aynısı var:
   public/dagsk-program-pano.js). Saat ekseni yok: her gün bir sütun (Pzt→Paz, bu haftanın tarihleri), dersler kart —
   büyük saat, bitiş, ders adı, yaş noktası + aralığı, öğrenci yuvarlakları, n/kapasite + doluluk çubuğu; o haftaki
   iptal çizili, şu anki ders vurgulu, geçenler soluk. Telefonda günler yana kaydırılır (bugüne kayar). Karta dokununca
   sade ders penceresi (milo-ders-pencere.js), "+ ders" yeni ders formunda o günü seçer (mpgYeniDers).
   milo-duzen.js'teki takvim/ajanda (mpg*) görünümünün yerini alır; bu dosya ondan SONRA yüklenir. mpn* önekli. */
const MPN_GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'], MPN_SIRA = [1, 2, 3, 4, 5, 6, 0];
function mpnDk(t) { let [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); }
function mpnISO(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function mpnHafta() { let b = new Date(), p = new Date(b.getFullYear(), b.getMonth(), b.getDate() - (b.getDay() + 6) % 7), o = {}; MPN_SIRA.forEach((g, i) => { o[g] = new Date(p.getFullYear(), p.getMonth(), p.getDate() + i); }); return o; }
function mpnHue(ad) { let h = 0; for (let c of String(ad)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
function mpnIni(ad) { return String(ad).split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join(''); }

miloProgramIzgaraCiz = function () {
    let ic = document.getElementById('milo-program-izgara'); if (!ic) return;
    let prog = miloProgram || [], hafta = mpnHafta(), bugun = new Date().getDay(), sm = new Date(), sDk = sm.getHours() * 60 + sm.getMinutes();
    let gunler = s => (s.gunler && s.gunler.length ? s.gunler : [s.gun]).map(Number);
    let gunSlot = g => prog.filter(s => gunler(s).includes(g)).sort((a, b) => a.baslangicSaat.localeCompare(b.baslangicSaat));
    let topDers = prog.reduce((a, s) => a + gunler(s).length, 0), kisi = new Set(), kap = 0, dolu = 0;
    prog.forEach(s => { (s.katilimcilar || []).forEach(k => kisi.add(k.grup + '|' + k.ad)); if (s.kapasite) { kap += s.kapasite; dolu += Math.min((s.katilimcilar || []).length, s.kapasite); } });
    let presetler = typeof mdsPresetler === 'function' ? mdsPresetler() : [];
    let kol = g => {
        let t = hafta[g], iso = mpnISO(t);
        let kartlar = gunSlot(g).map(s => {
            let n = (s.katilimcilar || []).length, dl = s.kapasite && n >= s.kapasite, ipt = (s.istisnalar || []).some(i => i.tarih === iso);
            let gecti = g === bugun && mpnDk(s.bitisSaat) < sDk, su = g === bugun && mpnDk(s.baslangicSaat) <= sDk && sDk < mpnDk(s.bitisSaat);
            let y = typeof mdsSlotYas === 'function' ? mdsSlotYas(s.id) : null, renk = typeof mpgRenk === 'function' ? mpgRenk(s) : 'var(--milo-ink-dim)';
            let av = (s.katilimcilar || []).slice(0, 3).map(k => `<i style="--h:${mpnHue(k.ad)}">${miloEsc(mpnIni(k.ad))}</i>`).join('') + (n > 3 ? `<i class="fazla">+${n - 3}</i>` : '');
            return `<button type="button" class="pno-kart${ipt ? ' iptal' : ''}${gecti ? ' gecti' : ''}${su ? ' simdi' : ''}" onclick="miloDersRosterAc(${s.id})">
                <span class="pno-s">${s.baslangicSaat}${su ? '<em>şu an</em>' : ''}${ipt ? '<em class="k">iptal</em>' : ''}</span><span class="pno-b">– ${s.bitisSaat}</span>
                <span class="pno-ad">${miloEsc(s.grup)}${s.dersPlani ? ' · 📋' : ''}</span>
                ${y ? `<span class="pno-yas"><i style="background:${renk}"></i>${miloEsc(mdsAralikEtiket(y.minAy, y.maxAy))}</span>` : ''}
                <span class="pno-alt"><span class="pno-av">${av || '<small>öğrenci yok</small>'}</span><b class="${dl ? 'dolu' : ''}">${n}${s.kapasite ? '/' + s.kapasite : ''}</b></span>
                ${s.kapasite ? `<span class="pno-bar${dl ? ' dolu' : ''}"><u style="width:${Math.min(100, n / s.kapasite * 100)}%"></u></span>` : ''}</button>`;
        }).join('');
        return `<div class="pno-kol${g === bugun ? ' bugun' : ''}" data-gun="${g}"><div class="pno-kb"><b>${MPN_GUN[g]}</b><small>${t.getDate()}</small></div><div class="pno-yigin">${kartlar}<button type="button" class="pno-ekle" onclick="mpgYeniDers(${g}, null)">+ ders</button></div></div>`;
    };
    let lejant = presetler.length ? `<div class="pno-lejant">${presetler.map((p, i) => `<span><i style="background:${typeof MPG_RENK !== 'undefined' ? MPG_RENK[i % MPG_RENK.length] : 'var(--milo-teal)'}"></i>${miloEsc(mdsAralikEtiket(p.min, p.max))}</span>`).join('')}</div>` : '';
    ic.innerHTML = `<div class="pno mpn-renk"><div class="pno-ozet"><span><b>${topDers}</b> ders</span><span><b>${kisi.size}</b> çocuk</span>${kap ? `<span><b>%${Math.round(dolu / kap * 100)}</b> dolu</span>` : ''}<span class="pno-tarih">${hafta[1].getDate()} – ${hafta[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span></div>
        <div class="pno-izgara">${MPN_SIRA.map(kol).join('')}</div>${lejant}</div>`;
    let iz = ic.querySelector('.pno-izgara'), b = ic.querySelector('.pno-kol.bugun');
    if (iz && b && iz.scrollWidth > iz.clientWidth + 4) iz.scrollLeft += b.getBoundingClientRect().left - iz.getBoundingClientRect().left - 4;
};

(function () {
    let st = document.createElement('style'); st.id = 'mpn-css';
    st.textContent = `
.mpn-renk{--p-kart2:var(--milo-card-raised);--p-ink:var(--milo-ink);--p-dim:var(--milo-ink-dim);--p-cizgi:var(--milo-line);--p-acc:var(--milo-teal);--p-bad:var(--milo-kirmizi,#FF6369)}
.pno{display:flex;flex-direction:column;gap:12px}
.pno-ozet{display:flex;gap:16px;flex-wrap:wrap;color:var(--p-dim);font-size:13px}.pno-ozet b{color:var(--p-ink);font-weight:800}.pno-tarih{margin-left:auto}
.pno-izgara{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
@media (max-width:1100px){.pno-izgara{grid-template-columns:repeat(7,minmax(150px,1fr));overflow-x:auto;padding-bottom:6px;scroll-snap-type:x proximity}}
@media (max-width:720px){.pno-izgara{grid-template-columns:repeat(7,78%);scroll-snap-type:x mandatory;scrollbar-width:none}.pno-kol{scroll-snap-align:start}}
.pno-kb{display:flex;align-items:baseline;justify-content:space-between;padding:0 4px 8px;font-size:13px}.pno-kb b{font-weight:800;color:var(--p-ink)}.pno-kb small{color:var(--p-dim);font-weight:700}
.pno-kol.bugun .pno-kb b,.pno-kol.bugun .pno-kb small{color:var(--p-acc)}
.pno-yigin{display:flex;flex-direction:column;gap:7px;min-height:110px;padding:6px;border-radius:16px;background:color-mix(in srgb,var(--p-ink) 3%,transparent)}
.pno-kol.bugun .pno-yigin{background:color-mix(in srgb,var(--p-acc) 9%,transparent)}
.pno-kart{display:flex;flex-direction:column;align-items:stretch;gap:2px;text-align:left;width:100%;padding:10px 11px;border-radius:13px;border:1px solid transparent;background:var(--p-kart2);color:var(--p-ink);font:inherit;cursor:pointer;transition:border-color .12s,transform .12s}
.pno-kart:hover{border-color:var(--p-cizgi);transform:translateY(-1px)}
.pno-kart.simdi{border-color:var(--p-acc)}.pno-kart.gecti{opacity:.5}.pno-kart.iptal{opacity:.55}.pno-kart.iptal .pno-ad{text-decoration:line-through}
.pno-s{font-size:17px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.pno-s em{font-style:normal;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;background:var(--p-acc);color:#fff;letter-spacing:0}.pno-s em.k{background:color-mix(in srgb,var(--p-bad) 20%,transparent);color:var(--p-bad)}
.pno-b{font-size:11.5px;color:var(--p-dim);font-variant-numeric:tabular-nums}
.pno-ad{font-size:13px;font-weight:700;line-height:1.25;margin-top:3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.pno-yas{display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--p-dim);margin-top:2px;white-space:nowrap}.pno-yas i{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.pno-alt{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:7px}.pno-alt b{font-size:12.5px;font-weight:800;font-variant-numeric:tabular-nums;flex-shrink:0}.pno-alt b.dolu{color:var(--p-bad)}.pno-alt small{font-size:11px;color:var(--p-dim)}
.pno-av{display:flex;min-width:0;overflow:hidden}.pno-av i{width:22px;height:22px;border-radius:50%;margin-left:-6px;border:2px solid var(--p-kart2);font-style:normal;font-size:8.5px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;background:hsl(var(--h) 45% 30%);color:hsl(var(--h) 85% 88%);flex-shrink:0}.pno-av i:first-child{margin-left:0}.pno-av i.fazla{background:var(--p-cizgi);color:var(--p-ink);width:auto;min-width:22px;padding:0 4px;border-radius:999px}
.pno-bar{display:block;height:4px;border-radius:2px;background:var(--p-cizgi);overflow:hidden;margin-top:7px}.pno-bar u{display:block;height:100%;background:var(--p-acc)}.pno-bar.dolu u{background:var(--p-bad)}
.pno-ekle{border:1.5px dashed var(--p-cizgi);border-radius:12px;padding:9px;background:none;color:var(--p-dim);font:inherit;font-weight:700;font-size:12.5px;cursor:pointer}.pno-ekle:hover{color:var(--p-acc);border-color:var(--p-acc)}
.pno-lejant{display:flex;gap:4px 14px;flex-wrap:wrap;font-size:11.5px;color:var(--p-dim)}.pno-lejant span{display:inline-flex;align-items:center;gap:6px}.pno-lejant i{width:8px;height:8px;border-radius:50%}
.pno button:focus-visible{outline:2px solid var(--p-acc);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.pno-kart{transition:none}}`;
    document.head.appendChild(st);
})();
