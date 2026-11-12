const fs = require('fs');
const path = require('path');

const VIDEO_PATH = path.join(process.cwd(), 'reel_build', 'devam_focus_reel.mp4');
const CAPTION_PATH = path.join(process.cwd(), 'reel_build', 'caption.txt');

// 1. YOUTUBE SHORTS OTOMATİK YÜKLEYİCİ
async function uploadToYouTubeShorts(caption) {
  const clientId = (process.env.YT_CLIENT_ID || '').trim();
  const clientSecret = (process.env.YT_CLIENT_SECRET || '').trim();
  const refreshToken = (process.env.YT_REFRESH_TOKEN || '').trim();

  if (!clientId || !clientSecret || !refreshToken) {
    console.log('[YouTube] Secret anahtarlari (YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN) bos, atlandi.');
    return;
  }

  console.log('[YouTube] Access token aliniyor...');
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

  if (!tokenRes.ok) {
    console.error('[YouTube] Token alma hatasi:', await tokenRes.text());
    return;
  }

  const { access_token } = await tokenRes.json();
  const firstLine = (caption.split('\n')[0] || 'DevAM Focus — Odak ve Planlama Yöneticisi').replace(/⚓/g, '').trim().slice(0, 75);

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

  console.log('[YouTube] Shorts yukleme oturumu baslatiliyor...');
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
  if (!uploadUrl) {
    console.error('[YouTube] Yukleme URL alinamadi.');
    return;
  }

  const videoBuffer = fs.readFileSync(VIDEO_PATH);
  const upRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'video/mp4'
    },
    body: videoBuffer
  });

  const upText = await upRes.text();
  console.log('[YouTube] Yukleme tamamlandi! HTTP Durumu:', upRes.status, upText.slice(0, 200));
}

// 2. INSTAGRAM REELS OTOMATİK YÜKLEYİCİ
async function uploadToInstagramReels(caption) {
  const igUserId = (process.env.IG_USER_ID || '').trim();
  const accessToken = (process.env.IG_ACCESS_TOKEN || '').trim();

  if (!igUserId || !accessToken) {
    console.log('[Instagram] IG_USER_ID veya IG_ACCESS_TOKEN tanimli degil, atlandi.');
    return;
  }

  console.log('[Instagram] Video gecici sunucuya yukleniyor...');
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', new Blob([fs.readFileSync(VIDEO_PATH)], { type: 'video/mp4' }), 'reel.mp4');

  const hostRes = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
  const publicVideoUrl = (await hostRes.text()).trim();

  if (!publicVideoUrl.startsWith('http')) {
    console.error('[Instagram] Gecici video URL alinamadi:', publicVideoUrl);
    return;
  }

  console.log('[Instagram] Reels konteyneri olusturuluyor:', publicVideoUrl);
  const createRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: publicVideoUrl,
      caption: `${caption}\n\n#pomodoro #dersçalışma #yks #odaklanma #devamfocus`,
      access_token: accessToken
    })
  });

  const createData = await createRes.json();
  if (!createData.id) {
    console.error('[Instagram] Konteyner hatasi:', JSON.stringify(createData));
    return;
  }

  console.log('[Instagram] Video isleniyor (40 sn bekleniyor)...');
  await new Promise((r) => setTimeout(r, 40000));

  const pubRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: createData.id,
      access_token: accessToken
    })
  });

  console.log('[Instagram] Reels yayin sonucu:', pubRes.status, await pubRes.text());
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
