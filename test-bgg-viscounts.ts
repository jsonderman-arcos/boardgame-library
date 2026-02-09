// Test script to fetch full BGG response for Viscounts of the West Kingdom

const BGG_API_TOKEN = process.env.BGG_API_TOKEN;
const BGG_API_BASE_URL = 'https://boardgamegeek.com/xmlapi2';

if (!BGG_API_TOKEN) {
  console.error('❌ BGG_API_TOKEN environment variable is required');
  console.error('Set it in your .env file or export BGG_API_TOKEN=your-token-here');
  process.exit(1);
}

async function searchBgg(gameName: string) {
  const url = `${BGG_API_BASE_URL}/search?query=${encodeURIComponent(gameName)}&type=boardgame`;

  console.log('\n=== BGG SEARCH REQUEST ===');
  console.log('URL:', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${BGG_API_TOKEN}`,
      'Accept': 'application/xml',
    },
  });

  if (!response.ok) {
    throw new Error(`BGG search failed: ${response.status} ${response.statusText}`);
  }

  const xmlText = await response.text();
  console.log('\n=== BGG SEARCH RESPONSE (XML) ===\n');
  console.log(xmlText);

  // Extract BGG ID from search results
  const idMatch = xmlText.match(/<item[^>]*id="(\d+)"/);
  return idMatch ? parseInt(idMatch[1]) : null;
}

async function getBggGameDetails(bggId: number) {
  const url = `${BGG_API_BASE_URL}/thing?id=${bggId}&stats=1`;

  console.log('\n\n=== BGG THING REQUEST ===');
  console.log('URL:', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${BGG_API_TOKEN}`,
      'Accept': 'application/xml',
    },
  });

  if (!response.ok) {
    throw new Error(`BGG lookup failed: ${response.status} ${response.statusText}`);
  }

  const xmlText = await response.text();
  console.log('\n=== BGG THING RESPONSE (FULL XML) ===\n');
  console.log(xmlText);

  return xmlText;
}

async function main() {
  try {
    const gameName = 'Viscounts of the West Kingdom';
    console.log(`Searching for: ${gameName}`);

    const bggId = await searchBgg(gameName);

    if (!bggId) {
      console.error('\nNo BGG ID found for this game');
      return;
    }

    console.log(`\n\nFound BGG ID: ${bggId}`);

    await getBggGameDetails(bggId);

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
