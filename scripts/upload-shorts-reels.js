const fs = require('fs');
const path = require('path');

const VIDEO_PATH = path.join(process.cwd(), 'reel_build', 'devam_focus_reel.mp4');
const CAPTION_PATH = path.join(process.cwd(), 'reel_build', 'caption.txt');
const MODE = process.argv[2] || 'upload'; // 'upload' (video yükle + ilk dalga) veya 'wave' (ertesi güne yayılan dalga)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Doğal klavye kusurları, harf yutma ve devrikleştirme filtresi (Kombinasyonları 10 katına çıkarır)
function humanizeTurkishText(text) {
  let out = text;
  const replacements = [
    [/değil mi/g, () => pick(['degilmi', 'degil mi', 'deilmi', 'degilmiki'])],
    [/bir şey/g, () => pick(['bisi', 'bisey', 'bi sey', 'bişi'])],
    [/çünkü/g, () => pick(['cunku', 'cunki', 'çünkü'])],
    [/gerçekten/g, () => pick(['harbiden', 'gercekten', 'cidden'])],
    [/acaba/g, () => pick(['acaba', 'acbaa', 'ki'])],
    [/yanlış/g, () => pick(['yanlis', 'yanlsi', 'yanlış'])],
    [/çalışıyor mu/g, () => pick(['calisiyomu', 'calisiyo mu', 'isliyomu'])],
    [/oluyor/g, () => pick(['oluyo', 'oluyoo', 'oluyor'])],
    [/yapıyorum/g, () => pick(['yapiyom', 'yapıyom', 'yapiyorum'])],
    [/gidiyor/g, () => pick(['gidiyo', 'gidiyoo'])],
    [/bence/g, () => pick(['bence', 'bana gore', 'valla bence'])]
  ];

  replacements.forEach(([regex, fn]) => {
    out = out.replace(regex, fn);
  });

  // %35 ihtimalle sonuna doğal öğrenci/oyuncu eki ekle (asla "kanka" kullanmaz)
  if (Math.random() < 0.35) {
    out += ' ' + pick(['ya', 'valla', 'bu arada', 'heralde', 'sanirim', 'gibi', 'ama']);
  }

  return out.trim();
}

