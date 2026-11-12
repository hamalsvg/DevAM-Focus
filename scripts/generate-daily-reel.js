const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT_DIR = path.join(process.cwd(), 'reel_build');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function escXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getDailyReelScenario() {
  const dayNo = Math.floor((Date.now() - new Date('2026-01-01').getTime()) / 86400000);
  const scenarios = [
    {
      activeTab: 0,
      badge: `ODAK VE SAYAÇ SİSTEMİ #${dayNo}`,
      title: 'POMODORO VE DONANMA DİSİPLİNİ',
      subtitle: 'Günlük ders hedefini ve çalışma günlerini seç, her döngüde altın kazanarak gemini geliştir.',
      question: 'Hedefi 5 kez aksatırsan (5/5 Alabanda) oyun hakların otomatik kilitlenir!',
      hookFooter: 'Ücretsiz Masaüstü Odak Yöneticisi • Sıfır FPS Kaybı',
      ttsText: `Klasik kronometreler sıkıcıdır. DevAM Focus'ta günlük ders hedefini ve çalışma günlerini seçerek işe başlarsın. Tamamladığın her otuz dakikalık odak döngüsü sana altın kazandırır ve tersanede gemini geliştirirsin. Ama dikkat et, günlük hedefini beş kez aksatırsan denizde fırtına çıkar ve oyun hakların otomatik olarak kilitlenir. Ücretsiz indirmek için devamfocus nokta netlify nokta app adresine gir.`
    },
    {
      activeTab: 1,
      badge: `ZİHİN AÇAN MOLA OYUNLARI #${dayNo}`,
      title: '5 STRATEJİ OYUNU VE MOLA DÜELLOSU',
      subtitle: 'Molada sosyal medya bataklığına düşme: Satranç, Mangala, Ters Othello, Wordle ve Amiral Battı.',
      question: '10 dakikalık molanda yapay zekaya veya arkadaşına karşı hamleni yap!',
      hookFooter: 'Molada Odağını Koru • Arkadaşınla Düello Yap',
      ttsText: `Ders arasındaki on dakikalık molada telefonunu eline alıp sosyal medya akışında kaybolma. DevAM Focus içindeki Mini Oyunlar sekmesinde Satranç, Mangala, Ters Othello, Wordle ve Amiral Battı seni bekliyor. İster yapay zeka strateji motoruna karşı oyna, ister tek tıkla arkadaşına düello davet linki gönder. Ücretsiz masaüstü uygulamasını hemen dene.`
    },
    {
      activeTab: 2,
      badge: `AKILLI OYUN KİLİDİ #${dayNo}`,
      title: 'KAYIT YAKMAYAN UYGULAMA LİSTESİ',
      subtitle: 'Bilgisayarındaki oyunları otomatik tarar; Steam veya Launcher açıkken süreni harcamaz.',
      question: 'Süren bitmeden 5 dk önce uyarır ve güvenli Kaydet-Çık geri sayımı açar!',
      hookFooter: 'Oyun Ortasında Çat Diye Kapatıp Save Dosyanı Yakmaz',
      ttsText: `Oyun süren bittiğinde oyunu aniden kapatıp kayıt dosyanı yakan programları unut. DevAM Focus bilgisayarındaki oyunları otomatik bulur; Steam veya Epic Games arka planda açıkken süreni yemez. Günlük oyun limitin dolduğunda sana beş dakika önceden haber verir ve güvenli kaydet çık süresi tanır. Disiplini sağlamak için devamfocus nokta netlify nokta app adresinden ücretsiz indir.`
    },
    {
      activeTab: 3,
      badge: `WEB VE SOSYAL MEDYA KALKANI #${dayNo}`,
      title: 'SAAT VE SÜRE BAZLI WEB FİLTRESİ',
      subtitle: 'YouTube, Instagram, X ve TikTok gibi siteleri çalışma saatlerinde otomatik kapatır.',
      question: 'Saat 18:00’e kadar kapalı tut, sonrasında yalnızca günlük süre hakkın kadar kullan!',
      hookFooter: 'Ak Liste ile Eğitim Siteleri Her Zaman Açık Kalır',
      ttsText: `Bilgisayarda ders çalışırken elin sürekli YouTube, Instagram veya X sekmesine mi gidiyor? DevAM Focus Web Listesi ile dikkat dağıtan siteleri çalışma saatlerin boyunca tamamen kapatabilir veya günlük süre sınırı koyabilirsin. Üstelik Wikipedia ve GitHub gibi eğitim siteleri Ak Liste sayesinde her zaman açık kalır.`
    },
    {
      activeTab: 4,
      badge: `HAFTALIK PLANLAMA TABLOSU #${dayNo}`,
      title: 'YARIMŞAR SAATLİK DİSİPLİN ROTASI',
      subtitle: 'Pazartesiden Pazara tüm haftanı Ders, Spor, Dil, Okuma ve Proje bloklarıyla renklendir.',
      question: 'Hangi saatte ne çalışacağını bilmek erteleme alışkanlığını tamamen bitirir!',
      hookFooter: 'Kendi Haftalık Programını 2 Dakikada Oluştur',
      ttsText: `Masa başına oturduğunda ne çalışacağını düşünmekten vakit kaybetme. DevAM Focus içindeki Haftalık Planlama Tablosu ile Pazartesiden Pazara tüm haftanı otuzar dakikalık dilimler halinde planlayabilirsin. Ders, spor, yabancı dil, okuma ve proje bloklarını tek tıkla yerleştir, kendi programına sadık kal.`
    }
  ];

  return { dayNo, ...scenarios[dayNo % scenarios.length] };
}

