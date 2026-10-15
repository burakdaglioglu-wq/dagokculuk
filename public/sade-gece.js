// Sade (A) — GECE sürümü (2026-10-15, kullanıcı: "bu çok beyaz, gece ekranda çok parlıyor").
// Defter / Ders Günlüğü / Yoklama ekranlarının Sade CSS'i açık renklerle yazılı. Bu yardımcı o CSS'in
// koyu karşılığını üretir: her kuralın seçicisinin önüne "koyu tema açıkken" kapsamını koyar ve açık
// renkleri gece paletine çevirir. Açık temada hiçbir şey değişmez; koyu temada (varsayılan) kâğıt koyu
// gri-yeşil, yazı açık, vurgu biraz daha parlak petrol olur. PDF'ler kâğıt olduğu için beyaz kalır.
// Kullanım: Sade <style> eklendikten sonra sadeGeceEkle(st).
const SADE_GECE_RENK = {
    '#f4f7f6': '#0f1312', '#f6f8f7': '#0f1312', '#ffffff': '#171d1b', '#fff': '#171d1b',
    '#1b2422': '#e3eae7', '#6b7976': '#93a19d', '#e4e9e7': '#27312e', '#eef2f0': '#222b28',
    '#d7dfdc': '#34413d', '#f3f6f5': '#1e2522', '#fafbfb': '#1b2220', '#9aa5a2': '#6f7d79',
    '#2e3936': '#d5dddA', '#c7dcd8': '#2c4a45', '#138a80': '#1f9d91', '#e3f4f1': '#14302b',
    '#0f6f67': '#7fd6cc', '#b4372f': '#f0857d', '#fdebea': '#3a1d1b', '#fff7f6': '#271a19',
    '#fff4f3': '#2a1a19', '#8a5a00': '#e6b65c', '#fff4d9': '#33280f', '#fff8ec': '#2b2414',
    '#6d4bb8': '#b9a2f0', '#eee8fb': '#2a2340', '#f2faf8': '#14231f', '#2563eb': '#86aaf5'
};
function _sadeGeceDeger(prop, v) {
    if (prop === 'color' && /^\s*#fff(fff)?\s*(!important)?\s*$/i.test(v)) return v; // vurgu düğmesindeki beyaz yazı kalsın
    return v.replace(/#[0-9a-f]{3,6}\b/gi, function (h) { return SADE_GECE_RENK[h.toLowerCase()] || h; }).replace(/color-scheme\s*:\s*light/g, 'color-scheme:dark');
}
function _sadeGeceKurallar(css, kapsam) {
    let out = '', i = 0;
    while (i < css.length) {
        let ac = css.indexOf('{', i); if (ac < 0) break;
        let sec = css.slice(i, ac).trim(), d = 1, j = ac + 1;
        while (j < css.length && d) { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; }
        let govde = css.slice(ac + 1, j - 1);
        if (sec.charAt(0) === '@') {
            if (/^@media/.test(sec)) { let ic = _sadeGeceKurallar(govde, kapsam); if (ic) out += sec + '{' + ic + '}\n'; }
        } else {
            let renkli = false;
            let yeni = govde.split(';').map(function (dek) {
                let k = dek.indexOf(':'); if (k < 0) return '';
                let p = dek.slice(0, k).trim(), v = dek.slice(k + 1);
                if (!/#[0-9a-f]{3,6}\b|color-scheme/i.test(v)) return '';
                let nv = _sadeGeceDeger(p, v); if (nv === v && p !== 'color-scheme') return '';
                renkli = true; return p + ':' + (p === 'color-scheme' ? 'dark' : nv);
            }).filter(Boolean).join(';');
            if (renkli) out += sec.split(',').map(function (s) { return kapsam + ' ' + s.trim(); }).join(',') + '{' + yeni + '}\n';
        }
        i = j;
    }
    return out;
}
function sadeGeceEkle(st) {
    try {
        if (!st || !st.id || document.getElementById(st.id + '-gece')) return;
        let kapsam = location.pathname.indexOf('/milo') === 0 ? 'html:not(.milo-tema-sade)' : 'body:not(.light-theme)';
        let g = document.createElement('style'); g.id = st.id + '-gece';
        g.textContent = _sadeGeceKurallar(st.textContent, kapsam);
        st.after(g);
    } catch (e) {}
}