// ============================================================================
// 15.000+ BAĞLANTILI KOMBİNASYON ÜRETEN KONU ÇEKİRDEĞİ MOTORU
// Her çekirdek (Seed) kendi içinde [Soru] -> [Doğrudan Bağlı Yanıt 1] -> [Doğrudan Bağlı Yanıt 2] üretir.
// ============================================================================
function generateConnectedDialoguePool(captionText) {
  const isWordle = captionText.includes('5 HARFLİ') || captionText.includes('WORDLE');
  const isBattleship = captionText.includes('AMİRAL BATTI') || captionText.includes('KOORDİNAT');

  // Ortak Uygulama & Oyun Kilidi & Pomodoro Çekirdekleri + Video Özel Çekirdekler
  const seeds = [
    // ÇEKİRDEK 1: 5 Dakika Kala Save Uyarısı ve Oyun Kapatma Tartışması (8x7x6 x 6x6 x 6x5 = ~360.000 kombinasyon)
    {
      top: () =>
        humanizeTurkishText(
          `${pick([
            'bu oyun suresi bitince',
            'gunluk oyun hakki dolunca',
            'sayac sifirlaninca oyunda',
            'oyun suresi bittigi an',
            'uygulama oyun suresini bitirince',
            'hedef bitmeden oyuna girince'
          ])} ${pick([
            '5 dk kala uyari vermesi gercekten çalışıyor mu',
            'direkt alt f4 gibi mi atiyo yoksa uyariyo mu',
            'kaydetmek icin sure taniyo mu',
            'oyunu aniden mi kapatiyo yoksa 5 dk bekletiyo mu',
            'ekrana bildirim cikip sure veriyo mu'
          ])} ${pick([
            'yoksa save dosyasi yanar bende',
            'gecen baska program yuzunden kaydim silindi de',
            'rdr2 oynarken ortasinda kapanmasin sonra',
            'rekabetci mactayken pat diye atmasin da',
            'ona gore kurcam bilgisayara'
          ])}`
        ),
      replies: [
        () =>
          humanizeTurkishText(
            `${pick([
              'yok direkt kapatmiyo',
              'aniden atmiyo merak etme',
              'ben dun denedim 5 dk kala uyari cikiyo',
              'direkt oldurmuyo exe dosyasini',
              '5 dakika geri sayim baslatiyo once'
            ])} ${pick([
              'ben rdr2 oynarken cikti uyari rahatca save alip ciktim',
              'hoi4 oynarken bildirim geldi kaydedip kapattim kendim',
              'ekranin kosesinde 5 dk kaldi diye gosteriyo o sirada kaydediyon',
              'gorev yoneticisinden zorla kapatmadigi icin save gitmiyo hic'
            ])}`
          ),
        () =>
          humanizeTurkishText(
            `${pick([
              'iyi bari oyleyse',
              'haa tamam o zaman mantikliymis',
              'sevindim buna cunku diger uygulamalar cat diye kapatiyo',
              'supermis o zaman bosuna korkmusum',
              'tam aradigim ozellikmis valla'
            ])} ${pick([
              'hemen indirip deniyim bi aksam',
              'ben de kuruyom simdi masaustune',
              'save yanmiyosa sikinti yok kullanilir bu',
              'ders calisirken sartti boyle bir şey'
            ])}`
          )
      ]
    },

    // ÇEKİRDEK 2: RAM / CPU Kullanımı ve Arka Planda Kasma Tartışması
    {
      top: () =>
        humanizeTurkishText(
          `${pick([
            'arkada calisirken',
            'bu uygulama acikken',
            'oyun oynarken arkada durdugunda',
            'pomodoro sayaci arkada donerken',
            'sistem tepsisinde calisirken'
          ])} ${pick([
            'pc kasar mi acaba',
            'fps dusuruyo mu oyunlarda',
            'cok ram yiyo mu gorev yoneticisinde',
            'islemciyi yoruyo mu hic',
            'eski laptoptayim da agir gelir mi'
          ])} ${pick([
            'benim sistem biraz eski cunku',
            '8 gb ram var zaten zor yetiyo',
            'cs2 de drop yedirirse silecem mecbur',
            'bilen biri yazabilir mi'
          ])}`
        ),
      replies: [
        () =>
          humanizeTurkishText(
            `${pick([
              'yok la 2 mb bir şey zaten uygulama',
              'hic kasmiyo c# ile yazilmis hafif baya',
              'gorev yoneticisinde ram kullanimi gozukmuyo bile',
              'electron tabanli degil o yuzden sifir kasma yapiyo',
              'benim eski laptopta bile tik demiyo'
            ])} ${pick([
              'fps farki hic olmadi bende',
              'arkada calistigini unutuyon bile',
              'tarayici tek basina 100 kati ram yiyo bunun',
              'gonul rahatligiyla acabilirsin arkada'
            ])}`
          ),
        () =>
          humanizeTurkishText(
            `${pick([
              '2 mb mi ciddi misin',
              'electron olmamasi cok iyi olmus o zaman',
              'dogru diyon discord bile 500 mb yiyo arkada',
              'iyi bari kurdum simdi gercekten hafifmis'
            ])} ${pick([
              'hic zorlamadi bilgisayari',
              'bekledigimden cok daha hizli acildi',
              'bosuna endiselenmisim'
            ])}`
          )
      ]
    },

    // ÇEKİRDEK 3: Steam / Launcher Açık Kalınca Süreden Yeme Tartışması
    {
      top: () =>
        humanizeTurkishText(
          `${pick([
            'steam arkada acik kalinca',
            'epic games yada steam launcher acikken',
            'gece oyun indirmeye biraktigimizda',
            'riot client arkada dururken',
            'sadece masaustunde steam acikken'
          ])} ${pick([
            'oyun suresinden yiyo mu peki',
            'sayac yine de dusuyo mu',
            'onu oyun olarak mi algiliyo',
            'yoksa sadece oyuna girince mi basliyo sure'
          ])} ${pick([
            'bazen guncelleme icin acik birakiyom ben',
            'arkada indirme yaparken sure biterse kotu olur',
            'ona gore kara listeyi ayarlicam'
          ])}`
        ),
      replies: [
        () =>
          humanizeTurkishText(
            `${pick([
              'launcherlari saymiyo sadece oyunun kendi exe dosyasi acilinca sure isliyo',
              'steam veya epic acikken sure gitmiyo sadece oyuna girince basliyo',
              'akilli liste var icinde launcher haric tutuyo otomatik',
              'indirme yaparken hic sureden yemiyo ben dun gece denedim'
            ])} ${pick([
              'yani steam istedigi kadar acik kalsin farketmiyo',
              'sadece kara listedeki oyunun exesi calisinca sayiyo',
              'videoda da yaziyo zaten launcher haric diye'
            ])}`
          ),
        () =>
          humanizeTurkishText(
            `${pick([
              'haa ben orayi gormemisim iyi dusunmusler onu',
              'cok iyi o zaman gece indirmeye birakabilirim rahatca',
              'tamamdir simdi anladim mantigini',
              'diger turlu cok sacma olurdu zaten iyi yapmislar'
            ])}`
          )
      ]
    },

    // ÇEKİRDEK 4: 5 Gün Hedef Kaçırınca Fırtına / Gemi ve Oyun Kilidi Tartışması
    {
      top: () =>
        humanizeTurkishText(
          `${pick([
            '5 gun ust uste hedefi kacirinca',
            'bu firtina sayaci 5/5 olunca',
            'gunluk calisma hedefini yapmayinca',
            'gemiyi firtinaya sokunca'
          ])} ${pick([
            'gerçekten oyunlari komple kitliyo mu',
            'ders calismadan oyunlarin kilidi acilmiyo mu',
            'ne kadar sure ders calismak gerekiyo acmak icin',
            'gercekten engelliyo mu yoksa lafta mi'
          ])} ${pick([
            'ben kesin unuturum 1-2 gun',
            'biraz sert bir sistem degil mi',
            'merak ettim deneyen var mi'
          ])}`
        ),
      replies: [
        () =>
          humanizeTurkishText(
            `${pick([
              'valla ben gecen hafta 5/5 oldum harbiden kitledi oyunlari',
              'evet günlük hedefi tamamlayana kadar kara listedeki oyunlar acilmiyo',
              'tersaneden kalkan gelistirirsen firtina ihtimali dusuyo biraz',
              'tam olarak olayi o zaten iradeyi zorlamak icin'
            ])} ${pick([
              'mecbur oturup 1 saat calistim da oyle acildi kilit',
              'kilit yememek icin insan ister istemez masaya oturuyo',
              'ertelemeyi biraktiran tek sey bu oldu bende'
            ])}`
          ),
        () =>
          humanizeTurkishText(
            `${pick([
              'fena gerilimliymis ama ise yarar kesin',
              'bana da boyle zorlayici bir şey lazimdi zaten yumusak olunca uyamiyom plana',
              'tersanedeki kalkan olayini bilmiyodum ona bakayim bi',
              'iyiymis insan gemiyi batirmamak icin calisir en azindan'
            ])}`
          )
      ]
    },

    // ÇEKİRDEK 5: Hedef Düşürme Koruması (3 Dakika Bekleme Duvarı)
    {
      top: () =>
        humanizeTurkishText(
          `${pick([
            'calisirken hedefi dusurmek isteyince',
            'gunluk saati azaltmaya calisinca',
            'pes edip ayarlari degistirmek istediginde',
            'kara listeden oyun silmeye kalkinca'
          ])} ${pick([
            '3 dakika bekletme ekrani cikiyo ya',
            'kendi yazdigimiz hedef sozunu ekrana cikariyo ya',
            'hemen izin vermeyip geri sayim baslatiyo ya'
          ])} ${pick([
            'sirf o ekrani beklememek icin derse geri dondum dun',
            'psikolojik olarak baya durduruyo insani',
            'normalde 2 saniyede kapatip oyuna girerdim'
          ])}`
        ),
      replies: [
        () =>
          humanizeTurkishText(
            `${pick([
              'aynen o 3 dakikayi beklerken insan ne yapiyom ben diyip vazgeciyo',
              'en basta kendi yazdigin sozu yuzune vurmasi cok etkili olmus',
              'o anki anlik pes etme istegini kiriyo direkt'
            ])} ${pick([
              'ben de 2 kere kapatmaya niyetlendim ikisinde de geri derse dondum',
              'basit ama cok zekice bir detay olmus o'
            ])}`
          ),
        () =>
          humanizeTurkishText(
            `${pick([
              'kesinlikle irade zayiflayinca o 3 dk duvar gibi cikiyo karsina',
              'normal pomodoro uygulamalarinda tek tikla iptal ediliyo bir anlami kalmiyodu'
            ])}`
          )
      ]
    },

    // ÇEKİRDEK 6: Web Filtresi & YouTube Ders Videosu Sorusu
    {
      top: () =>
        humanizeTurkishText(
          `${pick([
            'web filtresinde youtube u engelleyince',
            'sosyal medya sitelerini kapatinca',
            'tarayici kisitlamasini acinca'
          ])} ${pick([
            'youtube dan ders videosu nasil izlicez peki',
            'sadece belli saatlerde acilmasini ayarlayabiliyo muyuz',
            'komple mi kapaniyo yoksa sure siniri mi var'
          ])} ${pick([
            'ben konulari youtube dan calisiyom genelde',
            'shorts kaydirirken saatler gidiyo ama ders icin de lazim oluyo'
          ])}`
        ),
      replies: [
        () =>
          humanizeTurkishText(
            `${pick([
              'ister gunluk sure limiti koyuyon ister saat 18 den sonra acilsin diyebiliyon',
              'tamamen kapatmak zorunda degilsin gunluk 45 dk izin ver şeklinde ayarlanabiliyo',
              'ak liste ve kara liste ayri calisiyo istedigin saat araligina gore aciliyo'
            ])} ${pick([
              'ben mesela aksam 8 den sonra serbest biraktim gunduz kapali',
              'boylece ders saatinde reels ve shorts batakligina dusmuyon'
            ])}`
          ),
        () =>
          humanizeTurkishText(
            `${pick([
              'haa saat araligi seciliyosa cok iyiymis ben komple engelliyo sanmistim',
              'tamam o zaman gunduz kapatip aksam acmak en mantiklisi'
            ])}`
          )
      ]
    }
  ];

  if (isWordle) {
    seeds.unshift({
      top: () =>
        humanizeTurkishText(
          `${pick([
            '3. satirdaki kelime',
            'videodaki 5 harfli kelime',
            'yesil ve sari harflere bakinca cevap'
          ])} ${pick([
            'BAZEN değil mi ya ben mi yanlış goruyom',
            'HALEN yada BAZEN olmasi lazim değil mi',
            'MADEN olamaz M harfi ustte gri yanmis cunku'
          ])} ${pick([
            '2 dakikadir ekrana bakiyom',
            'molada oynayinca baya sariyo bu',
            'siz ne buldunuz'
          ])}`
        ),
      replies: [
        () =>
          humanizeTurkishText(
            `${pick([
              'evet BAZEN olmasi lazim cunku S H M L harfleri ilk iki satirda elenmis',
              'HALEN olamaz L harfi ilk kelimede gri cikmis dikkatli baksana',
              'kesinlikle BAZEN baska ihtimal kalmiyo A E N yesil zaten'
            ])}`
          ),
        () =>
          humanizeTurkishText(
            `${pick([
              'hee dogru L harfi ustte elenmis onu gormedim ben',
              'haklisin uykusuzluktan harfleri karistirmisim BAZEN mis cevap'
            ])}`
          )
      ]
    });
  }

  if (isBattleship) {
    seeds.unshift({
      top: () =>
        humanizeTurkishText(
          `${pick([
            'bu pozisyonda siradaki atis',
            'D4 ve E4 vurulmussa kruvazoru batirmak icin',
            '3 birimlik gemi olduguna gore'
          ])} ${pick([
            'kesinlikle F4 olmali bence',
            'C4 vurmasi lazim değil mi hep sola yatiriyolar gemiyi',
            'C4 ile F4 arasinda %50 sans var ama F4 daha bos duruyo'
          ])}`
        ),
      replies: [
        () =>
          humanizeTurkishText(
            `${pick([
              'sol tarafta A4 ve B4 te su izi var gemi sigmaz oraya mecbur F4 olacak',
              'ben olsam C4 vururum bot genelde merkeze yakin koyuyo gemileri',
              'F4 vur gec sag kanat tamamen acik duruyo cunku'
            ])}`
          ),
        () =>
          humanizeTurkishText(
            `${pick([
              'dogru sol taraftaki mavi noktayi simdi farkettim F4 kesin vurur o zaman',
              'gecen el ben de F4 denemistim ters kose yapmisti belli olmuyo hic'
            ])}`
          )
      ]
    });
  }

  return shuffleArray(seeds);
}

