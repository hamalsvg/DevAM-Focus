const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT_DIR = path.join(process.cwd(), 'reel_build');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// XML / SVG içinde &, <, > karakterlerinin hataya yol açmasını önleyen koruyucu
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
      badge: `GÜNLÜK MOLA BULMACASI #${dayNo}`,
      title: 'TERS OTHELLO: AZ TAŞ KAZANIR',
      subtitle: 'Beyazın 4 taşı var, Siyahın 12. Kural: En AZ taşla bitiren kazanır.',
      question: 'Siyah hangi kareye oynarsa Beyazı tüm satırı almaya zorlar?',
      hookFooter: '5 Saniyede Doğru Kareyi Bul • Çözüm Biyografide',
      ttsText: `Günlük Mola Bulmacası numara ${dayNo}. Ters Othello'da kural basit: Oyun sonunda tahtada en az taşı kalan kazanır. Beyazın 4, Siyahın 12 taşı var. Siyah hangi kareye oynarsa Beyazı tüm satırı almaya zorlar? Molada sosyal medya tuzağına düşmeden çözümü denemek için devamfocus nokta netlify nokta app adresine gir.`
    },
    {
      badge: `İRADE KORUMA PROTOKOLÜ #${dayNo}`,
      title: 'AKILLI SÜRTÜNME DUVARI',
      subtitle: 'Saat 21:00. Yoruldun ve 3 saatlik ders hedefini 1 saate düşürmek istedin.',
      question: '“Hedefime ulaşana kadar her gün disiplini koruyacağım.” — Kalan Bekleme: 02:59',
      hookFooter: 'Anlık Pes Etmelere Karşı 3 Dakikalık Yüzleşme Duvarı',
      ttsText: `Saat akşam dokuz. Ders çalışırken yoruldun ve günlük hedefini düşürüp oyuna girmek istedin. Ama DevAM Focus buna hemen izin vermez. İlk gün kendine verdiğin o sözü tam ekran karşısına çıkarır ve 3 dakikalık Sürtünme Duvarı başlatır. Kendi sözüne sadık kalmak için ücretsiz masaüstü uygulamasını hemen indir.`
    },
    {
      badge: `KAYDET VE ÇIK PROTOKOLÜ #${dayNo}`,
      title: 'SAVE YAKMAYAN OYUN KİLİDİ',
      subtitle: 'Steam veya Riot Client açıkken süren gitmez. Sadece gerçek oyun sayılır.',
      question: 'Oyun hakkının bitmesine 5 dk kala uyarır ve güvenli kayıt süresi açar!',
      hookFooter: 'Oyun Ortasında Çat Diye Kapatıp Save Dosyanı Yakmaz',
      ttsText: `Oyun süren bittiğinde oyunu çat diye kapatıp kayıt dosyanı yakan programları unut. DevAM Focus, Steam veya Epic Games arka planda açıkken süreni yemez. Günlük oyun limitin bittiğinde sana 5 dakika önceden haber verir ve güvenli Kaydet Çık geri sayımı açar. Dersini çalış, gemi zırhını yükselt, ödül olarak oyna.`
    },
    {
      badge: `50 SEVİYELİ DONANMA RPG #${dayNo}`,
      title: 'TERSANE VE FIRTINA DENGESİ',
      subtitle: 'Çalıştıkça altın kazan, gemini Kruvazöre yükselt ve +%15 Fırtına Kalkanı aç.',
      question: 'Hedefi 5 gün kaçırırsan (5/5 Alabanda) oyun hakların otomatik kilitlenir!',
      hookFooter: '0/5 Neta Rotasını Koru • 2.22 MB Sıfır FPS Kaybı',
      ttsText: `Klasik kronometreler sıkıcıdır. DevAM Focus'ta tamamladığın her Pomodoro döngüsü sana altın kazandırır. Tersanede 5 farklı donanım dalını geliştirerek gemini Sahil Güvenlik Botundan Amiral Kruvazörüne dönüştürürsün. Ama dikkat et: Ders hedefini 5 kez kaçırırsan denizde fırtına çıkar ve oyun hakların kilitlenir.`
    }
  ];

  return { dayNo, ...scenarios[dayNo % scenarios.length] };
}

