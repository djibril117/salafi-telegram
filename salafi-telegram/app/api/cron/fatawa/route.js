import { NextResponse } from 'next/server';

// Requêtes de recherche ciblées — rotation jour par jour
// Uniquement des savants reconnus sur le minhaj salafi
const SEARCH_QUERIES = [
  'فتاوى الشيخ صالح الفوزان',
  'فتاوى الشيخ عبد الرزاق البدر',
  'فتاوى الشيخ ابن باز',
  'فتاوى الشيخ ابن عثيمين',
  'فتاوى الشيخ الألباني',
  'فتاوى الشيخ ربيع المدخلي',
  'فتاوى الشيخ صالح اللحيدان',
];

async function searchYouTube(query) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'video');
  url.searchParams.set('order', 'date');
  url.searchParams.set('maxResults', '5');
  url.searchParams.set('relevanceLanguage', 'ar');
  url.searchParams.set('key', process.env.YOUTUBE_API_KEY);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`YouTube API erreur: ${res.status}`);
  return res.json();
}

async function postToTelegram(token, channelUsername, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: `@${channelUsername}`,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram erreur: ${JSON.stringify(data)}`);
  return data;
}

export async function GET(request) {
  // Sécurité : seul Vercel Cron peut appeler cette route
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    // Rotation de la requête selon le jour
    const dayOffset = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const query = SEARCH_QUERIES[dayOffset % SEARCH_QUERIES.length];

    const data = await searchYouTube(query);
    const videos = data.items || [];

    if (videos.length === 0) {
      throw new Error('Aucune vidéo trouvée pour: ' + query);
    }

    // Prendre la vidéo la plus récente
    const video = videos[0];
    const videoId = video.id?.videoId;
    if (!videoId) throw new Error('ID vidéo manquant');

    const title = video.snippet?.title || 'Fatawa';
    const channelName = video.snippet?.channelTitle || '';
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const message =
      `🎓 <b>Fatawa du Jour</b>\n\n` +
      `📌 ${title}\n\n` +
      `👤 <i>${channelName}</i>\n\n` +
      `🔗 ${videoUrl}\n\n` +
      `#Fatawa #Salafi #Islam`;

    await postToTelegram(
      process.env.TELEGRAM_BOT_FATAWA_TOKEN,
      process.env.TELEGRAM_CHANNEL_FATAWA,
      message
    );

    console.log(`✅ Fatawa postée: ${title}`);
    return NextResponse.json({ success: true, videoId, title });

  } catch (error) {
    console.error('❌ Erreur fatawa:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
