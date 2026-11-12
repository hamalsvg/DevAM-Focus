const fs = require('fs');
const path = require('path');

const VIDEO_PATH = path.join(process.cwd(), 'reel_build', 'devam_focus_reel.mp4');
const CAPTION_PATH = path.join(process.cwd(), 'reel_build', 'caption.txt');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Her video tipine özel, yazım hatalı, devrik cümleli ve kendi arasında tartışan diyalog paketleri
function pickRealisticDebate(captionText) {
  const isWordle = captionText.includes('5 HARFLİ') || captionText.includes('WORDLE');
  const isBattleship = captionText.includes('AMİRAL BATTI') || captionText.includes('KOORDİNAT');
  const isApps = captionText.includes('SAVE YAKMAYAN') || captionText.includes('UYGULAMA LİSTESİ');
  const isWeb = captionText.includes('WEB FİLTRESİ') || captionText.includes('SOSYAL MEDYA');
  const isPlan = captionText.includes('HAFTALIK PLANLAMA');

  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if (isWordle) {
    return pickOne([
      {
        hostPin: '📌 3. satırdaki gizli kelimeyi ilk kim bulacak? 👇',
        bot1Comment: '3. satirdaki kelime BAZEN degilmi ya ben mi yanlsi goruyom',
        bot2Reply: 'nasil bazen olsun ilk satirda M ve L elenmis zaten HALEN yada HAKEM falandir o',
        bot1Counter: 'hakem olamaz M gri yanmis ustte haklisin halen olabilir bak onu dusunmedim hic'
      },
      {
        hostPin: '📌 Yeşil ve sarı harflere göre gizli kelime ne? 👇',
        bot1Comment: 'lan 2 saattir bakiyom A E N yesil ama ilk harfi bulamadim kafayi yicem simdi',
        bot2Reply: 'SAHNE denemis S ve H gri cikmis demekki BAZEN iste daha ne olcak',
        bot1Counter: 'hee ben N harfini sari sandim ekrani kismisim gozukmuyo dogru diyon'
      }
    ]);
  }

  if (isBattleship) {
    return pickOne([
      {
        hostPin: '🎯 Sıradaki atış C4 karesine mi yoksa F4 karesine mi yapılmalı? 👇',
        bot1Comment: 'kesin C4 bu arada hep sola dogru koyuyolar gemiyi ben olsam c4 vururum ilk',
        bot2Reply: 'ne alaka C4 sol tarafi dar zaten F4 bos duruyo oraya uzaniyodur kruvazor',
        bot1Counter: 'gecen el bende oyle dedim ters kose yapti bot belli olmuyo hic'
      },
      {
        hostPin: '⚓ Kruvazörü batırmak için tek atış hakkın var: C4 mü F4 mü? 👇',
        bot1Comment: 'D4 le E4 vurulmussa F4 vurcan iste bunu da sormazsin heralde',
        bot2Reply: 'iyide geminin bas kismi D4 ise C4 olmasi lazim nerden biliyon saga gittigini',
        bot1Counter: 'dogru la 3 birimlik gemiymis ben 4 sanmistim iki tarafta olabilirmis aslinda'
      }
    ]);
  }

  if (isApps) {
    return pickOne([
      {
        hostPin: '🛡 Günlük ders hedefi bitmeden hangi oyunları kilitliyorsunuz? 👇',
        bot1Comment: 'bu oyun suresi bitince 5 dk kala uyari vermesi gercekten calisiyomu yoksa direkt kapatiyomu oyunu',
        bot2Reply: 'direkt kapatmiyo ben dun rdr2 oynarken cikti uyari kaydedip ciktim kendim yoksa save gidiyodu',
        bot1Counter: 'iyi bari diger programlar gorev yoneticisinden cat diye kapatiyo cunki sinir bozucu oluyo'
      },
      {
        hostPin: '🎮 Bilgisayarınızda en çok vakit çalan oyun hangisi? 👇',
        bot1Comment: 'steam arkada acik kalinca sureden yiyomu peki bazen indirme birakiyom ben geceleri',
        bot2Reply: 'videoda launcher haric yaziyo ya okumadinmi sadece oyunun exe acikken sayiyo',
        bot1Counter: 'gormedim orayi kucuk yazmislar iyiymis o zaman indirip deniyim bi'
      }
    ]);
  }

  if (isWeb) {
    return pickOne([
      {
        hostPin: '🌐 Çalışırken odağınızı en çok hangi site dağıtıyor? 👇',
        bot1Comment: 'youtube kapatinca ders videosu nasil izlicez peki sacma degilmi biraz',
        bot2Reply: 'ister kara listeye aliyon ister gunluk sure veriyon saat 18den sonra aciliyo falan ayarlanabiliyo yani',
        bot1Counter: 'haa tamam ben komple engelliyo sandim sure veriliyosa is gorur o zaman'
      }
    ]);
  }

  if (isPlan) {
    return pickOne([
      {
        hostPin: '📅 Haftalık plan tablosunda sizin en yoğun gününüz hangisi? 👇',
        bot1Comment: 'tabloyu her hafta bastan mi yaziyoz yoksa kaliyomu oyle kaydedince',
        bot2Reply: 'kaliyo tabiki niye silinsin istedigin zaman tek tikla temizle diyip degistiriyon sadece',
        bot1Counter: 'benim eski kullandigim uygulamada pazar gecesi sifirlaniyodu ondan sordum'
      }
    ]);
  }

  // Varsayılan (Odak & Sayaç / Tersane)
  return pickOne([
    {
      hostPin: '⚓ Günlük çalışma hedefiniz kaç saat? Geminiz kaçıncı seviyede? 👇',
      bot1Comment: '5 gun hedefi kacirinca harbiden kitliyomu oyunlari yoksa lafta mi sadece',
      bot2Reply: 'valla ben 4/5 firtinaya dustum dun uyari verdi 5 olunca kitliyo ders calismadan acilmiyo bidaha',
      bot1Counter: 'fena gerilimliymis o zaman insan mecbur oturup calisir kilit yememek icin'
    },
    {
      hostPin: '⏱ Pomodoro döngüsünde kaç dakika çalışma / kaç dakika mola kullanıyorsunuz? 👇',
      bot1Comment: 'arkada calisirken pc kasar mi acaba benim laptop biraz eski de',
      bot2Reply: 'yok la 2 mb bisi zaten gorev yoneticisinde gozukmuyo bile ram kullanimi',
      bot1Counter: 'iyi bari indiriyom simdi bakalim nasilmis'
    }
  ]);
}

