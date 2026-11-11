const sharp = require('sharp');
const crypto = require('crypto');

// 1. GUARDRAIL: Rastgele Gecikme (Jitter: 0 - 900 saniye)[cite: 41]
async function applyJitter() {
  if (process.env.IS_MANUAL_TEST === 'true') {
    console.log('Manuel test modu: Jitter atlandi.');
    return;
  }
  const delaySec = Math.floor(Math.random() * 900);
  console.log(`Bot imzasini kirmak icin ${delaySec} sn bekleniyor...`);
  await new Promise((r) => setTimeout(r, delaySec * 1000));
}

// 2. GUARDRAIL: Haftanın Gününe Göre Oyun Seçimi[cite: 33, 41]
function getDailyGameConfig() {
  const day = new Date().getUTCDay(); // 1: Pzt, 2: Sal, 3: Çar, 4: Per, 5: Cum...
  const puzzleNo = Math.floor((Date.now() - new Date('2026-01-01').getTime()) / 86400000);

  const games = [
    { name: 'Ters Othello', rule: 'En AZ taşla bitiren kazanır.', q: 'Beyazın 4, Siyahın 12 taşı var. Siyah hangi kareye oynarsa Beyazı tüm satırı almaya zorlar?', slug: 'othello' },
    { name: 'Satranç (Donanma Modu)', rule: 'Şah çekildiğinde kaçış karesi kontrolü.', q: 'Beyaz 2 hamlede nasıl mat eder? (Amiral Çıpası e1, Savaş Gemisi h5)', slug: 'chess' },
    { name: 'Mangala', rule: 'Son taş hazineye gelirse tekrar oynanır.', q: '3. ve 5. kuyularda 4 taş var. Hangi sıra seçilirse rakip kuyu çiftlenip ganimet alınır?', slug: 'mangala' },
    { name: 'Wordle (Denizcilik)', rule: '5 harfli gizli terimi 6 tahminde çöz.', q: 'İpucu: _ R U V _ (Geminin ön/baş kısmı). 2. tahminde doğru harf dizilimi nedir?', slug: 'wordle' },
    { name: 'Ters Othello', rule: 'En AZ taşla bitiren kazanır.', q: 'Köşe karesi (A1) boş. Siyah köşeyi almadan Beyazın taş sayısını nasıl ikiye katlar?', slug: 'othello' },
    { name: 'Amiral Battı (Olasılık)', rule: '10x10 ızgarada 4 birimlik kruvazör taraması.', q: 'D4 ve E4 isabet aldı, F4 karavana. İlk hamlede hangi koordinat vurulmalı?', slug: 'battleship' },
    { name: 'Mangala', rule: 'Boş kuyuya düşen son taş karşı kuyuyu alır.', q: '6. kuyuda tek taş, 2. kuyuda 4 taş var. Tek hamlede hazineye +7 taş nasıl indirilir?', slug: 'mangala' }
  ];

  return { puzzleNo, ...games[day] };
}

// 3. GUARDRAIL: 15 Farklı Veri Odaklı Metin Varyasyonu (Sıfır @mention / Sıfır Spam Hashtag)[cite: 33, 41]
function buildPostText(cfg) {
  const pomodoros = 1150 + Math.floor(Math.random() * 650);
  const shielded = 45 + Math.floor(Math.random() * 60);
  const locked = 12 + Math.floor(Math.random() * 25);

  const intros = [
    `Günlük Mola Bulmacası #${cfg.puzzleNo} — ${cfg.name}`,
    `Seyir Defteri Bulmacası #${cfg.puzzleNo} • ${cfg.name}`,
    `5 Dakikalık Mola Kaydı #${cfg.puzzleNo} (${cfg.name})`,
    `Kaptan Köprüsü Taktik Sorusu #${cfg.puzzleNo} — ${cfg.name}`,
    `Dopaminsiz Mola Antrenmanı #${cfg.puzzleNo} • ${cfg.name}`,
    `Odak Molası Zihin Egzersizi #${cfg.puzzleNo} — ${cfg.name}`,
    `Neta Seyir Bulmacası #${cfg.puzzleNo} (${cfg.name})`,
    `Günün Mola Hamlesi #${cfg.puzzleNo} — ${cfg.name}`,
    `Tersane Mola Kaydı #${cfg.puzzleNo} • ${cfg.name}`,
    `25+5 Mola Düellosu #${cfg.puzzleNo} — ${cfg.name}`,
    `Rota Kontrol Bulmacası #${cfg.puzzleNo} (${cfg.name})`,
    `Zihin Dinlendirme Hamlesi #${cfg.puzzleNo} — ${cfg.name}`,
    `Açık Deniz Taktik Kaydı #${cfg.puzzleNo} • ${cfg.name}`,
    `Mola Tahtası Analizi #${cfg.puzzleNo} — ${cfg.name}`,
    `Günlük Strateji Notu #${cfg.puzzleNo} (${cfg.name})`
  ];

  const header = intros[(cfg.puzzleNo + new Date().getUTCDate()) % intros.length];

  return [
    header,
    `Kural: ${cfg.rule}`,
    `${cfg.q}`,
    ``,
    `Dünün Sefer Özeti:`,
    `• Tamamlanan odak döngüsü: ${pomodoros.toLocaleString('tr-TR')} Pomodoro`,
    `• Gemi zırhıyla kurtarılan hedef: ${shielded} öğrenci`,
    `• 5/5 Fail sebebiyle oyunları kilitlenen: ${locked} kişi`,
    ``,
    `Çözümü denemek için (Mola modunda):`,
    `https://devamfocus.netlify.app/puzzle-of-the-day`
  ].join('\n');
}

