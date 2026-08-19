/* =====================================================================
   DAĞ S.K. — Teknik Çalışma Modülü  (v1)
   ---------------------------------------------------------------------
   Bağımsız, çakışmayan (scoped) modül. Tek dosya HTML app'ine gömülebilir
   ya da <script src="dagsk-teknik-calisma.js"></script> ile eklenebilir.

   Kullanım:
     DAGSK_TEKNIK.mount(document.getElementById('teknik-container'));
   İstersen bölümleri kapat:
     DAGSK_TEKNIK.mount(el, { materials:true, plan:true, intro:true });

   Bağımlılık YOK. Kendi CSS'ini "tk-" önekiyle tek sefer enjekte eder,
   mevcut app stillerine dokunmaz.
   ===================================================================== */
(function (global) {
  "use strict";

  /* ---------- SVG yardımcıları ---------- */
  var badge =
    '<svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="none" stroke="#F26522" stroke-width="3"/><circle cx="26" cy="26" r="16" fill="none" stroke="#143A5E" stroke-width="3"/></svg>';

  // ok/play ikonu
  var play = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M4 3l16 9-16 9z"/></svg>';
  var doc  = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M6 3h9l3 3v15H6z"/><path d="M9 12h6"/></svg>';

  /* ---------- 20 ÇALIŞMA ---------- */
  var DATA = [
    {
      num:1, cat:"Hazırlık · Duruş", title:"Duruş & Kurulum",
      amac:"Tekrarlanabilir, dengeli bir zemin kurmak. İyi atışın yarısı ayaklarda başlar.",
      steps:["Ayaklar omuz genişliğinde; kare veya hafif açık duruşu dene.","Ağırlık iki ayağa eşit, gövde dik.","Kalça-omuz üst üste, hedefe doğru hafif 'T' formu.","Yer bandıyla ayak çizgisini işaretle."],
      stats:[["Set","3"],["Süre","2 dk"],["Odak","Denge"]],
      malzeme:["Yer bandı","Ayna"],
      videos:[{l:"Duruş & temel form",u:"https://www.youtube.com/watch?v=JQXeyFbhGOk"}],
      svg:'<svg viewBox="0 0 200 150"><line x1="20" y1="110" x2="180" y2="110" stroke="#B7C6D6" stroke-width="2" stroke-dasharray="4 5"/><ellipse cx="70" cy="108" rx="11" ry="24" fill="#143A5E"/><ellipse cx="110" cy="102" rx="11" ry="24" fill="#F26522"/><line x1="90" y1="82" x2="172" y2="52" stroke="#0B2545" stroke-width="2.5"/><circle cx="172" cy="48" r="13" fill="none" stroke="#F26522" stroke-width="3"/><circle cx="172" cy="48" r="4" fill="#F26522"/></svg>'
    },
    {
      num:2, cat:"Hazırlık · Form", title:"Lastik Bant Form Çalışması",
      amac:"Atış dizisini (kurul, çek, çapa, genişle) yay yükü olmadan kas hafızasına kazımak.",
      steps:["Bandı ön ele al, hedefe kurul, kolu çürütmeden çekişe geç.","Çekişi kolla değil kürek kemiğiyle (sırt) yap.","Çapaya yavaş gel, 2 sn tut, kontrollü bırak.","Aynanın önünde yaparak hizayı gör."],
      stats:[["Set","3–4"],["Tekrar","8–10"],["Tempo","Yavaş"]],
      malzeme:["Direnç lastiği","Ayna"],
      videos:[{l:"SPT & bant çalışması",u:"https://www.youtube.com/watch?v=gETKrdFH4Xk"}],
      svg:'<svg viewBox="0 0 200 150"><circle cx="96" cy="34" r="10" fill="#143A5E"/><path d="M96 44 L96 90" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M96 55 L46 55" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M96 55 L136 55 L148 42" stroke="#143A5E" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M46 55 L148 42" stroke="#F26522" stroke-width="3" stroke-dasharray="2 4"/><path d="M96 90 L82 126 M96 90 L110 126" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/></svg>'
    },
    {
      num:3, cat:"Kuvvet · SPT", title:"SPT — Tutuş / Bekleme",
      amac:"Kurulu pozisyonda dayanıklılık ve stabilite. Uzun serilerde form bozulmasını önler.",
      steps:["Oku takmadan (asla kuru sıkım yok) tam çekişe kurul.","Pozisyonu bozmadan 15–30 sn sabit tut.","Bekleme süresinin ~2 katı dinlen.","Hafif poundajlı yay veya bantla yap."],
      stats:[["Set","4–6"],["Tutuş","15–30 sn"],["Dinlen","2× süre"]],
      malzeme:["Hafif yay / bant","Kronometre"],
      videos:[{l:"SPT videosu",u:"https://www.youtube.com/watch?v=gETKrdFH4Xk"},{l:"USA Archery yazısı",u:"https://www.usarchery.org/article/Developing-Strength-and-Endurance-with-Specific-Physical-Training",doc:true}],
      svg:'<svg viewBox="0 0 200 150"><circle cx="90" cy="34" r="10" fill="#143A5E"/><path d="M90 44 L90 90" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M90 55 L42 55" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M90 55 L126 55 L136 44" stroke="#143A5E" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M42 26 Q32 55 42 84" stroke="#0B2545" stroke-width="3" fill="none"/><path d="M90 90 L76 126 M90 90 L104 126" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><circle cx="162" cy="40" r="15" fill="none" stroke="#F26522" stroke-width="3"/><path d="M162 40 L162 30 M162 40 L170 44" stroke="#F26522" stroke-width="3" stroke-linecap="round"/></svg>'
    },
    {
      num:4, cat:"Kuvvet · SPT", title:"SPT — Reversal (Çek · Bekle · İndir)",
      amac:"Çekiş kaslarını dinamik çalıştırmak ve kontrollü çekiş-bırakış geçişini öğretmek.",
      steps:["Kurul → 3–5 sn tut → pozisyonu bozmadan yavaş indir.","Tekrar bitmeden dinlenmeye geçme, akıcı yap.","Sırt gerilimini sürekli hisset.","Bant veya hafif yayla; formu feda etme."],
      stats:[["Set","3"],["Tekrar","6–8"],["Tempo","Kontrollü"]],
      malzeme:["Direnç lastiği / yay"],
      videos:[{l:"SPT videosu",u:"https://www.youtube.com/watch?v=gETKrdFH4Xk"}],
      svg:'<svg viewBox="0 0 200 150"><path d="M40 80 h95" stroke="#143A5E" stroke-width="3"/><path d="M55 80 L55 34 M48 46 L55 34 L62 46" stroke="#F26522" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="100" cy="48" r="13" fill="none" stroke="#143A5E" stroke-width="3"/><path d="M100 48 L100 39 M100 48 L107 51" stroke="#143A5E" stroke-width="3" stroke-linecap="round"/><path d="M145 34 L145 80 M138 68 L145 80 L152 68" stroke="#143A5E" stroke-width="3" fill="none" stroke-linecap="round"/><text x="46" y="98" font-family="sans-serif" font-size="11" fill="#607285">çek</text><text x="86" y="98" font-family="sans-serif" font-size="11" fill="#607285">bekle</text><text x="130" y="98" font-family="sans-serif" font-size="11" fill="#607285">indir</text></svg>'
    },
    {
      num:5, cat:"Kontrol · Form", title:"Boş Hedef / Kör Atış",
      amac:"Nişan kaygısını kapatıp forma ve atışın hissine odaklanmak. Hedef panik için birebir.",
      steps:["Boş balyaya çok yakın dur (2–3 m), güvenliği kontrol et.","Kurul, gözleri kapat, tüm atış dizisini eksiksiz uygula.","'Kolum gergin miydi, sırtım çalıştı mı?' diye hisset.","Nişan yok ama rutinin tamamı var."],
      stats:[["Ok","10–15"],["Mesafe","2–3 m"],["Odak","His"]],
      malzeme:["Boş balya","Yay + ok"],
      videos:[{l:"Kör atış anlatım",u:"https://www.youtube.com/watch?v=iHVnAKgkXtM"},{l:"3 anahtar kural",u:"https://www.youtube.com/watch?v=CIVmFlYM6Mw"}],
      svg:'<svg viewBox="0 0 200 150"><rect x="152" y="28" width="34" height="84" rx="3" fill="#143A5E"/><line x1="152" y1="52" x2="186" y2="52" stroke="#8FB0CE" stroke-width="1.5"/><line x1="152" y1="88" x2="186" y2="88" stroke="#8FB0CE" stroke-width="1.5"/><circle cx="58" cy="40" r="10" fill="#143A5E"/><path d="M58 50 L58 92" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M58 60 L106 60" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M58 60 L90 70" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M58 92 L46 124 M58 92 L70 124" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M70 26 h10 l-10 8 h10" stroke="#F26522" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
    },
    {
      num:6, cat:"Kontrol · Görsel", title:"Ayna Çalışması",
      amac:"Kendi formunu anlık görerek düzeltmek: omuz düşürme, çapa tutarlılığı, kafa pozisyonu.",
      steps:["Aynaya önden ve yandan kurul; her açıda tek şeyi kontrol et.","Çapa noktası her seferinde aynı yere geliyor mu bak.","Ön omuz aşağıda mı, kürek kemikleri yaklaşıyor mu?","Ayna yoksa telefonu tripoda alıp video çek."],
      stats:[["Set","2–3"],["Süre","5 dk"],["Odak","Hiza"]],
      malzeme:["Ayna / telefon","Bant veya yay"],
      videos:[{l:"Atış öncesi kontrol listesi",u:"https://www.youtube.com/watch?v=8HNNDSoSb2c"}],
      svg:'<svg viewBox="0 0 200 150"><rect x="104" y="20" width="66" height="112" rx="4" fill="none" stroke="#143A5E" stroke-width="3"/><line x1="137" y1="20" x2="137" y2="132" stroke="#DCE6F0" stroke-width="9"/><circle cx="58" cy="46" r="10" fill="#143A5E"/><path d="M58 56 L58 98" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M58 66 L94 66" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M58 66 L82 74" stroke="#F26522" stroke-width="6" stroke-linecap="round"/><circle cx="154" cy="46" r="10" fill="#B7C6D6"/><path d="M154 56 L154 98" stroke="#B7C6D6" stroke-width="6" stroke-linecap="round"/><path d="M154 66 L118 66" stroke="#B7C6D6" stroke-width="6" stroke-linecap="round"/></svg>'
    },
    {
      num:7, cat:"Kontrol · Denge", title:"Denge Çalışması",
      amac:"Alt gövde stabilizasyonu ve merkez dengesi. Sağlam zemin, üst gövde formunun ön koşulu.",
      steps:["Denge tahtasında atış duruşunu al, 20–30 sn sabit dur.","Tahta yoksa tek ayak üstünde: önce gözler açık, sonra kapalı.","Karın ve kalça kaslarını hafif kasılı tut (core aktif).","Dengeyi bulunca yaysız çekiş dizisi ekle."],
      stats:[["Set","3"],["Süre","20–30 sn"],["Odak","Core"]],
      malzeme:["Denge tahtası (DIY)"],
      videos:[],
      svg:'<svg viewBox="0 0 200 150"><path d="M60 116 h80" stroke="#143A5E" stroke-width="5" stroke-linecap="round"/><path d="M90 116 a10 6 0 0 0 20 0" fill="none" stroke="#F26522" stroke-width="3"/><circle cx="100" cy="38" r="10" fill="#143A5E"/><path d="M100 48 L100 88" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M100 60 L76 54 M100 60 L124 54" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M100 88 L100 114" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M100 88 L118 106" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/></svg>'
    },
    {
      num:8, cat:"Kontrol · Bırakış", title:"Klik & Genişleme / Takip",
      amac:"Bırakışı parmakla 'atmak' yerine sürekli genişlemeyle yapmak ve temiz takip kurmak.",
      steps:["Çapada dur, iki omuz arasını açar gibi genişlemeye devam et.","Klik varsa: klik düşene kadar genişle, sonra bekletmeden bırak.","Bırakıştan sonra el geriye, boyun/omuz hizasına aksın.","Formaster ile birlikte kirli bırakışı hemen fark edersin."],
      stats:[["Set","3"],["Tekrar","8–10"],["Odak","Genişleme"]],
      malzeme:["Yay + klik","Formaster (ops.)"],
      videos:[{l:"Nişan · Çapa · Hiza",u:"https://www.youtube.com/watch?v=Vvbw3MHq_F8"}],
      svg:'<svg viewBox="0 0 200 150"><circle cx="100" cy="42" r="10" fill="#143A5E"/><path d="M100 52 L100 96" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M100 64 L58 64" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M100 64 L142 64" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M50 64 L34 64 M40 58 L34 64 L40 70" stroke="#F26522" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M150 64 L166 64 M160 58 L166 64 L160 70" stroke="#F26522" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M100 96 L88 124 M100 96 L112 124" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/></svg>'
    },
    {
      num:9, cat:"Zihin · Rutin", title:"Zihinsel Rutin & Nefes",
      amac:"Her atıştan önce aynı rutini ve nefes döngüsünü kurup baskı altında tutarlılık sağlamak.",
      steps:["Sabit sıra: derin nefes → kurul → çapa → nişan → bırak.","Kurulurken yavaş al, çapada kısa tut, genişlerken bırak.","Zihin dağılırsa oku indir, baştan başla.","Rutini boş balyada ve yarış provasında tekrarla."],
      stats:[["Ok","10+"],["Odak","Rutin"],["Nefes","Kontrollü"]],
      malzeme:["Yay + ok","Sessiz ortam"],
      videos:[{l:"Süreç & zihin",u:"https://www.youtube.com/watch?v=cxS7dkCMGRI"},{l:"Kontrol listesi",u:"https://www.youtube.com/watch?v=8HNNDSoSb2c"}],
      svg:'<svg viewBox="0 0 200 150"><circle cx="100" cy="72" r="44" fill="none" stroke="#143A5E" stroke-width="3"/><path d="M100 28 A44 44 0 0 1 144 72" fill="none" stroke="#F26522" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="28" r="4" fill="#F26522"/><text x="100" y="70" font-family="sans-serif" font-size="14" font-weight="700" fill="#0B2545" text-anchor="middle">NEFES</text><text x="100" y="86" font-family="sans-serif" font-size="10" fill="#607285" text-anchor="middle">al · tut · bırak</text></svg>'
    },
    {
      num:10, cat:"Bırakış · DIY", title:"Formaster ile Bırakış Kontrolü",
      amac:"Erken/kirli bırakışı fiziksel engellemek ve bırakışın sırttan geldiğini hissettirmek.",
      steps:["Kayışı çekiş koluna tak, ipi ön kola/yaya sabitle.","Kurul; kayış kaçmayı engelleyince sırtla genişlemeye devam et.","Doğru yaparsan el kontrollü geriye akar, 'atma' hissi kaybolur.","DIY: kol kayışı + paraşüt ipi + karabina, 20 dk'da yapılır."],
      stats:[["Set","3"],["Tekrar","6–8"],["Odak","Sırt"]],
      malzeme:["Formaster (DIY)","Yay"],
      videos:[{l:"KSL SPT & Formaster",u:"https://www.kslinternationalarchery.com/Training/SPTs/SPTs.html",doc:true}],
      svg:'<svg viewBox="0 0 200 150"><circle cx="70" cy="42" r="10" fill="#143A5E"/><path d="M70 52 L70 96" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M70 62 L118 62" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M70 62 L100 72" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M100 72 Q112 96 118 66" stroke="#F26522" stroke-width="2.5" fill="none" stroke-dasharray="3 3"/><circle cx="118" cy="62" r="3.5" fill="#F26522"/><path d="M70 96 L58 124 M70 96 L82 124" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/></svg>'
    },
    {
      num:11, cat:"Detay · Yay Eli", title:"Kavrama & Yay Eli Baskısı",
      amac:"Yayı sıkmadan, baskıyı başparmak yastığından tek noktadan vermek. Sol-sağ sapmaların ana kaynağı burasıdır.",
      steps:["Baş ve işaret parmağı arasındaki 'V'yi kavramaya hizala.","Baskı başparmak yastığında; avuç ve parmaklar gevşek.","Yayı sıkma — atıştan sonra bile el gevşek kalsın (parmak askısı tutar).","Her atışta aynı baskı noktasını bul."],
      stats:[["Set","2–3"],["Tekrar","10"],["Odak","Baskı noktası"]],
      malzeme:["Yay","Parmak askısı"],
      videos:[{l:"Kavrama & baskı (makale)",u:"https://archery360.com/2026/05/19/form-deep-dive-grip-pressure/",doc:true}],
      svg:'<svg viewBox="0 0 200 150"><path d="M60 118 C60 70 84 44 108 44" stroke="#143A5E" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M108 44 C120 44 128 52 128 62" stroke="#143A5E" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M60 118 C60 100 66 92 78 92" stroke="#143A5E" stroke-width="7" fill="none" stroke-linecap="round"/><line x1="128" y1="30" x2="128" y2="120" stroke="#0B2545" stroke-width="4"/><circle cx="98" cy="58" r="7" fill="#F26522"/><path d="M110 58 L150 58 M140 52 L150 58 L140 64" stroke="#F26522" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>'
    },
    {
      num:12, cat:"Detay · Çapa", title:"Çapa Noktası Tutarlılığı",
      amac:"Çekiş elinin yüze her seferinde birebir aynı yerden oturması. Dikey dağılımın en büyük belirleyicisi.",
      steps:["Sabit temas noktaları seç: çene altı + burun ipe değsin.","İşaret parmağı çene kemiği altına net otursun.","Aynada 5 atış üst üste çek, çapa kayıyor mu bak.","Yorulunca çapa düşer — kısa serilerle çalış."],
      stats:[["Set","3"],["Tekrar","8"],["Odak","Tekrarlılık"]],
      malzeme:["Yay / bant","Ayna"],
      videos:[{l:"Nişan · Çapa · Hiza",u:"https://www.youtube.com/watch?v=Vvbw3MHq_F8"}],
      svg:'<svg viewBox="0 0 200 150"><path d="M108 26 C132 26 140 52 138 72 C136 96 122 108 104 108 L104 118" stroke="#143A5E" stroke-width="4" fill="none" stroke-linecap="round"/><line x1="104" y1="30" x2="104" y2="120" stroke="#0B2545" stroke-width="3"/><path d="M60 78 L104 92" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><circle cx="104" cy="92" r="6" fill="#F26522"/><circle cx="118" cy="66" r="3" fill="#F26522"/></svg>'
    },
    {
      num:13, cat:"Kontrol · Nişan", title:"Nişan & Yalpalama Kontrolü",
      amac:"Nişanın sabit durmadığını kabul edip 'yüzen' nişanı merkez etrafında tutarken bırakabilmek.",
      steps:["Nişanı ortada dondurmaya çalışma — küçük bir daire çizmesine izin ver.","Nişan 'yeterince iyi' iken, genişlemeye ve bırakışa güven.","Mükemmel anı bekleme; bekledikçe titreme artar (~5–8 sn içinde bırak).","Boş balyada rahat, sonra hedefe taşı."],
      stats:[["Ok","12"],["Süre","≤8 sn/atış"],["Odak","Kabul"]],
      malzeme:["Yay + ok","Tek nokta nişan"],
      videos:[{l:"Nişan · Çapa · Hiza",u:"https://www.youtube.com/watch?v=Vvbw3MHq_F8"}],
      svg:'<svg viewBox="0 0 200 150"><circle cx="100" cy="72" r="40" fill="none" stroke="#143A5E" stroke-width="3"/><circle cx="100" cy="72" r="22" fill="none" stroke="#B7C6D6" stroke-width="2"/><circle cx="100" cy="72" r="6" fill="#F26522"/><path d="M100 72 m0 -13 a13 13 0 1 0 0.1 0" fill="none" stroke="#F26522" stroke-width="2" stroke-dasharray="3 4"/></svg>'
    },
    {
      num:14, cat:"Kontrol · Hassasiyet", title:"Tek Ok / Tek Nokta",
      amac:"Kör atışta oturan formu yakın mesafede tek noktaya taşımak. Formu bozmadan nişanı ekleme köprüsü.",
      steps:["Boş balya çalışmasından sonra tek ok al, hedefe 5–8 m dur.","A4'e basılı tek turuncu noktaya, mükemmel forma odaklan.","Birkaç atış yap, iyi bir atışla bitir (pozitif kapanış).","Kolaylaştıkça 2–3 m geri git."],
      stats:[["Ok","6–10"],["Mesafe","5–8 m"],["Odak","Form+nişan"]],
      malzeme:["Yay + ok","Tek nokta kağıdı"],
      videos:[{l:"Yakın mesafe çalışması",u:"https://www.youtube.com/watch?v=CIVmFlYM6Mw"}],
      svg:'<svg viewBox="0 0 200 150"><rect x="140" y="34" width="44" height="80" rx="3" fill="#EAF0F6" stroke="#143A5E" stroke-width="2"/><circle cx="162" cy="74" r="8" fill="#F26522"/><circle cx="58" cy="44" r="10" fill="#143A5E"/><path d="M58 54 L58 96" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M58 64 L98 64" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><line x1="98" y1="64" x2="150" y2="70" stroke="#0B2545" stroke-width="2" stroke-dasharray="4 3"/><path d="M58 96 L46 124 M58 96 L70 124" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/></svg>'
    },
    {
      num:15, cat:"Kontrol · Mesafe", title:"Walk-Back / Uzaklaşma Grubu",
      amac:"Formu artan mesafede koruyabilmek. Nişan hatalarını ve form kaçaklarını mesafeyle büyüterek görünür kılar.",
      steps:["Yakın mesafede sıkı grup yakala (ör. 10 m).","Her 3–5 iyi atışta 3–5 m geri git.","Grup açılırsa mesafeyi düşür, formu geri kur.","Gün sonunda ulaştığın en uzak stabil mesafeyi not et."],
      stats:[["Ok","Seri","·"],["Adım","+3–5 m"],["Odak","Süreklilik"]],
      malzeme:["Yay + ok","Hedef"],
      videos:[],
      svg:'<svg viewBox="0 0 200 150"><line x1="30" y1="120" x2="180" y2="120" stroke="#B7C6D6" stroke-width="2"/><circle cx="50" cy="120" r="6" fill="#143A5E"/><circle cx="95" cy="120" r="6" fill="#143A5E"/><circle cx="145" cy="120" r="6" fill="#F26522"/><path d="M50 108 L145 60" stroke="#0B2545" stroke-width="2" stroke-dasharray="4 4"/><circle cx="148" cy="56" r="12" fill="none" stroke="#F26522" stroke-width="3"/><circle cx="148" cy="56" r="4" fill="#F26522"/><path d="M56 132 L88 132 M80 127 L88 132 L80 137" stroke="#F26522" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
    },
    {
      num:16, cat:"Zihin · Ritim", title:"Ritim & Tempo",
      amac:"Atışları tutarlı bir süre penceresinde bitirmek. Aşırı nişan alıp donmayı ve titremeyi engeller.",
      steps:["Atış dizini say: kurul(1-2) → çapa(3) → genişle+bırak(4-6).","Metronom/kronometre ile aynı tempoyu yakala.","Pencereyi kaçırırsan oku indir, tekrar başla.","Aynı ritmi her mesafede koru."],
      stats:[["Ok","10–15"],["Tempo","~5–6 sn"],["Odak","Ritim"]],
      malzeme:["Yay + ok","Metronom / telefon"],
      videos:[],
      svg:'<svg viewBox="0 0 200 150"><line x1="30" y1="90" x2="170" y2="90" stroke="#B7C6D6" stroke-width="2"/><rect x="46" y="70" width="10" height="20" rx="2" fill="#143A5E"/><rect x="76" y="60" width="10" height="30" rx="2" fill="#143A5E"/><rect x="106" y="50" width="10" height="40" rx="2" fill="#143A5E"/><rect x="136" y="38" width="10" height="52" rx="2" fill="#F26522"/><path d="M40 112 L160 112" stroke="#F26522" stroke-width="2" stroke-dasharray="3 5"/><text x="100" y="128" font-family="sans-serif" font-size="11" fill="#607285" text-anchor="middle">eşit aralık</text></svg>'
    },
    {
      num:17, cat:"Detay · Sırt", title:"Kürek Kemiği / Sırt Aktivasyonu",
      amac:"Çekişi koldan değil sırttan yaptırmak. Kürek kemiklerini birbirine yaklaştırma hissini izole çalışmak.",
      steps:["Yaysız: dirsekleri geriye çekip kürek kemiklerini sıkıştır, 5 sn tut.","Bantla: çekişte omuz aşağıda, hareketi sırtın başlattığını hisset.","El sadece kanca; iş kürek kemiğinde olsun.","Aynada omuzun yukarı kalkmadığını doğrula."],
      stats:[["Set","3"],["Tekrar","10"],["Odak","Sırt"]],
      malzeme:["Direnç lastiği","Ayna"],
      videos:[{l:"Sırt gerilimi drill",u:"https://www.youtube.com/watch?v=uAJHc0jSwGE"}],
      svg:'<svg viewBox="0 0 200 150"><circle cx="100" cy="34" r="10" fill="#143A5E"/><path d="M100 44 L100 100" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M100 58 L70 58 L58 44" stroke="#143A5E" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M100 58 L130 58 L142 44" stroke="#143A5E" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M76 72 L88 66 M124 72 L112 66" stroke="#F26522" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M88 66 L84 72 M112 66 L116 72" stroke="#F26522" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M100 100 L88 128 M100 100 L112 128" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/></svg>'
    },
    {
      num:18, cat:"Bırakış · Takip", title:"Bırakış Sonrası Poz Tutma",
      amac:"Follow-through'u öğretmek: bırakıştan sonra pozisyonu 2–3 sn dondurarak formun sonuna kadar aktif kalmasını sağlamak.",
      steps:["Bırak, sonra çekiş elini boyun hizasında dondur, saymadan hareket etme.","Ön kol hedefe dönük sabit kalsın, düşürme.","'Ok hedefe varana kadar poz bozulmaz' kuralı.","Boş balyada, gözler kapalı ekstra etkili."],
      stats:[["Set","3"],["Tekrar","8"],["Tut","2–3 sn"]],
      malzeme:["Yay + ok / bant"],
      videos:[{l:"Ex-draws / sırt gerilimi",u:"https://www.youtube.com/watch?v=jtNc2dtf7dg"}],
      svg:'<svg viewBox="0 0 200 150"><circle cx="90" cy="36" r="10" fill="#143A5E"/><path d="M90 46 L90 96" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M90 58 L42 58" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M90 58 L130 50" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><path d="M130 50 L150 40" stroke="#F26522" stroke-width="4" stroke-linecap="round"/><path d="M90 96 L78 124 M90 96 L102 124" stroke="#143A5E" stroke-width="6" stroke-linecap="round"/><circle cx="155" cy="36" r="12" fill="none" stroke="#F26522" stroke-width="2.5"/><path d="M155 36 L155 28 M155 36 L161 39" stroke="#F26522" stroke-width="2.5" stroke-linecap="round"/></svg>'
    },
    {
      num:19, cat:"Zihin · Prova", title:"Görselleştirme / Zihinsel Prova",
      amac:"Fiziksel yorulmadan mükemmel atışı zihinde tekrarlamak. Rutin ve güveni pekiştirir, yarış öncesi güçlü araç.",
      steps:["Gözleri kapat, kendini birinci ağızdan atış yaparken canlandır.","Duruş, çapa, genişleme ve temiz bırakışı detaylı hisset.","Hedefe isabet + sakin nefesi 'gör'.","Antrenman öncesi/gece 5–10 tekrar; hep başarılı atış hayal et."],
      stats:[["Tekrar","5–10"],["Süre","5 dk"],["Odak","Zihin"]],
      malzeme:["Sessiz ortam"],
      videos:[{l:"Süreç & zihin",u:"https://www.youtube.com/watch?v=cxS7dkCMGRI"}],
      svg:'<svg viewBox="0 0 200 150"><circle cx="80" cy="60" r="26" fill="none" stroke="#143A5E" stroke-width="3"/><path d="M80 46 a6 6 0 0 1 0 12" fill="none" stroke="#143A5E" stroke-width="3"/><path d="M104 60 C120 44 140 44 156 60" fill="none" stroke="#F26522" stroke-width="2.5" stroke-dasharray="3 4"/><circle cx="156" cy="60" r="12" fill="none" stroke="#F26522" stroke-width="3"/><circle cx="156" cy="60" r="4" fill="#F26522"/><path d="M64 96 q16 12 32 0" fill="none" stroke="#607285" stroke-width="2"/></svg>'
    },
    {
      num:20, cat:"Kuvvet · Dayanıklılık", title:"Yorgunlukta Form (Hacim Serisi)",
      amac:"Yorgunken bile formu koruyabilmek. Yarışın son serilerinde form çökmesini önler; bilinçli hacim çalışması.",
      steps:["Rahat bir mesafede uzun seriler at (form bozulursa dur).","Yorgunluk gelince tek şeye odaklan: sırt gerilimi / çapa.","Form bozulmaya başladığı anı fark et, o noktada bitir.","Zamanla o eşiği ileri taşı — asla kötü formu tekrarlama."],
      stats:[["Seri","Uzun"],["Odak","Süreklilik"],["Kural","Form>skor"]],
      malzeme:["Yay + ok","Su"],
      videos:[{l:"SPT (dayanıklılık)",u:"https://www.youtube.com/watch?v=gETKrdFH4Xk"}],
      svg:'<svg viewBox="0 0 200 150"><line x1="30" y1="120" x2="180" y2="120" stroke="#B7C6D6" stroke-width="2"/><path d="M40 100 L70 100 L100 102 L130 108 L160 118" fill="none" stroke="#143A5E" stroke-width="3"/><path d="M40 100 L70 98 L100 98 L130 99 L160 100" fill="none" stroke="#F26522" stroke-width="3" stroke-dasharray="4 4"/><circle cx="160" cy="118" r="4" fill="#143A5E"/><text x="30" y="140" font-family="sans-serif" font-size="10" fill="#607285">yorgunluk →</text></svg>'
    }
  ];

  /* ---------- Haftalık program (4 gün) ---------- */
  var PLAN = [
    ["Gün 1 · Temel & Kuvvet", ["Duruş & kurulum (1)","Lastik bant form (2)","SPT tutuş (3)","SPT reversal (4)"]],
    ["Gün 2 · Detay & Kontrol", ["Kavrama (11)","Çapa tutarlılığı (12)","Ayna (6)","Denge (7)"]],
    ["Gün 3 · Form & His", ["Sırt aktivasyonu (17)","Boş hedef / kör atış (5)","Klik & genişleme (8)","Takip / poz tutma (18)"]],
    ["Gün 4 · Nişan & Zihin", ["Tek ok / tek nokta (14)","Ritim & tempo (16)","Zihinsel rutin & nefes (9)","Görselleştirme (19)"]]
  ];

  /* ---------- Malzeme listesi ---------- */
  var MALZEME = [
    ["Direnç Lastiği / Theraband","Yaysız form ve SPT için. 2–3 sertlik ideal.","DIY: bisiklet iç lastiği / kalın pilates bandı"],
    ["Boş Balya / Sünger Hedef","Kör atış için yakına konan yumuşak hedef.","DIY: saman balyası / sıkıştırılmış streç / karton-sünger"],
    ["Boy Aynası","Duruş ve hizayı görsel kontrol.","DIY: mevcut ayna; yoksa telefon + tripod"],
    ["Denge Tahtası","Alt gövde stabilizasyonu.","DIY: tahta + PVC boru / yarım silindir köpük"],
    ["Formaster","Erken/kirli bırakışı engeller.","DIY: kol kayışı + paraşüt ipi + karabina"],
    ["Yer Bandı & Nişan Kağıdı","Duruş çizgisi ve tek nokta nişanı.","DIY: maskeleme bandı + A4'e basılı turuncu nokta"]
  ];

  /* ---------- CSS (scoped: .tk-) ---------- */
  var CSS = [
    '.tk-root{--tk-navy:#0B2545;--tk-navy2:#143A5E;--tk-soft:#EAF0F6;--tk-orange:#F26522;--tk-osoft:#FDEBE0;--tk-line:#D8DEE6;--tk-ink:#1B2430;--tk-muted:#607285;color:var(--tk-ink);font-family:inherit;line-height:1.55;}',
    '.tk-root *{box-sizing:border-box;}',
    '.tk-intro{background:#fff;border:1px solid var(--tk-line);border-radius:14px;padding:16px 20px;margin-bottom:18px;}',
    '.tk-intro p{font-size:14.5px;color:#39485a;margin:0;}',
    '.tk-sec{display:flex;align-items:center;gap:12px;margin:28px 0 4px;}',
    '.tk-sec h2{font-weight:800;text-transform:uppercase;letter-spacing:.03em;font-size:20px;color:var(--tk-navy);white-space:nowrap;margin:0;}',
    '.tk-sec .tk-bar{height:3px;flex:1;background:var(--tk-line);}',
    '.tk-note{font-size:13.5px;color:var(--tk-muted);margin:4px 0 14px;}',
    '.tk-mats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}',
    '.tk-mat{background:#fff;border:1px solid var(--tk-line);border-radius:12px;padding:14px 16px;}',
    '.tk-mat h4{font-weight:700;font-size:15.5px;color:var(--tk-navy);margin:0 0 3px;text-transform:uppercase;letter-spacing:.02em;}',
    '.tk-mat p{font-size:13px;color:#45566a;margin:0;}',
    '.tk-diy{display:inline-block;margin-top:7px;font-weight:700;font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--tk-orange);background:var(--tk-osoft);border-radius:6px;padding:3px 8px;}',
    '.tk-drill{background:#fff;border:1px solid var(--tk-line);border-radius:16px;margin-bottom:16px;overflow:hidden;}',
    '.tk-head{display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--tk-line);}',
    '.tk-badge{flex:none;width:46px;height:46px;position:relative;}',
    '.tk-badge svg{width:46px;height:46px;}',
    '.tk-badge .tk-num{position:absolute;inset:0;display:grid;place-items:center;font-weight:800;font-size:19px;color:var(--tk-navy);}',
    '.tk-cat{font-weight:700;text-transform:uppercase;letter-spacing:.12em;font-size:11px;color:var(--tk-orange);}',
    '.tk-head h3{font-weight:700;text-transform:uppercase;font-size:19px;line-height:1.05;color:var(--tk-navy);margin:2px 0 0;letter-spacing:.01em;}',
    '.tk-body{display:grid;grid-template-columns:180px 1fr;}',
    '.tk-fig{background:var(--tk-soft);border-right:1px solid var(--tk-line);display:grid;place-items:center;padding:14px;}',
    '.tk-fig svg{width:100%;height:auto;max-width:160px;}',
    '.tk-content{padding:16px 18px 18px;}',
    '.tk-amac{font-size:15px;color:#2c3a4a;margin:0 0 12px;}',
    '.tk-amac b{color:var(--tk-navy);}',
    '.tk-steps{list-style:none;margin:0 0 12px;padding:0;display:flex;flex-direction:column;gap:6px;}',
    '.tk-steps li{position:relative;padding-left:22px;font-size:14px;color:#39485a;}',
    '.tk-steps li:before{content:"";position:absolute;left:0;top:6px;width:8px;height:8px;border-radius:50%;border:2.5px solid var(--tk-orange);}',
    '.tk-stats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}',
    '.tk-stat{background:var(--tk-navy);color:#fff;border-radius:9px;padding:6px 11px;line-height:1.1;}',
    '.tk-stat .k{font-weight:600;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#8FB0CE;display:block;}',
    '.tk-stat .v{font-weight:700;font-size:16px;}',
    '.tk-chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:13px;}',
    '.tk-chip{font-weight:600;font-size:12px;color:var(--tk-navy);background:var(--tk-soft);border:1px solid #CBD8E6;border-radius:999px;padding:4px 11px;}',
    '.tk-vids{display:flex;flex-wrap:wrap;gap:9px;}',
    '.tk-vid{display:inline-flex;align-items:center;gap:7px;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.02em;font-size:13px;color:#fff;background:var(--tk-orange);border-radius:9px;padding:7px 13px;transition:background .12s,transform .12s;}',
    '.tk-vid:hover{background:#d9531a;transform:translateY(-1px);}',
    '.tk-vid.tk-alt{background:var(--tk-navy);}',
    '.tk-vid.tk-alt:hover{background:var(--tk-navy2);}',
    '.tk-vid svg{width:14px;height:14px;}',
    '.tk-novid{font-weight:600;font-size:12.5px;color:var(--tk-muted);}',
    '.tk-plan{background:var(--tk-navy);border-radius:16px;padding:22px 24px;color:#fff;}',
    '.tk-plan h2{font-weight:800;text-transform:uppercase;font-size:21px;margin:0 0 14px;}',
    '.tk-week{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}',
    '.tk-day{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:11px;padding:12px 13px;}',
    '.tk-day .dh{font-weight:700;text-transform:uppercase;font-size:13px;color:var(--tk-orange);letter-spacing:.04em;margin-bottom:6px;}',
    '.tk-day ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;}',
    '.tk-day li{font-size:12.5px;color:#DCE6F0;padding-left:13px;position:relative;}',
    '.tk-day li:before{content:"\\203A";position:absolute;left:0;color:var(--tk-orange);font-weight:700;}',
    '@media(max-width:720px){.tk-mats{grid-template-columns:1fr;}.tk-body{grid-template-columns:1fr;}.tk-fig{border-right:none;border-bottom:1px solid var(--tk-line);}.tk-week{grid-template-columns:1fr;}}'
  ].join("\n");

  /* ---------- Render yardımcıları ---------- */
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

  function drillHTML(d){
    var steps = d.steps.map(function(s){return '<li>'+esc(s)+'</li>';}).join("");
    var stats = d.stats.map(function(s){return '<span class="tk-stat"><span class="k">'+esc(s[0])+'</span><span class="v">'+esc(s[1])+'</span></span>';}).join("");
    var chips = d.malzeme.map(function(m){return '<span class="tk-chip">'+esc(m)+'</span>';}).join("");
    var vids;
    if(!d.videos || !d.videos.length){
      vids = '<span class="tk-novid">Adanmış video yok — antrenör gözetiminde uygulanır</span>';
    } else {
      vids = d.videos.map(function(v,i){
        var cls = (i>0||v.doc) ? 'tk-vid tk-alt' : 'tk-vid';
        var icon = v.doc ? doc : play;
        return '<a class="'+cls+'" href="'+v.u+'" target="_blank" rel="noopener">'+icon+esc(v.l)+'</a>';
      }).join("");
    }
    return ''+
      '<article class="tk-drill">'+
        '<div class="tk-head">'+
          '<span class="tk-badge">'+badge+'<span class="tk-num">'+d.num+'</span></span>'+
          '<div><div class="tk-cat">'+esc(d.cat)+'</div><h3>'+esc(d.title)+'</h3></div>'+
        '</div>'+
        '<div class="tk-body">'+
          '<div class="tk-fig">'+d.svg+'</div>'+
          '<div class="tk-content">'+
            '<p class="tk-amac"><b>Amaç:</b> '+esc(d.amac)+'</p>'+
            '<ul class="tk-steps">'+steps+'</ul>'+
            '<div class="tk-stats">'+stats+'</div>'+
            '<div class="tk-chips">'+chips+'</div>'+
            '<div class="tk-vids">'+vids+'</div>'+
          '</div>'+
        '</div>'+
      '</article>';
  }

  function matsHTML(){
    var cards = MALZEME.map(function(m){
      return '<div class="tk-mat"><h4>'+esc(m[0])+'</h4><p>'+esc(m[1])+'</p><span class="tk-diy">'+esc(m[2])+'</span></div>';
    }).join("");
    return '<div class="tk-sec"><h2>Malzeme Listesi</h2><span class="tk-bar"></span></div>'+
           '<p class="tk-note">Çoğu evde yapılabilir — turuncu etiket DIY yapımını gösterir.</p>'+
           '<div class="tk-mats">'+cards+'</div>';
  }

  function planHTML(){
    var days = PLAN.map(function(p){
      var lis = p[1].map(function(x){return '<li>'+esc(x)+'</li>';}).join("");
      return '<div class="tk-day"><div class="dh">'+esc(p[0])+'</div><ul>'+lis+'</ul></div>';
    }).join("");
    return '<div class="tk-sec"><h2>Haftalık Örnek Program</h2><span class="tk-bar"></span></div>'+
           '<p class="tk-note">4 günlük döngü · süreleri yaşa göre ölçekle, her antrenman ısınmayla başlasın.</p>'+
           '<div class="tk-plan"><h2>4 Günlük Döngü</h2><div class="tk-week">'+days+'</div></div>';
  }

  var _cssInjected = false;
  function injectCSS(){
    if(_cssInjected || document.getElementById("tk-styles")) { _cssInjected = true; return; }
    var st = document.createElement("style");
    st.id = "tk-styles";
    st.textContent = CSS;
    document.head.appendChild(st);
    _cssInjected = true;
  }

  /* ---------- Public API ---------- */
  var API = {
    data: DATA,
    render: function(opts){
      opts = opts || {};
      var intro = (opts.intro !== false) ?
        '<div class="tk-intro"><p>20 teknik istasyon; zorluk ve odak sırasına göre dizildi. Isınma sonrası 2–4 istasyon seç, aralarda dinlen. Sporcu yaşına göre süreleri kısalt. Klasik (recurve) temelli, makaralıya uyarlanabilir.</p></div>' : '';
      var mats = (opts.materials !== false) ? matsHTML() : '';
      var drills = '<div class="tk-sec"><h2>Teknik İstasyonlar</h2><span class="tk-bar"></span></div>'+
                   '<p class="tk-note">20 istasyon · her birinde amaç, uygulama, set/tekrar, malzeme ve video.</p>'+
                   DATA.map(drillHTML).join("");
      var plan = (opts.plan !== false) ? planHTML() : '';
      return '<div class="tk-root">'+intro+mats+drills+plan+'</div>';
    },
    mount: function(container, opts){
      if(typeof container === "string") container = document.querySelector(container);
      if(!container){ console.warn("[DAGSK_TEKNIK] container bulunamadı"); return; }
      injectCSS();
      container.innerHTML = this.render(opts);
      return container;
    }
  };

  global.DAGSK_TEKNIK = API;

})(typeof window !== "undefined" ? window : this);
