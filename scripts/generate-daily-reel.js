const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT_DIR = path.join(process.cwd(), 'reel_build');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const STATE_JSON = path.join(OUT_DIR, 'current_scenario.json');

function escXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Deterministik ama her gün / her çalıştırmada 1.000+ farklı kombinasyon üreten yardımcı
function seededPick(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

// ============================================================================
// 5. SANİYE DUVARINI KIRAN "SIFIR REKLAM KOKULU" 1.000+ VİDEO SENARYO MOTORU
// İlk 5 saniyede ASLA uygulama reklamı yapmaz; doğrudan izleyiciyi A/B/C tuzağına çeker!
// ============================================================================
function buildUniqueScenario(forceNew = false) {
  if (!forceNew && fs.existsSync(STATE_JSON)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_JSON, 'utf8'));
    } catch (e) {}
  }

  const dayNo = Math.floor((Date.now() - new Date('2026-01-01').getTime()) / 86400000);
  const hourSalt = new Date().getUTCHours() * 37 + new Date().getUTCMinutes();
  const seed = dayNo * 131 + hourSalt;

  const wordleBank = [
    { g1: 'KALEM', c1: ['#334155','#eab308','#334155','#22c55e','#334155'], g2: 'SAHNE', c2: ['#334155','#22c55e','#334155','#eab308','#334155'], hint: '_ A _ E N', trap: 'MADEN', optB: 'BAZEN', optC: 'HALEN', ans: 'BAZEN' },
    { g1: 'ROket', c1: ['#22c55e','#334155','#334155','#334155','#334155'], g2: 'SALep', c2: ['#334155','#22c55e','#334155','#334155','#334155'], hint: 'R A _ A R', trap: 'RAKAM', optB: 'RADAR', optC: 'RAYLI', ans: 'RADAR' },
    { g1: 'KİTAP', c1: ['#334155','#22c55e','#334155','#eab308','#334155'], g2: 'SİNİR', c2: ['#334155','#22c55e','#eab308','#334155','#334155'], hint: 'L İ M _ N', trap: 'LİMON', optB: 'LİMAN', optC: 'LİSAN', ans: 'LİMAN' },
    { g1: 'KALE',  c1: ['#334155','#334155','#334155','#22c55e','#334155'], g2: 'DEMİR', c2: ['#334155','#22c55e','#334155','#334155','#22c55e'], hint: 'F E _ E R', trap: 'FENER', optB: 'SEFER', optC: 'KEMER', ans: 'FENER' },
    { g1: 'POYRAZ',c1: ['#22c55e','#334155','#334155','#eab308','#eab308'], g2: 'KURAL', c2: ['#334155','#22c55e','#eab308','#eab308','#334155'], hint: 'P R U _ A', trap: 'PRUVA', optB: 'PROVA', optC: 'PLAZA', ans: 'PRUVA' },
    { g1: 'SANAT', c1: ['#334155','#22c55e','#334155','#22c55e','#22c55e'], g2: 'KANAT', c2: ['#334155','#22c55e','#334155','#22c55e','#22c55e'], hint: 'H A _ A T', trap: 'HAYAT', optB: 'HALAT', optC: 'HAMAL', ans: 'HALAT' },
    { g1: 'HEDEF', c1: ['#334155','#22c55e','#334155','#22c55e','#334155'], g2: 'TEKER', c2: ['#334155','#22c55e','#334155','#22c55e','#22c55e'], hint: 'S E _ E R', trap: 'ŞEKER', optB: 'SEFER', optC: 'SEMER', ans: 'SEFER' },
    { g1: 'MOTOR', c1: ['#334155','#22c55e','#334155','#22c55e','#334155'], g2: 'KONUM', c2: ['#334155','#22c55e','#334155','#334155','#334155'], hint: 'L O _ O S', trap: 'LOGOS', optB: 'LODOS', optC: 'LOTUS', ans: 'LODOS' }
  ];

  const battleshipBank = [
    { h1: [3,3], h2: [3,4], miss: [3,2], trap: 'C4', optB: 'F4', optC: 'D5', hitLabel: 'D4 ve E4', ans: 'F4' },
    { h1: [2,2], h2: [3,2], miss: [1,2], trap: 'C2', optB: 'C5', optC: 'D3', hitLabel: 'C3 ve C4', ans: 'C5' },
    { h1: [4,4], h2: [4,5], miss: [4,6], trap: 'G5', optB: 'D5', optC: 'E6', hitLabel: 'E5 ve F5', ans: 'D5' },
    { h1: [1,5], h2: [2,5], miss: [0,5], trap: 'F1', optB: 'F4', optC: 'G3', hitLabel: 'F2 ve F3', ans: 'F4' },
    { h1: [3,1], h2: [3,2], miss: [3,0], trap: 'A4', optB: 'D4', optC: 'B5', hitLabel: 'B4 ve C4', ans: 'D4' }
  ];

  const othelloBank = [
    { wCount: 6, bCount: 14, trap: 'A (Köşe A1)', optB: 'B (C4 Karesi)', optC: 'C (F5 Karesi)', ans: 'B' },
    { wCount: 5, bCount: 11, trap: 'A (H8 Köşesi)', optB: 'B (D3 Karesi)', optC: 'C (E6 Karesi)', ans: 'C' },
    { wCount: 7, bCount: 15, trap: 'A (A8 Köşesi)', optB: 'B (F4 Karesi)', optC: 'C (C6 Karesi)', ans: 'B' },
    { wCount: 4, bCount: 13, trap: 'A (H1 Köşesi)', optB: 'B (B5 Karesi)', optC: 'C (D6 Karesi)', ans: 'C' }
  ];

  const mangalaBank = [
    { pits: [4, 1, 5, 3, 2, 1], trap: 'A (1. Kuyu)', optB: 'B (3. Kuyu)', optC: 'C (6. Kuyu)', ans: 'B' },
    { pits: [3, 4, 2, 5, 1, 3], trap: 'A (2. Kuyu)', optB: 'B (4. Kuyu)', optC: 'C (5. Kuyu)', ans: 'C' },
    { pits: [5, 2, 4, 1, 3, 2], trap: 'A (1. Kuyu)', optB: 'B (3. Kuyu)', optC: 'C (4. Kuyu)', ans: 'B' },
    { pits: [2, 5, 1, 4, 3, 1], trap: 'A (2. Kuyu)', optB: 'B (6. Kuyu)', optC: 'C (4. Kuyu)', ans: 'B' }
  ];

  const gamerParadoxBank = [
    { game: 'HOI4 (Hearts of Iron IV)', startClock: '21:00', endClock: '03:45', quote: 'Saat 9’da sadece 1939’a kadar sanayi basıp derse geçeceğim dedikten 10 dakika sonra...' },
    { game: 'Valorant & CS2', startClock: '22:00', endClock: '02:50', quote: 'Win almadan uyumam, sadece tek maç atıp matematik çalışacağım dedikten sonra...' },
    { game: 'Red Dead Redemption 2', startClock: '21:30', endClock: '03:20', quote: 'Sadece 1 ana görev yapıp oyunu kaydedip çıkacağım dedikten sonra...' },
    { game: 'EA Sports FC 26', startClock: '22:30', endClock: '02:40', quote: 'Son maç söz deyip 90+4’te gol yedikten sonra 5. rövanş maçında...' }
  ];

  const modes = ['live_wordle', 'live_battleship', 'live_othello', 'live_mangala', 'gamer_paradox', 'focus_shield'];
  const chosenMode = modes[seed % modes.length];
  let sc = { dayNo, seed, mode: chosenMode };

  if (chosenMode === 'live_wordle') {
    const w = seededPick(wordleBank, seed);
    sc = {
      ...sc,
      activeTab: 1,
      wordle: w,
      badge: `6 SANİYELİK KELİME TESTİ #${dayNo}`,
      title: 'İNSANLARIN %91’İ İLK 5 SANİYEDE YANLIŞ KELİMEYİ SEÇİYOR!',
      subtitleBefore: `İlk iki tahminde ${w.g1} ve ${w.g2} denendi. A) ${w.trap}  •  B) ${w.optB}  •  C) ${w.optC}`,
      subtitleAfter: `❌ A (${w.trap}) ELENDİ! Üst satırda o harf gri yanmıştı! Geriye B ve C kaldı!`,
      questionBefore: 'Süre bitmeden dikkatli bak: Gizli kelime A mı, B mi, C mi?',
      questionAfter: `İpucu açıldı: [ ${w.hint} ] — Doğru kelime ${w.optB} mi yoksa ${w.optC} mi? Yorumlara yaz!`,
      hookFooter: 'Cevabı Kaçıncı Saniyede Gördün? Yorumlarda Kapışıyoruz 👇',
      ttsText: `İnsanların yüzde doksan biri bu kelime testinde ilk beş saniyede A seçeneğine atlayıp eleniyor! İlk iki satırdaki yeşil ve sarı harflere çok dikkatli bak. A seçeneği olan ${w.trap} diyenler elendi bile, çünkü o harf üst satırda gri yanmıştı! Şimdi geriye sadece iki ihtimal kaldı: Cevap sence ${w.optB} mi, yoksa ${w.optC} mi? Süre bitmeden bulduysan yorumlara yaz, ders molasında arkadaşınla kapışmak için profildeki sabitlenen gönderiye göz at.`
    };
  } else if (chosenMode === 'live_battleship') {
    const b = seededPick(battleshipBank, seed);
    sc = {
      ...sc,
      activeTab: 1,
      bs: b,
      badge: `RADAR OLASILIK TESTİ #${dayNo}`,
      title: 'SON TORPİDO: KRUVAZÖR HANGİ KAREDE GİZLENİYOR?',
      subtitleBefore: `${b.hitLabel} isabet aldı! Sıradaki atış: A) ${b.trap}  •  B) ${b.optB}  •  C) ${b.optC}`,
      subtitleAfter: `❌ A (${b.trap}) KARAVANA! Orada önceden su izi vardı! Geriye ${b.optB} ve ${b.optC} kaldı!`,
      questionBefore: '3 birimlik gemiyi batırmak için ilk 5 saniyede hangi kareyi vurursun?',
      questionAfter: `A seçeneği elendi! Son atış ${b.optB} karesine mi yoksa ${b.optC} karesine mi yapılmalı?`,
      hookFooter: 'Doğru Koordinatı Bulanlar Yorumda Tartışıyor 👇',
      ttsText: `Son bir torpidon kaldı ve insanların yüzde seksen dokuzu ilk beş saniyede yanlış koordinata ateş ediyor! Radarımız ${b.hitLabel} karelerinde rakip kruvazörü vurdu. A seçeneği olan ${b.trap} karesini seçenler karavana attı bile, çünkü sol tarafta su izi var! Şimdi geriye iki koordinat kaldı: Gemiyi batırmak için ${b.optB} mü vurulmalı, yoksa ${b.optC} mi? Kararını yorumlara yaz.`
    };
  } else if (chosenMode === 'live_othello') {
    const o = seededPick(othelloBank, seed);
    sc = {
      ...sc,
      activeTab: 1,
      othello: o,
      badge: `TERS KÖŞE STRATEJİ TESTİ #${dayNo}`,
      title: 'DİKKAT: BU OYUNDA EN AZ TAŞI KALAN KAZANIYOR!',
      subtitleBefore: `Klasik kuralın tam tersi! A) ${o.trap}  •  B) ${o.optB}  •  C) ${o.optC}`,
      subtitleAfter: `❌ A (${o.trap}) TUZAKTI! Köşeyi alırsan bütün satır senin rengine döner ve kaybedersin!`,
      questionBefore: 'Beyaz taş sayısını EN AZDA tutmak için hangi kareye oynamalısın?',
      questionAfter: `Köşe tuzağı elendi! En az taşla çıkmak için ${o.optB} mi yoksa ${o.optC} mi?`,
      hookFooter: 'Beyni Yakan Ters Othello Hamlesi • Cevabın Ne? 👇',
      ttsText: `Sakın klasik kurallara aldanma, çünkü bu oyunda tahtada en az taşı kalan kazanıyor! İnsanların yüzde doksan dördü alışkanlıkla A seçeneğindeki köşeye oynayıp anında kaybediyor! Köşeyi alırsan tüm satır senin rengine döner ve tuzağa düşersin. A seçeneği elendiğine göre, en az taşla çıkmak için sence B karesi mi doğru, yoksa C karesi mi? Cevabını yorumlara bırak.`
    };
  } else if (chosenMode === 'live_mangala') {
    const m = seededPick(mangalaBank, seed);
    sc = {
      ...sc,
      activeTab: 1,
      mangala: m,
      badge: `TÜRK MANGALASI ZEKA TESTİ #${dayNo}`,
      title: 'SON TAŞI HAZİNEYE DÜŞÜRÜP TEKRAR OYNAMAK İÇİN HANGİSİ?',
      subtitleBefore: `Kuyulardaki taşlara bak: A) ${m.trap}  •  B) ${m.optB}  •  C) ${m.optC}`,
      subtitleAfter: `❌ A (${m.trap}) ELENDİ! O kuyudan başlarsan son taş rakibe geçiyor!`,
      questionBefore: '5 saniye içinde hesapla: Hangi kuyu sana ekstra hamle kazandırır?',
      questionAfter: `A tuzağı elendi! Hazineye tam düşen kuyu ${m.optB} mi yoksa ${m.optC} mi?`,
      hookFooter: 'Doğru Kuyuyu Bulanlar Yorumda Kapışıyor 👇',
      ttsText: `Beş saniye içinde zihinden hesaplayabilir misin? Mangala tahtasında sırayı rakibe kaptırmadan tekrar oynamak için son taşının hazineye düşmesi gerekiyor. A seçeneğini seçenler elendi bile, çünkü o kuyuda bir taş fazla kalıyor! Geriye sadece B ve C kuyuları kaldı. Sence hangi kuyu tam hazineye düşer? Bulduysan yorumlara yaz.`
    };
  } else if (chosenMode === 'gamer_paradox') {
    const gp = seededPick(gamerParadoxBank, seed);
    sc = {
      ...sc,
      activeTab: 2,
      gamer: gp,
      badge: `OYUNCU ZAMAN ALGISI TESTİ #${dayNo}`,
      title: `${gp.game.toUpperCase()}: 'SON 1 EL' YALANI!`,
      subtitleBefore: gp.quote,
      subtitleAfter: `🚨 SAAT ${gp.endClock} OLDU! Peki süre bittiğinde Save dosyan yanmadan seni kim durduracak?`,
      questionBefore: 'Bu tabloyu daha önce yaşayanlar kendini belli etsin:',
      questionAfter: 'A) Görev Yöneticisi (Save Yanar!)  •  B) 5 Dk Önce Uyaran Kaydet-Çık Protokolü',
      hookFooter: 'Sen En Çok Hangi Oyunda Saati Unutuyorsun? Yorumlara Yaz 👇',
      ttsText: `Dürüst olalım, akşam saat dokuzda sadece bir el atıp derse geçeceğim dedikten sonra saatin bir anda gece üçe geldiğini kaç kez yaşadın? Özellikle ${gp.game} oynarken zaman algısı tamamen kayboluyor. Üstelik klasik engelleyiciler oyunu çat diye kapatıp kayıt dosyanı yakıyor. Peki süre bitmeden beş dakika önce seni uyaran ve kayıt almanı bekleyen bir sistem olsaydı? Sen en çok hangi oyunda saati unutuyorsun, yorumlara yaz.`
    };
  } else {
    sc = {
      ...sc,
      activeTab: 0,
      badge: `İRADE VE ODAK TESTİ #${dayNo}`,
      title: 'AKŞAM YORULUP HEDEFİ DÜŞÜRMEK İSTERSEN NE OLUR?',
      subtitleBefore: 'Saat 21:00 oldu, yoruldun ve günlük ders hedefini 3 saatten 1 saate indirmeye çalıştın...',
      subtitleAfter: '🧱 3 DAKİKALIK SÜRTÜNME DUVARI AÇILDI! İlk gün kendine verdiğin söz tam karşında!',
      questionBefore: 'Normal sayaçlarda tek tıkla iptal edip pes etmek sadece 2 saniye sürer.',
      questionAfter: 'Kendi sözünle yüzleşip 3 dakika beklerken: A) Pes Edersin  •  B) Utanıp Derse Dönersin!',
      hookFooter: 'Seni Masada Tutacak Sözün Ne? Yorumlara Yaz 👇',
      ttsText: `Akşam saat dokuz oldu, yoruldun ve günlük çalışma hedefini düşürüp oyuna girmek istedin. Klasik sayaçlarda tek tıkla pes etmek sadece iki saniye sürer. Ama burada hedefi düşürmeye çalıştığın anda karşısına üç dakikalık sürtünme duvarı ve ilk gün kendine verdiğin söz çıkar! O üç dakikayı beklerken insan kendi sözünden utanıp derse geri dönüyor. Peki senin kendine verdiğin söz ne? Yorumlara yaz.`
    };
  }

  fs.writeFileSync(STATE_JSON, JSON.stringify(sc, null, 2), 'utf8');
  return sc;
}

