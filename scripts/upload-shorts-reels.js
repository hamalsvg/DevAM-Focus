const fs = require('fs');
const path = require('path');

const VIDEO_PATH = path.join(process.cwd(), 'reel_build', 'devam_focus_reel.mp4');
const CAPTION_PATH = path.join(process.cwd(), 'reel_build', 'caption.txt');

// 1. OTOMATİK YOUTUBE SHORTS YÜKLEYİCİ (Resmi YouTube Data API v3)
async function uploadToYouTubeShorts(caption) {
  const clientId = process.env.YT_CLIENT_ID;
  const clientSecret = process.env.YT_CLIENT_SECRET;
  const refreshToken = process.env.YT_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.log('YouTube anahtarlari tanimli degil, YouTube Shorts atlandi.');
    return;
  }

  // Yeni Access Token al
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
    console.error('YouTube Token hatasi:', await tokenRes.text());
    return;
  }
  const { access_token } = await tokenRes.json();

  const firstLine = (caption.split('\n')[0] || 'DevAM Focus Günlük Mola Bulmacası').slice(0, 80);
  const metadata = {
    snippet: {
      title: `${firstLine} #Shorts`,
      description: `${caption}\n\n#Shorts #Pomodoro #DersCalisma #Odaklanma #YKS #DevAMFocus`,
      tags: ['Shorts', 'Pomodoro', 'Ders Çalışma', 'Odaklanma', 'YKS', 'DevAM Focus'],
      categoryId: '27' // Education (Eğitim) Kategorisi
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false
    }
  };

  // Resumable Upload Başlat
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

  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) {
    console.error('YouTube yukleme URL alinamadi:', await initRes.text());
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

  console.log('YouTube Shorts yukleme durumu:', upRes.status);
}

// 2. OTOMATİK INSTAGRAM REELS YÜKLEYİCİ (Meta Graph API)
async function uploadToInstagramReels(caption) {
  const igUserId = process.env.IG_USER_ID;
  const accessToken = process.env.IG_ACCESS_TOKEN;

  if (!igUserId || !accessToken) {
    console.log('Instagram anahtarlari tanimli degil, Instagram Reels atlandi.');
    return;
  }

  // Videoyu geçici genel URL'e yükle (Meta API videoyu URL'den çeker)
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', new Blob([fs.readFileSync(VIDEO_PATH)], { type: 'video/mp4' }), 'reel.mp4');

  const hostRes = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
  const publicVideoUrl = (await hostRes.text()).trim();

  if (!publicVideoUrl.startsWith('http')) {
    console.error('Gecici video URL alinamadi:', publicVideoUrl);
    return;
  }

  // 1. Reels Medya Konteyneri Oluştur
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
    console.error('Instagram konteyner hatasi:', createData);
    return;
  }

  console.log('Instagram Reels isleniyor (35 sn bekleniyor)...');
  await new Promise((r) => setTimeout(r, 35000));

  // 2. Reels Videosunu Yayınla
  const pubRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: createData.id,
      access_token: accessToken
    })
  });

  console.log('Instagram Reels yayin durumu:', pubRes.status);
}

(async () => {
  if (!fs.existsSync(VIDEO_PATH)) {
    console.error('Video dosyasi bulunamadi:', VIDEO_PATH);
    return;
  }
  const caption = fs.existsSync(CAPTION_PATH) ? fs.readFileSync(CAPTION_PATH, 'utf8') : 'DevAM Focus #Shorts';
  await uploadToYouTubeShorts(caption);
  await uploadToInstagramReels(caption);
})();
