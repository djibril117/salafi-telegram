import { NextResponse } from 'next/server';

// Cycle sur 604 pages du Coran (environ 1 an et demi avant de recommencer)
function getPageForToday() {
  const start = new Date('2024-01-01');
  const today = new Date();
  const dayOffset = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return (dayOffset % 604) + 1;
}

async function fetchVerseFromQuran(page) {
  const url = `https://api.quran.com/api/v4/verses/by_page/${page}?translations=136&fields=text_uthmani&per_page=1`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Quran API erreur: ${res.status}`);
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
    const page = getPageForToday();
    const data = await fetchVerseFromQuran(page);

    if (!data.verses || data.verses.length === 0) {
      throw new Error('Aucun verset retourné par l\'API');
    }

    const verse = data.verses[0];
    const arabicText = verse.text_uthmani || '';
    const rawTranslation = verse.translations?.[0]?.text || '';

    // Nettoyage des balises HTML dans la traduction
    const frenchTranslation = rawTranslation.replace(/<[^>]*>/g, '').trim();
    const verseKey = verse.verse_key || `page ${page}`;

    const message =
      `📖 <b>Verset du Jour</b>\n\n` +
      `${arabicText}\n\n` +
      `🇫🇷 <i>${frenchTranslation}</i>\n\n` +
      `📍 ${verseKey}\n\n` +
      `#Coran #Islam #VersetDuJour`;

    await postToTelegram(
      process.env.TELEGRAM_BOT_VERSET_TOKEN,
      process.env.TELEGRAM_CHANNEL_VERSET,
      message
    );

    console.log(`✅ Verset posté: ${verseKey}`);
    return NextResponse.json({ success: true, verse: verseKey });

  } catch (error) {
    console.error('❌ Erreur verset:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