function wrapText(text, maxChars = 34) {
  const words = String(text || '').split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function renderInteractiveBoardContent(sc, stepIndex, totalSteps, trapTriggered) {
  const mode = sc.mode;

  // 1. WORDLE (4.5. Saniyede A Tuzağı Elenir ve İpucu Açılır!)
  if (mode === 'live_wordle') {
    const w = sc.wordle;
    const rowsData = [
      { letters: w.g1.split(''), colors: w.c1 },
      { letters: w.g2.split(''), colors: w.c2 },
      {
        letters: trapTriggered ? w.hint.split(' ') : ['?', '?', '?', '?', '?'],
        colors: trapTriggered ? ['#1e293b', '#22c55e', '#1e293b', '#22c55e', '#22c55e'] : ['#0f172a', '#0f172a', '#0f172a', '#0f172a', '#0f172a']
      }
    ];

    let gridXml = '';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const bg = rowsData[r].colors[c] || '#334155';
        const ch = rowsData[r].letters[c] || '?';
        gridXml += `<rect x="${225 + c * 92}" y="${155 + r * 92}" width="80" height="80" rx="12" fill="${bg}" stroke="#64748b" stroke-width="2.5"/>`;
        gridXml += `<text x="${265 + c * 92}" y="${208 + r * 92}" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="40" font-weight="bold">${escXml(ch)}</text>`;
      }
    }

    const aBg = trapTriggered ? '#7f1d1d' : '#1e293b';
    const aStroke = trapTriggered ? '#ef4444' : '#f59e0b';
    const aText = trapTriggered ? `❌ A) ${w.trap} (ELENDİ!)` : `A) ${w.trap}`;

    return `
      <g transform="translate(22, 112)">
        <rect x="20" y="30" width="856" height="620" rx="18" fill="#0b0f17" stroke="${trapTriggered ? '#ef4444' : '#eab308'}" stroke-width="2.5"/>
        <text x="448" y="85" text-anchor="middle" fill="#fbbf24" font-family="sans-serif" font-size="28" font-weight="bold">
          🔤 5 HARFLİ GİZLİ KELİMEYİ 5 SANİYEDE BUL!
        </text>
        <text x="448" y="122" text-anchor="middle" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="bold">
          Yeşil = Doğru Yerde  •  Sarı = Kelimede Var Ama Yeri Farklı  •  Gri = Yok
        </text>
        ${gridXml}

        <!-- A / B / C Seçenek Kutuları (4.5. Saniyede A Kırmızı Çarpı Alır!) -->
        <rect x="65" y="455" width="240" height="74" rx="12" fill="${aBg}" stroke="${aStroke}" stroke-width="2.5"/>
        <text x="185" y="500" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">${escXml(aText)}</text>

        <rect x="328" y="455" width="240" height="74" rx="12" fill="#112233" stroke="#38bdf8" stroke-width="2.5"/>
        <text x="448" y="500" text-anchor="middle" fill="#7dd3fc" font-family="sans-serif" font-size="22" font-weight="bold">B) ${escXml(w.optB)}</text>

        <rect x="591" y="455" width="240" height="74" rx="12" fill="#112233" stroke="#4ade80" stroke-width="2.5"/>
        <text x="711" y="500" text-anchor="middle" fill="#86efac" font-family="sans-serif" font-size="22" font-weight="bold">C) ${escXml(w.optC)}</text>

        <rect x="110" y="555" width="676" height="64" rx="12" fill="#111c2d" stroke="#f59e0b" stroke-width="2"/>
        <text x="448" y="595" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="21" font-weight="bold">
          ${trapTriggered ? `🔥 A Elendi! Cevap B (${w.optB}) mi yoksa C (${w.optC}) mi?` : '⏱ İlk 5 Saniye: A mı, B mi, C mi?'}
        </text>
      </g>
    `;
  }

  // 2. AMİRAL BATTI (4.5. Saniyede A Koordinatı Karavana Çıkar!)
  if (mode === 'live_battleship') {
    const b = sc.bs;
    let boardXml = '';
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (let c = 0; c < 8; c++) {
      boardXml += `<text x="${218 + c * 62}" y="165" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="18" font-weight="bold">${cols[c]}</text>`;
    }
    for (let r = 0; r < 6; r++) {
      boardXml += `<text x="172" y="${212 + r * 58}" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="18" font-weight="bold">${r + 1}</text>`;
      for (let c = 0; c < 8; c++) {
        const isHit = (r === b.h1[0] && c === b.h1[1]) || (r === b.h2[0] && c === b.h2[1]);
        const isTrapCell = r === b.miss[0] && c === b.miss[1];
        const bg = isHit ? '#dc2626' : (isTrapCell && trapTriggered ? '#7f1d1d' : '#091526');
        const sym = isHit ? '💥' : (isTrapCell && trapTriggered ? '❌' : (isTrapCell ? 'A?' : ''));
        boardXml += `<rect x="${190 + c * 62}" y="${178 + r * 58}" width="54" height="50" rx="6" fill="${bg}" stroke="#334155" stroke-width="1.5"/>`;
        boardXml += `<text x="${217 + c * 62}" y="${211 + r * 58}" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="21" font-weight="bold">${sym}</text>`;
      }
    }

    return `
      <g transform="translate(22, 112)">
        <rect x="20" y="30" width="856" height="620" rx="18" fill="#0b0f17" stroke="${trapTriggered ? '#ef4444' : '#eab308'}" stroke-width="2.5"/>
        <text x="448" y="85" text-anchor="middle" fill="#fbbf24" font-family="sans-serif" font-size="27" font-weight="bold">
          ⚓ RADAR TESTİ: SON TORPİDO HANGİ KAREYE?
        </text>
        <text x="448" y="122" text-anchor="middle" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="bold">
          ${escXml(b.hitLabel)} Vuruldu! 3 Birimlik Kruvazörü Batırmak İçin Seçimin Ne?
        </text>
        ${boardXml}
        <rect x="90" y="545" width="716" height="72" rx="12" fill="#111c2d" stroke="#f59e0b" stroke-width="2"/>
        <text x="448" y="590" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="22" font-weight="bold">
          ${trapTriggered ? `❌ A (${b.trap}) ELENDİ! Cevap B (${b.optB}) mi, C (${b.optC}) mi?` : `🎯 A) ${b.trap}   •   B) ${b.optB}   •   C) ${b.optC}`}
        </text>
      </g>
    `;
  }

  // 3. TERS OTHELLO (En Az Taş Kazanır — 4.5. Saniyede Köşe Tuzağı Elenir!)
  if (mode === 'live_othello') {
    const o = sc.othello;
    let gridXml = '';
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const isCornerTrap = r === 0 && c === 0;
        const isOptB = r === 2 && c === 4;
        const isOptC = r === 4 && c === 2;
        const bg = isCornerTrap && trapTriggered ? '#7f1d1d' : ((r + c) % 2 === 0 ? '#122b3d' : '#0e2230');
        gridXml += `<rect x="${240 + c * 70}" y="${150 + r * 62}" width="64" height="56" rx="6" fill="${bg}" stroke="#264b66"/>`;
        if ((r + c) % 3 === 1 && !isCornerTrap && !isOptB && !isOptC) {
          const isW = (r * c) % 2 === 0;
          gridXml += `<circle cx="${272 + c * 70}" cy="${178 + r * 62}" r="20" fill="${isW ? '#f8fafc' : '#0f172a'}" stroke="#eab308" stroke-width="2"/>`;
        }
        if (isCornerTrap) {
          gridXml += `<text x="${272 + c * 70}" y="${186 + r * 62}" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">${trapTriggered ? '❌' : 'A'}</text>`;
        } else if (isOptB) {
          gridXml += `<text x="${272 + c * 70}" y="${186 + r * 62}" text-anchor="middle" fill="#4ade80" font-family="sans-serif" font-size="24" font-weight="bold">B</text>`;
        } else if (isOptC) {
          gridXml += `<text x="${272 + c * 70}" y="${186 + r * 62}" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-size="24" font-weight="bold">C</text>`;
        }
      }
    }

    return `
      <g transform="translate(22, 112)">
        <rect x="20" y="30" width="856" height="620" rx="18" fill="#0b0f17" stroke="${trapTriggered ? '#ef4444' : '#eab308'}" stroke-width="2.5"/>
        <text x="448" y="85" text-anchor="middle" fill="#fbbf24" font-family="sans-serif" font-size="26" font-weight="bold">
          ⚪ TERS OTHELLO: EN AZ TAŞI KALAN KAZANIR!
        </text>
        <text x="448" y="122" text-anchor="middle" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="bold">
          ⚪ Beyaz: ${o.wCount} Taş  •  ⚫ Siyah: ${o.bCount} Taş  (Çok Taş Alan Kaybeder!)
        </text>
        ${gridXml}
        <rect x="80" y="545" width="736" height="72" rx="12" fill="#111c2d" stroke="#f59e0b" stroke-width="2"/>
        <text x="448" y="590" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="20" font-weight="bold">
          ${trapTriggered ? `❌ A KÖŞE TUZAĞI ELENDİ! Cevap ${o.optB} mi, ${o.optC} mi?` : `A) ${o.trap}  •  ${o.optB}  •  ${o.optC}`}
        </text>
      </g>
    `;
  }

  // 4. MANGALA (4.5. Saniyede Yanlış Kuyu Elenir!)
  if (mode === 'live_mangala') {
    const m = sc.mangala;
    let pitsXml = '';
    for (let i = 0; i < 6; i++) {
      const isTrap = i === 0 && trapTriggered;
      const bg = isTrap ? '#7f1d1d' : '#141e30';
      pitsXml += `<rect x="${135 + i * 105}" y="250" width="92" height="190" rx="18" fill="${bg}" stroke="#eab308" stroke-width="2.5"/>`;
      pitsXml += `<text x="${181 + i * 105}" y="355" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="44" font-weight="bold">${isTrap ? '❌' : m.pits[i]}</text>`;
      pitsXml += `<text x="${181 + i * 105}" y="420" text-anchor="middle" fill="#fbbf24" font-family="sans-serif" font-size="18" font-weight="bold">#${i + 1}</text>`;
    }

    return `
      <g transform="translate(22, 112)">
        <rect x="20" y="30" width="856" height="620" rx="18" fill="#0b0f17" stroke="${trapTriggered ? '#ef4444' : '#eab308'}" stroke-width="2.5"/>
        <text x="448" y="88" text-anchor="middle" fill="#fbbf24" font-family="sans-serif" font-size="26" font-weight="bold">
          🪨 MANGALA: SON TAŞ HANGİ KUYUDAN HAZİNEYE DÜŞER?
        </text>
        <text x="448" y="128" text-anchor="middle" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="bold">
          İpucu: Seçtiğin Kuyudaki İlk Taş Kendi Kuyuna Bırakılır!
        </text>
        ${pitsXml}
        <rect x="780" y="210" width="84" height="260" rx="18" fill="#122b24" stroke="#4ade80" stroke-width="2.5"/>
        <text x="822" y="345" text-anchor="middle" fill="#4ade80" font-family="sans-serif" font-size="16" font-weight="bold">HAZİNE</text>

        <rect x="80" y="535" width="736" height="72" rx="12" fill="#111c2d" stroke="#f59e0b" stroke-width="2"/>
        <text x="448" y="580" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="21" font-weight="bold">
          ${trapTriggered ? `❌ ${m.trap} ELENDİ! Cevap ${m.optB} mi yoksa ${m.optC} mi?` : `${m.trap}   •   ${m.optB}   •   ${m.optC}`}
        </text>
      </g>
    `;
  }

  // 5. OYUNCU ZAMAN ALGISI & SAVE KORUMASI
  if (mode === 'gamer_paradox') {
    const gp = sc.gamer;
    const clockStr = trapTriggered ? gp.endClock : gp.startClock;
    const clockCol = trapTriggered ? '#ef4444' : '#4ade80';

    return `
      <g transform="translate(22, 112)">
        <rect x="20" y="30" width="856" height="620" rx="18" fill="#0b0f17" stroke="${clockCol}" stroke-width="3"/>
        <text x="448" y="95" text-anchor="middle" fill="#fbbf24" font-family="sans-serif" font-size="28" font-weight="bold">
          🎮 ${escXml(gp.game.toUpperCase())}
        </text>
        <rect x="160" y="150" width="576" height="230" rx="24" fill="#090d16" stroke="${clockCol}" stroke-width="3"/>
        <text x="448" y="305" text-anchor="middle" fill="${clockCol}" font-family="monospace" font-size="115" font-weight="bold">
          ${clockStr}
        </text>
        <rect x="90" y="430" width="716" height="170" rx="16" fill="#111c2d" stroke="#38bdf8" stroke-width="2"/>
        <text x="448" y="490" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="23" font-weight="bold">
          ${trapTriggered ? '🚨 Süre Doldu! Kayıt Dosyanı Yakmadan 5 Dk Önce Uyaran' : '⏳ "Sadece 1 El Atıp Derse Geçeceğim" Dedikten Sonra'}
        </text>
        <text x="448" y="545" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="21" font-weight="bold">
          ${trapTriggered ? 'Kaydet ve Çık (Save & Exit) Protokolü Devrede!' : 'Zamanın Nasıl Geçtiğini Anlamayanlar Yorumlara 👇'}
        </text>
      </g>
    `;
  }

  // 6. AKILLI SÜRTÜNME DUVARI (3 Dakika İrade Koruması)
  const waitSec = Math.max(120, 180 - stepIndex * 2);
  const mm = String(Math.floor(waitSec / 60)).padStart(2, '0');
  const ss = String(waitSec % 60).padStart(2, '0');

  return `
    <g transform="translate(22, 112)">
      <rect x="20" y="30" width="856" height="620" rx="18" fill="#0b0f17" stroke="${trapTriggered ? '#ef4444' : '#eab308'}" stroke-width="2.5"/>
      <text x="448" y="92" text-anchor="middle" fill="#fbbf24" font-family="sans-serif" font-size="27" font-weight="bold">
        🧱 AKILLI SÜRTÜNME DUVARI (ODAK KORUMASI)
      </text>
      <rect x="95" y="135" width="706" height="145" rx="16" fill="#141d2f" stroke="#f59e0b" stroke-width="2"/>
      <text x="448" y="195" text-anchor="middle" fill="#cbd5e1" font-family="sans-serif" font-size="20">
        “Başlarken kendine verdiğin sözü hatırla:”
      </text>
      <text x="448" y="242" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="24" font-style="italic" font-weight="bold">
        “Hedefime ulaşana kadar her gün disiplini koruyacağım.”
      </text>
      <text x="448" y="415" text-anchor="middle" fill="#f87171" font-family="monospace" font-size="105" font-weight="bold">
        ${mm}:${ss}
      </text>
      <rect x="110" y="485" width="320" height="72" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
      <text x="270" y="530" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="20" font-weight="bold">
        🔒 Bekleniyor (${waitSec} sn)
      </text>
      <rect x="466" y="485" width="320" height="72" rx="12" fill="#122b24" stroke="#4ade80" stroke-width="2.5"/>
      <text x="626" y="530" text-anchor="middle" fill="#4ade80" font-family="sans-serif" font-size="21" font-weight="bold">
        🎯 Vazgeç (Sözünü Koru)
      </text>
    </g>
  `;
}