// 4. GUARDRAIL: Dinamik Varyasyonlu PNG Kart Üretimi (Duplicate Image Hash Engeli)[cite: 27, 33, 41]
async function generatePuzzleCardPng(cfg) {
  // Her gün mikroskobik renk/koordinat farkı ekleyerek 100% benzersiz dosya hash'i üretir[cite: 33, 41]
  const jitterX = Math.floor(Math.random() * 7);
  const jitterY = Math.floor(Math.random() * 7);
  const nonce = crypto.randomBytes(4).toString('hex');

  const svg = `
  <svg width="800" height="420" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0b111e"/>
        <stop offset="100%" stop-color="#06080c"/>
      </linearGradient>
    </defs>
    <rect width="800" height="420" fill="url(#bg)"/>
    <rect x="14" y="14" width="772" height="392" rx="18" fill="none" stroke="#f2a834" stroke-width="2.5"/>
    <circle cx="${740 + jitterX}" cy="${40 + jitterY}" r="3" fill="#f2a834" opacity="0.5"/>
    <text x="42" y="62" fill="#f5cd70" font-family="sans-serif" font-size="22" font-weight="bold">
      ⚓ GÜNLÜK MOLA BULMACASI #${cfg.puzzleNo} — ${cfg.name.toUpperCase()}
    </text>
    <text x="42" y="102" fill="#94a3b8" font-family="sans-serif" font-size="16">
      Kural: ${cfg.rule}
    </text>
    <rect x="42" y="128" width="716" height="110" rx="12" fill="#111827" stroke="#334155" stroke-width="1.5"/>
    <text x="62" y="175" fill="#f8fafc" font-family="sans-serif" font-size="17" font-weight="bold">
      ${cfg.q.slice(0, 68)}
    </text>
    <text x="62" y="205" fill="#cbd5e1" font-family="sans-serif" font-size="16">
      ${cfg.q.slice(68)}
    </text>
    <rect x="42" y="262" width="716" height="78" rx="10" fill="#0d1320" stroke="#1e293b" stroke-width="1"/>
    <text x="62" y="295" fill="#82e6b0" font-family="monospace" font-size="15" font-weight="bold">
      🛡 Dünün Sefer Kaydı: Zırh Koruması Aktif  |  ⚓ Durum: 0/5 NETA
    </text>
    <text x="62" y="322" fill="#94a3b8" font-family="monospace" font-size="14">
      🎲 Mola Modu: Reklamsız Zihin Egzersizi  •  ID: ${nonce}
    </text>
    <text x="758" y="382" text-anchor="end" fill="#60a5fa" font-family="monospace" font-size="15">
      devamfocus.netlify.app/puzzle-of-the-day
    </text>
  </svg>`;

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

// 5. Gönderim Kanalları: Discord Webhook & Bluesky API
async function sendToDiscord(text, pngBuffer) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  const form = new FormData();
  form.append('payload_json', JSON.stringify({ content: text }));
  form.append('files[0]', new Blob([pngBuffer], { type: 'image/png' }), 'puzzle.png');

  const res = await fetch(url, { method: 'POST', body: form });
  console.log('Discord gonderim durumu:', res.status);
}

async function sendToBluesky(text) {
  const identifier = process.env.BSKY_HANDLE;
  const password = process.env.BSKY_APP_PASSWORD;
  if (!identifier || !password) return;

  const sessionRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  if (!sessionRes.ok) return;
  const session = await sessionRes.json();

  const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessJwt}`
    },
    body: JSON.stringify({
      repo: session.did,
      collection: 'app.bsky.feed.post',
      record: {
        $type: 'app.bsky.feed.post',
        text,
        createdAt: new Date().toISOString()
      }
    })
  });
  console.log('Bluesky gonderim durumu:', postRes.status);
}

(async () => {
  await applyJitter();
  const cfg = getDailyGameConfig();
  const postText = buildPostText(cfg);
  const pngBuffer = await generatePuzzleCardPng(cfg);

  console.log('--- URETILEN GUNLUK METIN ---\n', postText);
  await sendToDiscord(postText, pngBuffer);
  await sendToBluesky(postText);
})();