function wrapText(text, maxChars = 36) {
  const words = text.split(' ');
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

async function renderReelFrame(sc, stepIndex, totalSteps, outPath) {
  const progressRatio = (stepIndex + 1) / totalSteps;
  const barWidth = Math.round(920 * progressRatio);
  const shipOffsetY = Math.round(Math.sin((stepIndex / totalSteps) * Math.PI * 2) * 8);

  const subLines = wrapText(sc.subtitle, 38);
  const qLines = wrapText(sc.question, 34);

  const svg = `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="reel-bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0a111e"/>
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

      <linearGradient id="ocean-bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#070f1d"/>
        <stop offset="55%" stop-color="#0b182c"/>
        <stop offset="100%" stop-color="#0f223c"/>
      </linearGradient>
    </defs>

    <rect width="1080" height="1920" fill="url(#reel-bg)"/>
    <rect x="36" y="36" width="1008" height="1848" rx="36" fill="none" stroke="#f2a834" stroke-width="3" stroke-opacity="0.45"/>

    <!-- ORİJİNAL DEVAM FOCUS VEKTÖR LOGOSU -->
    <g transform="translate(80, 110) scale(0.22)">
      <rect x="24" y="24" width="464" height="464" rx="105" fill="url(#hdr-bg)" stroke="rgba(255,255,255,0.22)" stroke-width="10" />
      <path d="M 328 332 A 120 120 0 0 1 224 376 L 184 376 A 36 36 0 0 1 148 340 L 148 172 A 36 36 0 0 1 184 136 L 224 136 A 120 120 0 0 1 328 180"
            fill="none" stroke="url(#hdr-d)" stroke-width="52" stroke-linecap="round" stroke-linejoin="round" />
      <polygon points="232,190 368,256 232,322 264,256"
               fill="url(#hdr-gold)" stroke="url(#hdr-gold)" stroke-width="22" stroke-linejoin="round" />
    </g>

    <text x="215" y="158" fill="#ffffff" font-family="sans-serif" font-size="38" font-weight="bold">DevAM Focus</text>
    <text x="215" y="198" fill="#94a3b8" font-family="sans-serif" font-size="24" font-weight="600">Odak ve Planlama Yöneticisi</text>

    <rect x="80" y="265" width="920" height="64" rx="18" fill="#111827" stroke="#f2a834" stroke-width="2"/>
    <text x="540" y="307" text-anchor="middle" fill="#fde68a" font-family="monospace" font-size="27" font-weight="bold">
      ⚓ ${escXml(sc.badge)}
    </text>

    <text x="540" y="415" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="44" font-weight="bold">
      ${escXml(sc.title)}
    </text>

    <!-- ORİJİNAL OKYANUS SİMÜLASYONU VE SAVAŞ GEMİSİ VEKTÖRÜ -->
    <g transform="translate(80, 470)">
      <rect width="920" height="430" rx="24" fill="url(#ocean-bg)" stroke="#243247" stroke-width="3"/>

      <rect x="24" y="22" width="530" height="52" rx="12" fill="#0a101b" stroke="#566782" stroke-width="2"/>
      <text x="44" y="55" fill="#ebf2ff" font-family="sans-serif" font-size="21" font-style="italic" font-weight="bold">
        🎯 HEDEF: “Her gün disiplini koruyacağım.”
      </text>

      <rect x="574" y="22" width="322" height="52" rx="12" fill="#0e1420" stroke="#ebc35f" stroke-width="2"/>
      <text x="735" y="55" text-anchor="middle" fill="#fadc78" font-family="sans-serif" font-size="21" font-weight="bold">
        🪙 240 Altın • ⚓ Sv.28/50
      </text>

      <path d="M 0,285 Q 230,260 460,285 T 920,280 L 920,430 L 0,430 Z" fill="#0d2238"/>
      <path d="M 0,325 Q 230,305 460,325 T 920,320 L 920,430 L 0,430 Z" fill="#091829"/>

      <g transform="translate(150, ${105 + shipOffsetY}) scale(2.35)">
        <line x1="65" y1="68" x2="57" y2="42" stroke="#b9c4d6" stroke-width="1.8" />
        <polygon points="57,42 35,46 38,57 60,53" fill="#dc2626" stroke="#f8fafc" stroke-width="1.2" />
        <polygon points="118,46 123,24 134,24 138,46" fill="#7c8798" />
        <circle cx="128.5" cy="19" r="5.5" fill="#e2e8f0" />
        <polygon points="94,65 104,44 156,44 166,65" fill="#7c8798" />
        <rect x="131" y="50" width="18" height="6" fill="#22c5f0" />
        <polygon points="48,66 218,59 202,78 58,78" fill="#5b6677" stroke="#9aa7b8" stroke-width="1.2" />
        <polygon points="58,75 205,71 196,83 66,83" fill="#3a4454" />
      </g>

      <rect x="24" y="356" width="460" height="52" rx="12" fill="#0a0f18" stroke="#41c387" stroke-width="2"/>
      <text x="44" y="389" fill="#7debaf" font-family="sans-serif" font-size="21" font-weight="bold">
        ⚓ 0/5 • NETA — Sular Sakin, Rota Neta
      </text>

      <rect x="504" y="356" width="392" height="52" rx="12" fill="#0a0f18" stroke="#5f7da5" stroke-width="2"/>
      <text x="700" y="389" text-anchor="middle" fill="#c3d7f5" font-family="sans-serif" font-size="20" font-weight="bold">
        🛡 %15 Kalkan • ⚔ +25dk Oyun
      </text>
    </g>

    <rect x="80" y="950" width="920" height="460" rx="28" fill="#0d1320" stroke="#334155" stroke-width="2.5"/>
    <text x="540" y="1030" text-anchor="middle" fill="#cbd5e1" font-family="sans-serif" font-size="32" font-weight="600">
      ${escXml(subLines[0] || '')}
    </text>
    <text x="540" y="1078" text-anchor="middle" fill="#cbd5e1" font-family="sans-serif" font-size="32" font-weight="600">
      ${escXml(subLines[1] || '')}
    </text>

    <line x1="140" y1="1130" x2="940" y2="1130" stroke="#1e293b" stroke-width="3"/>

    <text x="540" y="1210" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="34" font-weight="bold">
      ${escXml(qLines[0] || '')}
    </text>
    <text x="540" y="1265" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="34" font-weight="bold">
      ${escXml(qLines[1] || '')}
    </text>

    <rect x="130" y="1335" width="820" height="22" rx="11" fill="#1e293b"/>
    <rect x="130" y="1335" width="${Math.min(820, Math.round(barWidth * 0.89))}" height="22" rx="11" fill="url(#hdr-gold)"/>

    <rect x="80" y="1465" width="920" height="190" rx="24" fill="#111928" stroke="#f2a834" stroke-width="2"/>
    <text x="540" y="1535" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="30" font-weight="bold">
      ${escXml(sc.hookFooter)}
    </text>
    <text x="540" y="1605" text-anchor="middle" fill="#60a5fa" font-family="monospace" font-size="34" font-weight="bold">
      devamfocus.netlify.app
    </text>

    <text x="540" y="1760" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="24" font-weight="600">
      Windows 10 &amp; 11 • %100 Ücretsiz • ✦ Designed by Hamal
    </text>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outPath);
}

function generateOceanBrownNoiseWav(filePath, durationSec = 15) {
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
  const sc = getDailyReelScenario();
  fs.writeFileSync(path.join(OUT_DIR, 'tts.txt'), sc.ttsText, 'utf8');
  fs.writeFileSync(
    path.join(OUT_DIR, 'caption.txt'),
    `⚓ ${sc.badge} — ${sc.title}\n\n${sc.subtitle}\n${sc.question}\n\n🔗 Ücretsiz İndir & Mola Düellosu: https://devamfocus.netlify.app`,
    'utf8'
  );

  const totalFrames = 12;
  for (let i = 0; i < totalFrames; i++) {
    const frameName = `frame_${String(i).padStart(2, '0')}.png`;
    await renderReelFrame(sc, i, totalFrames, path.join(OUT_DIR, frameName));
  }

  generateOceanBrownNoiseWav(path.join(OUT_DIR, 'ocean_bg.wav'), 15);
  console.log('Reels kareleri ve Okyanus sesi basariyla uretildi!');
})();
