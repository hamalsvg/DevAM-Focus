const fs = require('fs');
const path = require('path');

const VIDEO_PATH = path.join(process.cwd(), 'reel_build', 'devam_focus_reel.mp4');
const CAPTION_PATH = path.join(process.cwd(), 'reel_build', 'caption.txt');

// 1. YOUTUBE SHORTS OTOMATİK YÜKLEYİCİ
async function uploadToYouTubeShorts(caption) {
  const clientId = (process.env.YT_CLIENT_ID || '').trim();
  const clientSecret = (process.env.YT_CLIENT_SECRET || '').trim();
  const refreshToken = (process.env.YT_REFRESH_TOKEN || '').trim();

  console.log(
    `[YouTube Kontrol] ID:${clientId ? 'VAR' : 'YOK'}, SECRET:${clientSecret ? 'VAR' : 'YOK'}, REFRESH:${refreshToken ? 'VAR' : 'YOK'}`
  );

  if (!clientId || !clientSecret || !refreshToken) {
    console.log('[YouTube] Eksik Secret anahtari var, YouTube yuklemesi atlandi.');
    return;
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const tokenText = await tokenRes.text();
  if (!tokenRes.ok) {
    console.error('[YouTube] Token alma hatasi:', tokenText);
    return;
  }

  const { access_token } = JSON.parse(tokenText);
  const firstLine = (caption.split('\n')[0] || 'DevAM Focus — Odak ve Planlama Yöneticisi')
    .replace(/⚓/g, '')
    .trim()
    .slice(0, 75);

  const metadata = {
    snippet: {
      title: `${firstLine} #Shorts`,
      description: `${caption}\n\n#Shorts #Pomodoro #DersCalisma #Odaklanma #YKS #DevAMFocus`,
      tags: ['Shorts', 'Pomodoro', 'Ders Çalışma', 'Odaklanma', 'YKS', 'DevAM Focus'],
      categoryId: '27'
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false
    }
  };

  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/mp4'
      },
      body: JSON.stringify(metadata)
    }
  );

  if (!initRes.ok) {
    console.error('[YouTube] Oturum baslatma hatasi:', await initRes.text());
    return;
  }

  const uploadUrl = initRes.headers.get('location');
  const videoBuffer = fs.readFileSync(VIDEO_PATH);

  const upRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'video/mp4'
    },
    body: videoBuffer
  });

  console.log('[YouTube] Shorts Yukleme Tamamlandi! HTTP:', upRes.status, (await upRes.text()).slice(0, 250));
}

// 2. INSTAGRAM REELS DOĞRUDAN YÜKLEYİCİ (Geçici Sunucu Gerektirmez - Resmi Meta Resumable Upload)
async function uploadToInstagramReels(caption) {
  const igUserId = (process.env.IG_USER_ID || '').trim();
  const accessToken = (process.env.IG_ACCESS_TOKEN || '').trim();

  if (!igUserId || !accessToken) {
    console.log('[Instagram] IG_USER_ID veya IG_ACCESS_TOKEN tanimli degil, atlandi.');
    return;
  }

  const videoBuffer = fs.readFileSync(VIDEO_PATH);
  const fileSize = videoBuffer.length;

  console.log(`[Instagram] 1/3 Resumable Reels oturumu aciliyor (${fileSize} byte)...`);
  const initRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      upload_type: 'resumable',
      caption: `${caption}\n\n#pomodoro #dersçalışma #yks #odaklanma #devamfocus`,
      access_token: accessToken
    })
  });

  const initData = await initRes.json();
  if (!initData.id || !initData.uri) {
    console.error('[Instagram] Oturum acma hatasi:', JSON.stringify(initData));
    return;
  }

  const creationId = initData.id;
  const uploadUri = initData.uri;

  console.log('[Instagram] 2/3 Video dogrudan Meta sunucusuna (rupload.facebook.com) yukleniyor...');
  const uploadRes = await fetch(uploadUri, {
    method: 'POST',
    headers: {
      Authorization: `OAuth ${accessToken}`,
      offset: '0',
      file_size: String(fileSize),
      'Content-Type': 'application/octet-stream'
    },
    body: videoBuffer
  });

  const uploadText = await uploadRes.text();
  console.log('[Instagram] Binary yukleme cevabi:', uploadRes.status, uploadText);

  // Video işlenene kadar durumunu kontrol et (en fazla 60 sn)
  console.log('[Instagram] 3/3 Meta video islemesi bekleniyor...');
  for (let attempt = 1; attempt <= 6; attempt++) {
    await new Promise((r) => setTimeout(r, 10000));
    const statusRes = await fetch(
      `https://graph.facebook.com/v19.0/${creationId}?fields=status_code,status&access_token=${accessToken}`
    );
    const statusData = await statusRes.json();
    console.log(`[Instagram] Isleme durumu (${attempt * 10} sn):`, JSON.stringify(statusData));

    if (statusData.status_code === 'FINISHED') break;
    if (statusData.status_code === 'ERROR') {
      console.error('[Instagram] Video isleme hatasi:', JSON.stringify(statusData));
      return;
    }
  }

  const pubRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: accessToken
    })
  });

  console.log('[Instagram] Reels Yayin Sonucu:', pubRes.status, await pubRes.text());
}

(async () => {
  if (!fs.existsSync(VIDEO_PATH)) {
    console.error('HATA: Video dosyasi bulunamadi:', VIDEO_PATH);
    return;
  }
  const caption = fs.existsSync(CAPTION_PATH) ? fs.readFileSync(CAPTION_PATH, 'utf8') : 'DevAM Focus #Shorts';
  await uploadToYouTubeShorts(caption);
  await uploadToInstagramReels(caption);
})();