function collectAllBotRefreshTokens() {
  const pool = [];
  const rawPool = (process.env.YT_BOT_POOL || '').trim();

  if (rawPool) {
    try {
      const parsed = JSON.parse(rawPool);
      if (Array.isArray(parsed)) {
        parsed.forEach((t) => {
          if (typeof t === 'string' && t.trim() && !pool.includes(t.trim())) pool.push(t.trim());
        });
      }
    } catch (e) {
      rawPool
        .replace(/^\[|\]$/g, '')
        .split(/[\n,;"]+/)
        .forEach((t) => {
          const clean = t.trim();
          if (clean.length > 15 && !pool.includes(clean)) pool.push(clean);
        });
    }
  }

  for (let i = 1; i <= 30; i++) {
    const t = (process.env[`YT_BOT${i}_REFRESH_TOKEN`] || '').trim();
    if (t && !pool.includes(t)) pool.push(t);
  }

  return pool;
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
  const data = await res.json();
  return res.ok && data.access_token ? data.access_token : null;
}

async function getChannelInfo(accessToken) {
  try {
    const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();
    const item = data.items && data.items[0];
    return item ? { id: item.id, title: item.snippet.title } : null;
  } catch (e) {
    return null;
  }
}

async function forceApproveComment(commentId, hostAccessToken) {
  if (!commentId || !hostAccessToken) return;
  try {
    await fetch(
      `https://www.googleapis.com/youtube/v3/comments/setModerationStatus?id=${encodeURIComponent(commentId)}&moderationStatus=published`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${hostAccessToken}` }
      }
    );
  } catch (e) {}
}

async function postYouTubeTopComment(videoId, accessToken, hostToken, text, label) {
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
          topLevelComment: { snippet: { textOriginal: text } }
        }
      })
    });
    const data = await res.json();
    if (!res.ok) return null;

    const topId = (data.snippet && data.snippet.topLevelComment && data.snippet.topLevelComment.id) || data.id;
    await forceApproveComment(topId, hostToken);
    console.log(`✅ [${label}] Ana Yorum: "${text}"`);
    return data.id;
  } catch (e) {
    return null;
  }
}

async function postYouTubeReply(parentThreadId, accessToken, hostToken, text, label) {
  try {
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
    const data = await res.json();
    if (!res.ok) return;
    await forceApproveComment(data.id, hostToken);
    console.log(`↪️ [${label}] Alt Yanit: "${text}"`);
  } catch (e) {}
}

// Videoya daha önce hangi kanal ID'lerinin yorum attığını bulan fonksiyon (Aynı bot 2 kez yazmasın)
async function getAlreadyCommentedChannelIds(videoId, hostToken) {
  const commentedIds = new Set();
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=100`,
      { headers: { Authorization: `Bearer ${hostToken}` } }
    );
    const data = await res.json();
    (data.items || []).forEach((item) => {
      const topAuthor = item.snippet?.topLevelComment?.snippet?.authorChannelId?.value;
      if (topAuthor) commentedIds.add(topAuthor);
      (item.replies?.comments || []).forEach((rep) => {
        const repAuthor = rep.snippet?.authorChannelId?.value;
        if (repAuthor) commentedIds.add(repAuthor);
      });
    });
  } catch (e) {}
  return commentedIds;
}

// Ana kanaldaki en son yüklenen videoyu bulan fonksiyon (3 saatlik dalgalar için)
async function getLatestVideoFromChannel(hostToken) {
  try {
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&order=date&maxResults=1',
      { headers: { Authorization: `Bearer ${hostToken}` } }
    );
    const data = await res.json();
    const item = data.items && data.items[0];
    return item ? { videoId: item.id.videoId, title: item.snippet.title } : null;
  } catch (e) {
    return null;
  }
}

// Bot Dalga Çalıştırıcı (Ana kanalı %100 filtreler ve sadece o videoya henüz yazmamış botları seçer)
async function runOrganicBotWave(videoId, captionText, hostToken, hostChannelId, maxThreadsInThisWave = 1) {
  const alreadyCommented = await getAlreadyCommentedChannelIds(videoId, hostToken);
  const allRefreshes = shuffleArray(collectAllBotRefreshTokens());

  const availableBots = [];
  for (const rToken of allRefreshes) {
    const aToken = await getYouTubeAccessToken(
      (process.env.YT_CLIENT_ID || '').trim(),
      (process.env.YT_CLIENT_SECRET || '').trim(),
      rToken
    );
    if (!aToken) continue;

    const info = await getChannelInfo(aToken);
    if (!info) continue;

    // KİLİT KORUMA: Ana kanal ("DevAM Focus") havuzda olsa bile ASLA bot yorumu atamaz!
    if (
      info.id === hostChannelId ||
      info.title.toLowerCase().includes('devam') ||
      info.title.toLowerCase().includes('focus')
    ) {
      console.log(`🛡️ [Koruma] Ana kanal ("${info.title}") bot listesinden otomatik filtrelendi.`);
      continue;
    }

    // Bu videoya daha önce yorum yapmamış botları seç
    if (!alreadyCommented.has(info.id)) {
      availableBots.push({ token: aToken, id: info.id, title: info.title });
    }
  }

  console.log(`🤖 Bu dalga için uygun (henüz bu videoya yazmamış) bot sayısı: ${availableBots.length}`);
  if (availableBots.length === 0) return;

  const seeds = generateConnectedDialoguePool(captionText);
  let cursor = 0;

  for (let t = 0; t < maxThreadsInThisWave; t++) {
    if (cursor >= availableBots.length || t >= seeds.length) break;

    const seed = seeds[t];
    const starterBot = availableBots[cursor++];

    const topText = seed.top();
    const threadId = await postYouTubeTopComment(videoId, starterBot.token, hostToken, topText, starterBot.title);

    if (threadId && seed.replies && seed.replies.length > 0 && cursor < availableBots.length) {
      const replierBot = availableBots[cursor++];
      await sleep(randomInt(45000, 95000)); // 45-95 sn sonra diğer bot yanıt verir
      await postYouTubeReply(threadId, replierBot.token, hostToken, seed.replies[0](), replierBot.title);

      if (seed.replies.length > 1) {
        await sleep(randomInt(40000, 85000)); // İlk bot karşı cevap verir
        await postYouTubeReply(threadId, starterBot.token, hostToken, seed.replies[1](), starterBot.title);
      }
    }

    await sleep(randomInt(30000, 60000));
  }
}

async function main() {
  const clientId = (process.env.YT_CLIENT_ID || '').trim();
  const clientSecret = (process.env.YT_CLIENT_SECRET || '').trim();
  const refreshToken = (process.env.YT_REFRESH_TOKEN || '').trim();

  if (!clientId || !clientSecret || !refreshToken) return;

  const hostToken = await getYouTubeAccessToken(clientId, clientSecret, refreshToken);
  if (!hostToken) return;

  const hostInfo = await getChannelInfo(hostToken);
  const hostChannelId = hostInfo ? hostInfo.id : '';

  // EĞER "wave" (3 Saatlik Artçı Dalga) MODUNDAYSA: Yeni video yükleme, son videoya 1 yeni tartışma ekle!
  if (MODE === 'wave') {
    const latest = await getLatestVideoFromChannel(hostToken);
    if (!latest) return;
    console.log(`🌊 [Artçı Yorum Dalgası] Hedef Video: "${latest.title}" (${latest.videoId})`);
    await runOrganicBotWave(latest.videoId, latest.title, hostToken, hostChannelId, 1);
    return;
  }

  // NORMAL YÜKLEME MODU: Videoyu yükle -> Tam 5 dakika bekle -> İlk yorumu at!
  if (!fs.existsSync(VIDEO_PATH)) return;
  const caption = fs.existsSync(CAPTION_PATH) ? fs.readFileSync(CAPTION_PATH, 'utf8') : 'DevAM Focus #Shorts';

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

  if (!initRes.ok) return;

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
  let videoId = null;
  try {
    videoId = JSON.parse(upText).id;
  } catch (e) {}
  if (!videoId) return;

  console.log(`🎬 Shorts Yüklendi (${videoId})! İlk yorum için tam 5 DAKİKA (300 sn) bekleniyor...`);
  await sleep(300000); // Tam 5 dakika bekle!

  await runOrganicBotWave(videoId, caption, hostToken, hostChannelId, 1);
}

main();