function wrapText(text, maxChars = 40) {
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

function renderRealAppContent(activeTab, stepIndex, totalSteps) {
  const shipY = Math.round(Math.sin((stepIndex / Math.max(1, totalSteps)) * Math.PI * 4) * 5);

  if (activeTab === 0) {
    const secLeft = Math.max(0, 59 - (stepIndex % 60));
    const timerStr = `29:${String(secLeft).padStart(2, '0')}`;
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    let dayBtns = '';
    for (let i = 0; i < days.length; i++) {
      dayBtns += `<rect x="${20 + i * 58}" y="74" width="52" height="38" rx="8" fill="${i < 6 ? '#3b485e' : '#161f30'}" stroke="#64748b" stroke-width="1.5"/>`;
      dayBtns += `<text x="${46 + i * 58}" y="99" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">${days[i]}</text>`;
    }

    return `
      <g transform="translate(22, 108)">
        <rect width="896" height="240" rx="12" fill="#091526" stroke="#26354d" stroke-width="2"/>
        <rect x="14" y="12" width="550" height="36" rx="8" fill="#0a101b" stroke="#41c387" stroke-width="1.5"/>
        <text x="28" y="36" fill="#ebf2ff" font-family="sans-serif" font-size="16" font-style="italic" font-weight="bold">
          🎯 HEDEF: “Hedefime ulaşana kadar her gün disiplini koruyacağım.”
        </text>
        <rect x="616" y="12" width="266" height="36" rx="8" fill="#0e1420" stroke="#ebc35f" stroke-width="1.5"/>
        <text x="749" y="36" text-anchor="middle" fill="#fadc78" font-family="sans-serif" font-size="16" font-weight="bold">
          🪙 240 Altın  •  ⚓ Tersane (Sv.28/50)
        </text>

        <path d="M 0,155 Q 224,138 448,155 T 896,152 L 896,240 L 0,240 Z" fill="#0d2238"/>
        <path d="M 0,180 Q 224,165 448,180 T 896,178 L 896,240 L 0,240 Z" fill="#091829"/>
        <g transform="translate(430, ${52 + shipY}) scale(1.65)">
          <line x1="65" y1="68" x2="57" y2="42" stroke="#b9c4d6" stroke-width="1.8" />
          <polygon points="57,42 35,46 38,57 60,53" fill="#dc2626" stroke="#f8fafc" stroke-width="1.2" />
          <polygon points="118,46 123,24 134,24 138,46" fill="#7c8798" />
          <circle cx="128.5" cy="19" r="5.5" fill="#e2e8f0" />
          <polygon points="94,65 104,44 156,44 166,65" fill="#7c8798" />
          <rect x="131" y="50" width="18" height="6" fill="#22c5f0" />
          <polygon points="48,66 218,59 202,78 58,78" fill="#5b6677" stroke="#9aa7b8" stroke-width="1.2" />
          <polygon points="58,75 205,71 196,83 66,83" fill="#3a4454" />
        </g>

        <rect x="14" y="192" width="430" height="36" rx="8" fill="#0a0f18" stroke="#41c387" stroke-width="1.5"/>
        <text x="28" y="216" fill="#7debaf" font-family="sans-serif" font-size="16" font-weight="bold">
          ⚓ 0/5  •  NETA — Sular Sakin, Rota Neta
        </text>
        <rect x="520" y="192" width="362" height="36" rx="8" fill="#0a0f18" stroke="#5f7da5" stroke-width="1.5"/>
        <text x="701" y="216" text-anchor="middle" fill="#c3d7f5" font-family="sans-serif" font-size="15" font-weight="bold">
          🛡 %15 Kalkan  •  ⚔ +25dk Oyun  •  📡 65🪙 (%20 2x)
        </text>
      </g>

      <g transform="translate(22, 364)">
        <rect width="438" height="410" rx="12" fill="#0b0f17" stroke="#1e293b" stroke-width="2"/>
        <text x="20" y="34" fill="#e2e8f0" font-family="sans-serif" font-size="17" font-weight="bold">
          ⏱ Pomodoro, Uzun Mola ve Otomatik Döngü
        </text>
        <rect x="20" y="48" width="398" height="34" rx="6" fill="#101826"/>
        <text x="219" y="71" text-anchor="middle" fill="#f5cd70" font-family="sans-serif" font-size="16" font-weight="bold">
          🎯 ÇALIŞMA SÜRESİ (30 DK)  •  DÖNGÜ 3/8
        </text>
        <text x="219" y="165" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="82" font-weight="bold">
          ${timerStr}
        </text>
        <text x="24" y="218" fill="#cbd5e1" font-family="sans-serif" font-size="16">📐 Çalışma (Dk):  [ 30 ]     ☕ Kısa Mola (Dk):  [ 10 ]</text>
        <text x="24" y="254" fill="#cbd5e1" font-family="sans-serif" font-size="16">🔄 Döngü Sayısı:  [ 8 ]      ⚓ Uzun Mola (Dk):  [ 150 ]</text>
        <text x="24" y="294" fill="#93c5fd" font-family="sans-serif" font-size="15" font-weight="bold">☑ Günlük hedef bitene kadar döngüyü otomatik sürdür</text>
        <text x="24" y="324" fill="#4ade80" font-family="sans-serif" font-size="15" font-weight="bold">📊 Döngü: 3  •  Her 8 Döngüde: 150 dk (2,5 sa) Uzun Mola</text>

        <rect x="20" y="344" width="265" height="50" rx="10" fill="#111c2d" stroke="#334155" stroke-width="1.5"/>
        <text x="152" y="376" text-anchor="middle" fill="#4ade80" font-family="sans-serif" font-size="20" font-weight="bold">▶ Çalışmayı Başlat</text>
        <rect x="298" y="344" width="120" height="50" rx="10" fill="#111c2d" stroke="#334155" stroke-width="1.5"/>
        <text x="358" y="376" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="18" font-weight="bold">🔄 Sıfırla</text>
      </g>

      <g transform="translate(476, 364)">
        <rect width="442" height="410" rx="12" fill="#0b0f17" stroke="#1e293b" stroke-width="2"/>
        <text x="20" y="34" fill="#e2e8f0" font-family="sans-serif" font-size="17" font-weight="bold">
          📅 Ders Günleri ve Oyun Sıklığı
        </text>
        <text x="20" y="62" fill="#cbd5e1" font-family="sans-serif" font-size="15">📐 Ders Çalışılacak Günler (Dokunarak Aç/Kapat):</text>
        ${dayBtns}
        <text x="20" y="142" fill="#cbd5e1" font-family="sans-serif" font-size="15">🎮 Oyun Hakkı Sıklığı:  [ Gün Aşırı (İki Günde Bir Oyun) ]</text>
        <text x="20" y="182" fill="#cbd5e1" font-family="sans-serif" font-size="16">📐 Günlük Ders Hedefi:   [ 3 ] Saat   [ 0 ] Dk</text>
        <text x="20" y="218" fill="#cbd5e1" font-family="sans-serif" font-size="16">🎮 Günlük Oyun Limiti:   [ 2 ] Saat   [ 0 ] Dk</text>
        <text x="20" y="256" fill="#93c5fd" font-family="sans-serif" font-size="15" font-weight="bold">☑ Artan oyun hakkını ertesi güne devret</text>
        <text x="20" y="288" fill="#4ade80" font-family="sans-serif" font-size="16" font-weight="bold">📐 Bugün Çalışılan: 150 dk / Hedef: 180 dk  •  🪙 240 Altın</text>
        <text x="20" y="316" fill="#fbbf24" font-family="sans-serif" font-size="15" font-weight="bold">🎮 Bugün Oyun Süresi: 35 dk / Limit: 120 dk (Launcher Hariç)</text>
        <rect x="20" y="336" width="402" height="56" rx="8" fill="#0d1522" stroke="#1e293b"/>
        <text x="221" y="370" text-anchor="middle" fill="#7debaf" font-family="sans-serif" font-size="16" font-weight="bold">
          ⚓ 0/5  •  NETA — Sular Sakin, Rota Neta
        </text>
      </g>
    `;
  }

  if (activeTab === 1) {
    const games = ['♟ Satranç', '🏆 Mangala', '⚪ Ters Othello', '🔤 Wordle', '⚓ Amiral Battı'];
    let gTabs = '';
    for (let i = 0; i < games.length; i++) {
      gTabs += `<rect x="${i * 180}" y="0" width="170" height="40" rx="8" fill="${i === 0 ? '#1e293b' : '#0b0f17'}" stroke="${i === 0 ? '#94a3b8' : '#1e293b'}" stroke-width="1.5"/>`;
      gTabs += `<text x="${i * 180 + 85}" y="26" text-anchor="middle" fill="${i === 0 ? '#ffffff' : '#94a3b8'}" font-family="sans-serif" font-size="16" font-weight="bold">${games[i]}</text>`;
    }
    return `
      <g transform="translate(22, 112)">
        ${gTabs}
        <rect x="30" y="64" width="836" height="580" rx="16" fill="#0b0f17" stroke="#b59449" stroke-width="2"/>
        <circle cx="145" cy="185" r="68" fill="#090d14" stroke="#eab308" stroke-width="2.5"/>
        <text x="145" y="210" text-anchor="middle" fill="#eab308" font-family="sans-serif" font-size="76">♚</text>

        <text x="245" y="140" fill="#fbbf24" font-family="sans-serif" font-size="34" font-weight="bold">♟ SATRANÇ VE ONLINE DÜELLO</text>
        <text x="245" y="176" fill="#34d399" font-family="sans-serif" font-size="18" font-style="italic" font-weight="bold">
          ⚙ Yapay Zeka Strateji Motoru ve Canlı Arkadaşla Düello Modu
        </text>
        <text x="245" y="214" fill="#cbd5e1" font-family="sans-serif" font-size="17">• Klasik Satranç Taşları veya Denizci Donanma Taşları ile oynanabilir.</text>
        <text x="245" y="244" fill="#cbd5e1" font-family="sans-serif" font-size="17">• Molada yapay zekaya karşı veya tek linkle arkadaşına karşı canlı oyna.</text>

        <rect x="75" y="280" width="746" height="215" rx="12" fill="#0e131d" stroke="#1e293b" stroke-width="1.5"/>
        <text x="98" y="312" fill="#e2e8f0" font-family="sans-serif" font-size="17" font-weight="bold">⚙ Oyun Öncesi Ayarlar (Mod, Süre ve Zorluk)</text>
        <text x="98" y="352" fill="#cbd5e1" font-family="sans-serif" font-size="17">🌐 Rakip / Oyun Modu:                  [ Arkadaşla Online Düello / Yapay Zeka ]</text>
        <text x="98" y="392" fill="#cbd5e1" font-family="sans-serif" font-size="17">⏱ Oyun Süre Modu:                        [ 5 Dakika Hızlı Mola Düellosu ]</text>
        <text x="98" y="432" fill="#cbd5e1" font-family="sans-serif" font-size="17">🎖 Zorluk Derecesi:                         [ Zor — Taktik Motoru (Seviye 3) ]</text>
        <text x="98" y="472" fill="#cbd5e1" font-family="sans-serif" font-size="17">♟ Başlangıç Taş Görünümü:         [ Denizci Donanma Taşları (⚓ 🚢 ⚔) ]</text>

        <rect x="238" y="518" width="420" height="58" rx="12" fill="#111c2d" stroke="#334155" stroke-width="2"/>
        <text x="448" y="555" text-anchor="middle" fill="#4ade80" font-family="sans-serif" font-size="22" font-weight="bold">▶ OYUNU BAŞLAT</text>
      </g>
    `;
  }

  if (activeTab === 2) {
    const sampleApps = [
      ['Counter-Strike 2 (cs2.exe)', 'Oyun (Kara Liste)', false],
      ['Valorant (VALORANT-Win64)', 'Oyun (Kara Liste)', false],
      ['League of Legends (LeagueClient)', 'Oyun (Kara Liste)', false],
      ['Hearts of Iron IV (hoi4.exe)', 'Oyun (Kara Liste)', false],
      ['Red Dead Redemption 2 (RDR2)', 'Oyun (Kara Liste)', false],
      ['EA Sports FC 26 (FC26.exe)', 'Oyun (Kara Liste)', false],
      ['Cyberpunk 2077 (Cyberpunk2077)', 'Oyun (Kara Liste)', false],
      ['Visual Studio Code (Code.exe)', 'Ak Liste (Serbest)', true]
    ];
    let rows = '';
    for (let i = 0; i < sampleApps.length; i++) {
      const app = sampleApps[i];
      const isWhite = app[2];
      rows += `<rect x="10" y="${94 + i * 56}" width="876" height="48" rx="6" fill="#0b0f17" stroke="#1e293b" stroke-width="1"/>`;
      rows += `<text x="24" y="${124 + i * 56}" fill="${isWhite ? '#60a5fa' : '#f87171'}" font-family="sans-serif" font-size="16" font-weight="bold">☑ ${isWhite ? 'Ak Liste' : 'Kara Liste'}</text>`;
      rows += `<text x="190" y="${124 + i * 56}" fill="#f1f5f9" font-family="sans-serif" font-size="17" font-weight="bold">${escXml(app[0])}</text>`;
      rows += `<rect x="600" y="${101 + i * 56}" width="260" height="34" rx="6" fill="#101826" stroke="#334155"/>`;
      rows += `<text x="618" y="${124 + i * 56}" fill="${isWhite ? '#60a5fa' : '#f87171'}" font-family="sans-serif" font-size="15" font-weight="bold">${escXml(app[1])}</text>`;
    }
    return `
      <g transform="translate(22, 112)">
        <text x="12" y="32" fill="#cbd5e1" font-family="sans-serif" font-size="18" font-weight="bold">Kategori Filtresi:   [ Tümü ]</text>
        <rect x="460" y="4" width="430" height="42" rx="8" fill="#111826" stroke="#334155" stroke-width="1.5"/>
        <text x="675" y="31" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="17" font-weight="bold">🔍 Bilgisayarı Tara (Oyunları Otomatik Bul)</text>
        <text x="20" y="78" fill="#94a3b8" font-family="sans-serif" font-size="16" font-weight="bold">Durum</text>
        <text x="190" y="78" fill="#94a3b8" font-family="sans-serif" font-size="16" font-weight="bold">Uygulama Adı (İşlem)</text>
        <text x="610" y="78" fill="#94a3b8" font-family="sans-serif" font-size="16" font-weight="bold">Tür / Liste (Tıkla Değiştir)</text>
        ${rows}
        <rect x="10" y="560" width="270" height="52" rx="10" fill="#111826" stroke="#334155" stroke-width="1.5"/>
        <text x="145" y="592" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="17" font-weight="bold">+ .Exe Dosyası Ekle</text>
        <rect x="300" y="560" width="586" height="52" rx="10" fill="#111826" stroke="#334155" stroke-width="1.5"/>
        <text x="593" y="592" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="17" font-weight="bold">Uygulama Kara / Ak Listesini Kaydet</text>
      </g>
    `;
  }

  if (activeTab === 3) {
    const sites = [
      ['youtube.com', 'Kara Liste (Engellenir)', false],
      ['instagram.com', 'Kara Liste (Engellenir)', false],
      ['x.com', 'Kara Liste (Engellenir)', false],
      ['twitch.tv', 'Kara Liste (Engellenir)', false],
      ['reddit.com', 'Kara Liste (Engellenir)', false],
      ['tiktok.com', 'Kara Liste (Engellenir)', false],
      ['wikipedia.org', 'Ak Liste (Her Zaman Açık)', true],
      ['github.com', 'Ak Liste (Her Zaman Açık)', true]
    ];
    let rows = '';
    for (let i = 0; i < sites.length; i++) {
      const s = sites[i];
      rows += `<rect x="10" y="${150 + i * 54}" width="876" height="46" rx="6" fill="#0b0f17" stroke="#1e293b"/>`;
      rows += `<text x="24" y="${179 + i * 54}" fill="${s[2] ? '#60a5fa' : '#f87171'}" font-family="sans-serif" font-size="16" font-weight="bold">☑ Aktif</text>`;
      rows += `<text x="190" y="${179 + i * 54}" fill="#ffffff" font-family="sans-serif" font-size="17" font-weight="bold">${escXml(s[0])}</text>`;
      rows += `<rect x="585" y="${156 + i * 54}" width="280" height="34" rx="6" fill="#101826" stroke="#334155"/>`;
      rows += `<text x="605" y="${179 + i * 54}" fill="${s[2] ? '#60a5fa' : '#f87171'}" font-family="sans-serif" font-size="15" font-weight="bold">${escXml(s[1])}</text>`;
    }
    return `
      <g transform="translate(22, 112)">
        <rect x="10" y="0" width="876" height="130" rx="10" fill="#0b0f17" stroke="#1e293b" stroke-width="1.5"/>
        <text x="28" y="30" fill="#e2e8f0" font-family="sans-serif" font-size="17" font-weight="bold">🌐 Web ve Sosyal Medya Engelleme Kuralı (Günlük Süre Limiti veya Saat Kuralı)</text>
        <text x="28" y="64" fill="#cbd5e1" font-family="sans-serif" font-size="16">Çalışma Modu:   [ Saat Kuralı + Günlük Süre Hakkı (Saat 18:00 Sonrası 120 Dk) ]</text>
        <text x="28" y="104" fill="#f87171" font-family="sans-serif" font-size="16" font-weight="bold">🌐 Bugün Kullanılan Web: 0 dk / Limit: 120 dk   •   Durum: Saat 18:00 Sonrası Açık</text>
        ${rows}
      </g>
    `;
  }

  const blocks = ['📐 Ders', '🏋 Spor', '🔤 Dil', '📖 Okuma', '💻 Proje', '☕ Mola'];
  let bBtns = '';
  for (let i = 0; i < blocks.length; i++) {
    bBtns += `<rect x="${28 + i * 140}" y="54" width="128" height="42" rx="8" fill="#141d2e" stroke="#334155" stroke-width="1.5"/>`;
    bBtns += `<text x="${92 + i * 140}" y="81" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">${blocks[i]}</text>`;
  }

  const cols = ['⏱ Saat', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  let colHdrs = '';
  for (let i = 0; i < cols.length; i++) {
    colHdrs += `<rect x="${10 + i * 125}" y="132" width="120" height="42" rx="6" fill="#111826" stroke="${i === 4 ? '#f5cd70' : '#26354d'}" stroke-width="1.5"/>`;
    colHdrs += `<text x="${70 + i * 125}" y="159" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">${cols[i]}</text>`;
  }

  const slots = ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00', '11:00 - 11:30', '11:30 - 12:00'];
  let gridRows = '';
  for (let r = 0; r < slots.length; r++) {
    gridRows += `<rect x="10" y="${184 + r * 54}" width="120" height="46" rx="6" fill="#0d131f" stroke="#1e293b"/>`;
    gridRows += `<text x="70" y="${213 + r * 54}" text-anchor="middle" fill="#cbd5e1" font-family="monospace" font-size="13" font-weight="bold">${slots[r]}</text>`;
    for (let c = 1; c <= 6; c++) {
      const isStudy = (r + c) % 3 === 0;
      const isProj = (r + c) % 4 === 0;
      const bg = isStudy ? '#122b24' : (isProj ? '#17253b' : '#0b0f17');
      const txt = isStudy ? '📐 Ders' : (isProj ? '💻 Proje' : '📖 Okuma');
      const col = isStudy ? '#4ade80' : (isProj ? '#60a5fa' : '#94a3b8');
      gridRows += `<rect x="${10 + c * 125}" y="${184 + r * 54}" width="120" height="46" rx="6" fill="${bg}" stroke="#1e293b"/>`;
      gridRows += `<text x="${70 + c * 125}" y="${213 + r * 54}" text-anchor="middle" fill="${col}" font-family="sans-serif" font-size="14" font-weight="bold">${txt}</text>`;
    }
  }

  return `
    <g transform="translate(22, 112)">
      <rect x="10" y="0" width="876" height="115" rx="10" fill="#0b0f17" stroke="#1e293b" stroke-width="1.5"/>
      <text x="28" y="30" fill="#e2e8f0" font-family="sans-serif" font-size="17" font-weight="bold">📅 Haftalık Planlama Tablosu (Hücreleri Seç, Yaz, Rengi ve Emojiyi Ata)</text>
      ${bBtns}
      ${colHdrs}
      ${gridRows}
    </g>
  `;
}

async function renderReelFrame(sc, stepIndex, totalSteps, outPath) {
  const progressRatio = (stepIndex + 1) / Math.max(1, totalSteps);
  const barWidth = Math.round(820 * progressRatio);

  const subLines = wrapText(sc.subtitle, 42);
  const qLines = wrapText(sc.question, 38);
  const mainTabs = ['⏱ Odak ve Sayaç', '🎲 Mini Oyunlar', '🛡 Uygulama Listesi', '🌐 Web Listesi', '📅 Planlama', '⚙ Ayarlar'];

  let topTabsXml = '';
  for (let idx = 0; idx < mainTabs.length; idx++) {
    const isAct = idx === sc.activeTab;
    topTabsXml += `<rect x="${16 + idx * 152}" y="52" width="144" height="42" rx="10" fill="${isAct ? '#162032' : '#0b0f17'}" stroke="${isAct ? '#94a3b8' : '#1e293b'}" stroke-width="1.5"/>`;
    topTabsXml += `<text x="${88 + idx * 152}" y="79" text-anchor="middle" fill="${isAct ? '#ffffff' : '#94a3b8'}" font-family="sans-serif" font-size="14" font-weight="bold">${escXml(mainTabs[idx])}</text>`;
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
    <rect x="28" y="28" width="1024" height="1864" rx="32" fill="none" stroke="#f2a834" stroke-width="2.5" stroke-opacity="0.4"/>

    <rect x="70" y="70" width="940" height="58" rx="16" fill="#111827" stroke="#f2a834" stroke-width="2"/>
    <text x="540" y="108" text-anchor="middle" fill="#fde68a" font-family="monospace" font-size="25" font-weight="bold">
      ⚓ ${escXml(sc.badge)}
    </text>

    <text x="540" y="190" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="40" font-weight="bold">
      ${escXml(sc.title)}
    </text>

    <g transform="translate(70, 230)">
      <rect width="940" height="830" rx="16" fill="#070a0f" stroke="#334155" stroke-width="3"/>

      <g transform="translate(16, 10) scale(0.068)">
        <rect x="24" y="24" width="464" height="464" rx="105" fill="url(#hdr-bg)" stroke="rgba(255,255,255,0.22)" stroke-width="10" />
        <path d="M 328 332 A 120 120 0 0 1 224 376 L 184 376 A 36 36 0 0 1 148 340 L 148 172 A 36 36 0 0 1 184 136 L 224 136 A 120 120 0 0 1 328 180"
              fill="none" stroke="url(#hdr-d)" stroke-width="52" stroke-linecap="round" stroke-linejoin="round" />
        <polygon points="232,190 368,256 232,322 264,256"
                 fill="url(#hdr-gold)" stroke="url(#hdr-gold)" stroke-width="22" stroke-linejoin="round" />
      </g>
      <text x="62" y="34" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">
        DevAM Focus — Odak ve Planlama Yöneticisi
      </text>

      <rect x="735" y="10" width="36" height="30" rx="6" fill="#111826" stroke="#334155"/>
      <text x="753" y="31" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="15">📋</text>
      <rect x="777" y="10" width="36" height="30" rx="6" fill="#111826" stroke="#334155"/>
      <text x="795" y="31" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="15">⚔</text>
      <rect x="819" y="10" width="36" height="30" rx="6" fill="#111826" stroke="#334155"/>
      <text x="837" y="31" text-anchor="middle" fill="#fbbf24" font-family="sans-serif" font-size="15">🧭</text>
      <rect x="861" y="10" width="32" height="30" rx="6" fill="#111826" stroke="#334155"/>
      <text x="877" y="30" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="16">—</text>
      <rect x="899" y="10" width="32" height="30" rx="6" fill="#3b1219" stroke="#7f1d1d"/>
      <text x="915" y="31" text-anchor="middle" fill="#f87171" font-family="sans-serif" font-size="15">✕</text>

      ${topTabsXml}
      ${renderRealAppContent(sc.activeTab, stepIndex, totalSteps)}

      <line x1="0" y1="792" x2="940" y2="792" stroke="#1e293b" stroke-width="1.5"/>
      <text x="20" y="816" fill="#64748b" font-family="sans-serif" font-size="14" font-weight="bold">
        DevAM Focus  •  Minimalist Odak ve Planlama Sistemi
      </text>
      <text x="920" y="816" text-anchor="end" fill="#729fcf" font-family="sans-serif" font-size="14" font-weight="bold">
        ✦ Designed by Hamal
      </text>
    </g>

    <rect x="70" y="1100" width="940" height="430" rx="24" fill="#0d1320" stroke="#334155" stroke-width="2.5"/>
    <text x="540" y="1175" text-anchor="middle" fill="#cbd5e1" font-family="sans-serif" font-size="30" font-weight="600">
      ${escXml(subLines[0] || '')}
    </text>
    <text x="540" y="1220" text-anchor="middle" fill="#cbd5e1" font-family="sans-serif" font-size="30" font-weight="600">
      ${escXml(subLines[1] || '')}
    </text>

    <line x1="130" y1="1265" x2="950" y2="1265" stroke="#1e293b" stroke-width="3"/>

    <text x="540" y="1335" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="32" font-weight="bold">
      ${escXml(qLines[0] || '')}
    </text>
    <text x="540" y="1385" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="32" font-weight="bold">
      ${escXml(qLines[1] || '')}
    </text>

    <rect x="130" y="1450" width="820" height="22" rx="11" fill="#1e293b"/>
    <rect x="130" y="1450" width="${barWidth}" height="22" rx="11" fill="url(#hdr-gold)"/>

    <rect x="70" y="1570" width="940" height="190" rx="24" fill="#111928" stroke="#f2a834" stroke-width="2"/>
    <text x="540" y="1640" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="30" font-weight="bold">
      ${escXml(sc.hookFooter)}
    </text>
    <text x="540" y="1710" text-anchor="middle" fill="#60a5fa" font-family="monospace" font-size="34" font-weight="bold">
      devamfocus.netlify.app
    </text>

    <text x="540" y="1835" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="23" font-weight="600">
      Windows 10 &amp; 11 • %100 Ücretsiz • ✦ Designed by Hamal
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
    const white = Math.random() * 2 - 1;
    brown = (brown + 0.02 * white) / 1.02;
    const swell = 0.45 + 0.55 * Math.sin((2 * Math.PI * i) / (sampleRate * 5.0));
    const sample = Math.max(-0.8, Math.min(0.8, brown * 1.6 * swell));
    buffer.writeInt16LE(Math.floor(sample * 8500), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

(async () => {
  const mode = process.argv[2] || 'all';
  const rawSec = parseInt(process.argv[3] || '26', 10);
  const targetDurationSec = isNaN(rawSec) ? 26 : Math.max(20, Math.min(45, rawSec));
  const sc = getDailyReelScenario();

  fs.writeFileSync(path.join(OUT_DIR, 'tts.txt'), sc.ttsText, 'utf8');
  fs.writeFileSync(
    path.join(OUT_DIR, 'caption.txt'),
    `⚓ ${sc.badge} — ${sc.title}\n\n${sc.subtitle}\n${sc.question}\n\n🔗 Ücretsiz İndir & Mola Düellosu: https://devamfocus.netlify.app`,
    'utf8'
  );

  if (mode === 'init') {
    console.log('Metin dosyalari hazirlandi.');
    return;
  }

  for (let i = 0; i < targetDurationSec; i++) {
    const frameName = `frame_${String(i).padStart(2, '0')}.png`;
    await renderReelFrame(sc, i, targetDurationSec, path.join(OUT_DIR, frameName));
  }

  generateOceanBrownNoiseWav(path.join(OUT_DIR, 'ocean_bg.wav'), targetDurationSec + 3);
  console.log(`${targetDurationSec} saniyelik gercek uygulama kareleri uretildi!`);
})();