async function getYouTubeAccessToken(clientId, clientSecret, refreshToken) {
  if (!clientId || !clientSecret || !refreshToken) return null;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
}

// Videoyu beğenip ana yorum atan ve oluşan yorumun ID'sini döndüren fonksiyon
async function postYouTubeTopComment(videoId, accessToken, text, label) {
  try {
    await fetch(`https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const res = await fetch('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        snippet: {
          videoId: videoId,
          topLevelComment: {
            snippet: { textOriginal: text }
          }
        }
      })
    });

    const data = await res.json();
    console.log(`[YouTube ${label}] Ana Yorum Atildi (${res.status}): "${text}"`);
    return data.id || null;
  } catch (e) {
    console.error(`[YouTube ${label}] Hata:`, e.message);
    return null;
  }
}

// Başka bir botun yorumunun ALTINA doğrudan yanıt (Reply) veren fonksiyon
async function postYouTubeReply(parentThreadId, accessToken, text, label, videoId) {
  try {
    if (videoId) {
      await fetch(`https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    }

    const res = await fetch('https://www.googleapis.com/youtube/v3/comments?part=snippet', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        snippet: {
          parentId: parentThreadId,
          textOriginal: text
        }
      })
    });

    console.log(`[YouTube ${label}] Alt Yanit (Reply) Atildi (${res.status}): "${text}"`);
  } catch (e) {
    console.error(`[YouTube ${label}] Yanit Hatasi:`, e.message);
  }
}

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

  const hostToken = await getYouTubeAccessToken(clientId, clientSecret, refreshToken);
  if (!hostToken) {
    console.error('[YouTube] Ana kanal access token alinamadi.');
    return;
  }

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
        Authorization: `Bearer ${hostToken}`,
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
      Authorization: `Bearer ${hostToken}`,
      'Content-Type': 'video/mp4'
    },
    body: videoBuffer
  });

  const upText = await upRes.text();
  console.log('[YouTube] Shorts Yukleme Tamamlandi! HTTP:', upRes.status);

  let videoId = null;
  try {
    videoId = JSON.parse(upText).id;
  } catch (e) {}

  if (!videoId) return;

  // GERÇEKÇİ BOT TARTIŞMA ZİNCİRİ (Ana Kanal + Bot 1 + Bot 2 Karşılıklı Yanıtlaşma)
  const debate = pickRealisticDebate(caption);

  // 1) Ana kanal ilk soruyu bırakır
  await sleep(randomInt(6000, 12000));
  await postYouTubeTopComment(videoId, hostToken, debate.hostPin, 'AnaKanal');

  // 2) Bot 1 ve Bot 2 Tokenlarını Kontrol Et
  const bot1Refresh = (process.env.YT_BOT1_REFRESH_TOKEN || '').trim();
  const bot2Refresh = (process.env.YT_BOT2_REFRESH_TOKEN || '').trim();

  const bot1Token = await getYouTubeAccessToken(clientId, clientSecret, bot1Refresh);
  const bot2Token = await getYouTubeAccessToken(clientId, clientSecret, bot2Refresh);

  if (bot1Token) {
    await sleep(randomInt(14000, 24000));
    const threadId = await postYouTubeTopComment(videoId, bot1Token, debate.bot1Comment, 'Bot-1');

    // Bot 2, doğrudan Bot 1'in yorumunun altına yanıt (reply) yazar ve itiraz eder
    if (bot2Token && threadId) {
      await sleep(randomInt(16000, 28000));
      await postYouTubeReply(threadId, bot2Token, debate.bot2Reply, 'Bot-2 (Bot-1e Yanit)', videoId);

      // Bot 1 tekrar kendi yorumunun altında Bot 2'ye cevap verir!
      await sleep(randomInt(14000, 22000));
      await postYouTubeReply(threadId, bot1Token, debate.bot1Counter, 'Bot-1 (Bot-2ye Cevap)', null);
    }
  }
}

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

  console.log('[Instagram] 2/3 Video dogrudan Meta sunucusuna yukleniyor...');
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

  console.log('[Instagram] Binary yukleme cevabi:', uploadRes.status, await uploadRes.text());

  console.log('[Instagram] 3/3 Meta video islemesi bekleniyor...');
  for (let attempt = 1; attempt <= 6; attempt++) {
    await sleep(10000);
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

  const pubData = await pubRes.json();
  console.log('[Instagram] Reels Yayin Sonucu:', pubRes.status, JSON.stringify(pubData));

  if (pubData && pubData.id) {
    const debate = pickRealisticDebate(caption);
    await sleep(randomInt(8000, 15000));
    await fetch(`https://graph.facebook.com/v19.0/${pubData.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: debate.hostPin, access_token: accessToken })
    });
  }
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
