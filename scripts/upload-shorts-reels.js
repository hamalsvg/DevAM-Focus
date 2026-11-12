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
    console.log('>>> [YouTube] Eksik Secret! YT_CLIENT_ID, YT_CLIENT_SECRET ve YT_REFRESH_TOKEN GitHub Secrets icine eklenmeli.');
    return;
  }

  console.log('>>> [YouTube] Access token aliniyor...');
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
    console.error('>>> [YouTube] Token Hatasi:', tokenText);
    return;
  }

  const { access_token } = JSON.parse(tokenText);
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

  console.log('>>> [YouTube] Shorts yukleme oturumu baslatiliyor...');
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
    console.error('>>> [YouTube] Yukleme Baslatma Hatasi (Kanalinizda YouTube API etkin mi?):', await initRes.text());
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

  console.log('>>> [YouTube] Yukleme Sonucu HTTP:', upRes.status, (await upRes.text()).slice(0, 300));
}

// Geçici genel URL üretici (Instagram Graph API videoyu dış bir URL'den çeker)
async function uploadTempPublicVideo(filePath) {
  try {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('time', '1h');
    form.append('fileToUpload', new Blob([fs.readFileSync(filePath)], { type: 'video/mp4' }), 'reel.mp4');
    const r1 = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { method: 'POST', body: form });
    const u1 = (await r1.text()).trim();
    if (u1.startsWith('http')) return u1;
  } catch (e) {}

  try {
    const form2 = new FormData();
    form2.append('reqtype', 'fileupload');
    form2.append('fileToUpload', new Blob([fs.readFileSync(filePath)], { type: 'video/mp4' }), 'reel.mp4');
    const r2 = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form2 });
    const u2 = (await r2.text()).trim();
    if (u2.startsWith('http')) return u2;
  } catch (e) {}

  return '';
}

// 2. INSTAGRAM REELS OTOMATİK YÜKLEYİCİ
async function uploadToInstagramReels(caption) {
  const igUserId = (process.env.IG_USER_ID || '').trim();
  const accessToken = (process.env.IG_ACCESS_TOKEN || '').trim();

  if (!igUserId || !accessToken) {
    console.log('>>> [Instagram] Eksik Secret! IG_USER_ID ve IG_ACCESS_TOKEN GitHub Secrets icine eklenmeli.');
    return;
  }

  console.log('>>> [Instagram] Video gecici buluta yukleniyor...');
  const publicVideoUrl = await uploadTempPublicVideo(VIDEO_PATH);
  if (!publicVideoUrl) {
    console.error('>>> [Instagram] Gecici video URL alinamadi.');
    return;
  }

  console.log('>>> [Instagram] Reels konteyneri olusturuluyor:', publicVideoUrl);
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
    console.error('>>> [Instagram] Konteyner Hatasi:', JSON.stringify(createData));
    return;
  }

  console.log('>>> [Instagram] Video Meta sunucusunda isleniyor (40 sn bekleniyor)...');
  await new Promise((r) => setTimeout(r, 40000));

  const pubRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: createData.id,
      access_token: accessToken
    })
  });

  console.log('>>> [Instagram] Reels Yayin Sonucu:', pubRes.status, await pubRes.text());
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