async function renderReelFrame(sc, stepIndex, totalSteps, outPath) {
  // TAM 4. SANİYEDE "TUZAK ELENDİ" KANCASI DEVREYE GİRER (5. Saniye Kaydırma Duvarını Kırar!)
  const trapTriggered = stepIndex >= 4;
  const progressRatio = (stepIndex + 1) / Math.max(1, totalSteps);
  const barWidth = Math.round(820 * progressRatio);

  const activeSub = trapTriggered ? sc.subtitleAfter : sc.subtitleBefore;
  const activeQ = trapTriggered ? sc.questionAfter : sc.questionBefore;

  const subLines = wrapText(activeSub, 36);
  const qLines = wrapText(activeQ, 34);
  const mainTabs = ['⏱ Odak & Sayaç', '🎲 Mini Oyunlar', '🛡 Uygulama Listesi', '🌐 Web Listesi', '📅 Planlama', '⚙ Ayarlar'];

  let topTabsXml = '';
  for (let idx = 0; idx < mainTabs.length; idx++) {
    const isAct = idx === sc.activeTab;
    topTabsXml += `<rect x="${16 + idx * 152}" y="52" width="144" height="42" rx="10" fill="${isAct ? '#162032' : '#0b0f17'}" stroke="${isAct ? '#94a3b8' : '#1e293b'}" stroke-width="1.5"/>`;
    topTabsXml += `<text x="${88 + idx * 152}" y="78" text-anchor="middle" fill="${isAct ? '#ffffff' : '#94a3b8'}" font-family="sans-serif" font-size="13" font-weight="bold">${escXml(mainTabs[idx])}</text>`;
  }

  const svg = `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="reel-bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#090f1a"/>
        <stop offset="50%" stop-color="#06080c"/>
        <stop offset="100%" stop-color="#040609"/>
      </linearGradient>
      <linearGradient id="hdr-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7a8aa2" />
        <stop offset="48%" stop-color="#4e5c72" />
        <stop offset="100%" stop-color="#2e3748" />
      </linearGradient>
      <linearGradient id="hdr-d" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#dce4f0" />
      </linearGradient>
      <linearGradient id="hdr-gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffe8a2" />
        <stop offset="100%" stop-color="#f2a834" />
      </linearGradient>
    </defs>

    <rect width="1080" height="1920" fill="url(#reel-bg)"/>
    <rect x="28" y="28" width="1024" height="1864" rx="32" fill="none" stroke="${trapTriggered ? '#ef4444' : '#f2a834'}" stroke-width="3" stroke-opacity="0.55"/>

    <rect x="70" y="64" width="940" height="58" rx="16" fill="#111827" stroke="${trapTriggered ? '#ef4444' : '#f2a834'}" stroke-width="2"/>
    <text x="540" y="102" text-anchor="middle" fill="#fde68a" font-family="monospace" font-size="24" font-weight="bold">
      ${trapTriggered ? '🚨 5. SANİYE: TUZAK SEÇENEK ELENDİ!' : `🧠 ${escXml(sc.badge)}`}
    </text>

    <text x="540" y="182" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="31" font-weight="bold">
      ${escXml(sc.title)}
    </text>

    <g transform="translate(70, 220)">
      <rect width="940" height="830" rx="16" fill="#070a0f" stroke="#334155" stroke-width="3"/>

      <g transform="translate(16, 10) scale(0.068)">
        <rect x="24" y="24" width="464" height="464" rx="105" fill="url(#hdr-bg)" stroke="rgba(255,255,255,0.22)" stroke-width="10" />
        <path d="M 328 332 A 120 120 0 0 1 224 376 L 184 376 A 36 36 0 0 1 148 340 L 148 172 A 36 36 0 0 1 184 136 L 224 136 A 120 120 0 0 1 328 180"
              fill="none" stroke="url(#hdr-d)" stroke-width="52" stroke-linecap="round" stroke-linejoin="round" />
        <polygon points="232,190 368,256 232,322 264,256"
                 fill="url(#hdr-gold)" stroke="url(#hdr-gold)" stroke-width="22" stroke-linejoin="round" />
      </g>
      <text x="62" y="34" fill="#ffffff" font-family="sans-serif" font-size="17" font-weight="bold">
        Canlı Mola Düellosu &amp; Odak Simülasyonu
      </text>

      <rect x="693" y="10" width="36" height="30" rx="6" fill="#111826" stroke="#334155"/>
      <text x="711" y="31" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="15">🔄</text>
      <rect x="735" y="10" width="36" height="30" rx="6" fill="#111826" stroke="#334155"/>
      <text x="753" y="31" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="15">👥</text>
      <rect x="777" y="10" width="36" height="30" rx="6" fill="#111826" stroke="#334155"/>
      <text x="795" y="31" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="15">⚔</text>
      <rect x="819" y="10" width="36" height="30" rx="6" fill="#111826" stroke="#334155"/>
      <text x="837" y="31" text-anchor="middle" fill="#fbbf24" font-family="sans-serif" font-size="15">🧭</text>
      <rect x="861" y="10" width="32" height="30" rx="6" fill="#111826" stroke="#334155"/>
      <text x="877" y="30" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="16">—</text>
      <rect x="899" y="10" width="32" height="30" rx="6" fill="#3b1219" stroke="#7f1d1d"/>
      <text x="915" y="31" text-anchor="middle" fill="#f87171" font-family="sans-serif" font-size="15">✕</text>

      ${topTabsXml}
      ${renderInteractiveBoardContent(sc, stepIndex, totalSteps, trapTriggered)}

      <line x1="0" y1="792" x2="940" y2="792" stroke="#1e293b" stroke-width="1.5"/>
      <text x="20" y="816" fill="#64748b" font-family="sans-serif" font-size="14" font-weight="bold">
        Mola Zihin Egzersizi  •  Canlı Oda &amp; Strateji Motoru
      </text>
      <text x="920" y="816" text-anchor="end" fill="#729fcf" font-family="sans-serif" font-size="14" font-weight="bold">
        ✦ DevAM Focus
      </text>
    </g>

    <!-- ALT ETKİLEŞİM KARTI (Reklam Değil, Doğrudan Soru & Tuzak Analizi) -->
    <rect x="70" y="1085" width="940" height="450" rx="24" fill="#0d1320" stroke="${trapTriggered ? '#ef4444' : '#334155'}" stroke-width="2.5"/>
    <text x="540" y="1148" text-anchor="middle" fill="${trapTriggered ? '#fca5a5' : '#cbd5e1'}" font-family="sans-serif" font-size="26" font-weight="bold">
      ${escXml(subLines[0] || '')}
    </text>
    <text x="540" y="1190" text-anchor="middle" fill="${trapTriggered ? '#fca5a5' : '#cbd5e1'}" font-family="sans-serif" font-size="26" font-weight="bold">
      ${escXml(subLines[1] || '')}
    </text>
    <text x="540" y="1232" text-anchor="middle" fill="${trapTriggered ? '#fca5a5' : '#cbd5e1'}" font-family="sans-serif" font-size="26" font-weight="bold">
      ${escXml(subLines[2] || '')}
    </text>

    <line x1="130" y1="1265" x2="950" y2="1265" stroke="#1e293b" stroke-width="3"/>

    <text x="540" y="1322" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="28" font-weight="bold">
      ${escXml(qLines[0] || '')}
    </text>
    <text x="540" y="1364" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="28" font-weight="bold">
      ${escXml(qLines[1] || '')}
    </text>
    <text x="540" y="1406" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="28" font-weight="bold">
      ${escXml(qLines[2] || '')}
    </text>

    <rect x="130" y="1460" width="820" height="22" rx="11" fill="#1e293b"/>
    <rect x="130" y="1460" width="${barWidth}" height="22" rx="11" fill="url(#hdr-gold)"/>

    <rect x="70" y="1570" width="940" height="190" rx="24" fill="#111928" stroke="#f2a834" stroke-width="2"/>
    <text x="540" y="1645" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="27" font-weight="bold">
      ${escXml(sc.hookFooter)}
    </text>
    <text x="540" y="1712" text-anchor="middle" fill="#82e6b0" font-family="sans-serif" font-size="24" font-weight="bold">
      📌 Arkadaşınla Canlı Oynamak İçin Profildeki Sabit Gönderiye Bak
    </text>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outPath);
}

function generateOceanBrownNoiseWav(filePath, durationSec = 28) {
  const sampleRate = 44100;
  const numSamples = sampleRate * durationSec;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  let brown = 0.0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const white = Math.random() * 2 - 1;
    brown = (brown + 0.02 * white) / 1.02;
    const swell = 0.45 + 0.55 * Math.sin((2 * Math.PI * i) / (sampleRate * 5.0));
    let sample = brown * 1.4 * swell;

    // 4.0 - 4.35 sn: 5. Saniye Kaydırma Kırıcı Uyarı Frekansı
    if (t >= 4.0 && t <= 4.35) {
      sample += Math.sin(2 * Math.PI * 587.33 * t) * 0.25;
    }

    sample = Math.max(-0.85, Math.min(0.85, sample));
    buffer.writeInt16LE(Math.floor(sample * 8500), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

(async () => {
  const mode = process.argv[2] || 'all';
  const rawSec = parseInt(process.argv[3] || '24', 10);
  const targetDurationSec = isNaN(rawSec) ? 24 : Math.max(16, Math.min(40, rawSec));
  const sc = buildUniqueScenario(mode === 'init');

  fs.writeFileSync(path.join(OUT_DIR, 'tts.txt'), sc.ttsText, 'utf8');
  fs.writeFileSync(
    path.join(OUT_DIR, 'caption.txt'),
    `🧠 ${sc.title}\n\n${sc.subtitleBefore}\n${sc.questionAfter}\n\n💬 ${sc.hookFooter}\n📌 Ücretsiz PC Odak & Mola Düellosu aracı profildeki sabitlenen gönderide!`,
    'utf8'
  );

  if (mode === 'init') {
    console.log('Yeni nesil sifir-reklam kokulu senaryo hazirlandi:', sc.mode);
    return;
  }

  for (let i = 0; i < targetDurationSec; i++) {
    const frameName = `frame_${String(i).padStart(2, '0')}.png`;
    await renderReelFrame(sc, i, targetDurationSec, path.join(OUT_DIR, frameName));
  }

  generateOceanBrownNoiseWav(path.join(OUT_DIR, 'ocean_bg.wav'), targetDurationSec + 3);
  console.log(`${targetDurationSec} saniyelik 5. saniye kancali kareler uretildi!`);
})();
