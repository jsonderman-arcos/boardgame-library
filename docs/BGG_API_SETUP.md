# BGG API Integration - Secure Setup Guide

## Overview

Your BGG API token is now stored securely on the server-side using Supabase Edge Functions. This prevents the token from being exposed in client-side code while still allowing all users to perform BGG lookups.

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Browser   │────────>│  Edge Function   │────────>│  BGG API    │
│ (Your App)  │         │  (with token)    │         │  (Secure)   │
└─────────────┘         └──────────────────┘         └─────────────┘
     Public                   Private                    External
```

1. **Browser** - Makes request to your Edge Function (no token needed)
2. **Edge Function** - Adds the secret BGG token and proxies to BGG API
3. **BGG API** - Returns game data
4. **Edge Function** - Parses XML and returns JSON to browser

## Quick Start

### 1. Deploy the Edge Function

```bash
# Link to your Supabase project (one-time setup)
supabase link --project-ref your-project-ref

# Set your BGG API token as a secret
supabase secrets set BGG_API_TOKEN=your-bgg-api-token-here

# Deploy the function
supabase functions deploy bgg-lookup
```

### 2. Use in Your Code

Replace direct BGG API calls with the new secure helper functions:

#### Old Code (GameUPC only):
```typescript
import { lookupBarcode } from './lib/games';

const gameData = await lookupBarcode(barcode);
// Only returns: { barcode, name, bgg_id }
```

#### New Code (GameUPC + Full BGG Data):
```typescript
import { lookupBarcodeWithBgg } from './lib/bgg';

const gameData = await lookupBarcodeWithBgg(barcode);
// Returns: {
//   barcode,
//   bgg_id,
//   name,
//   year,
//   publisher,
//   cover_image,
//   min_players,
//   max_players,
//   playtime_minutes,
//   min_age,
//   game_type,
//   description
// }
```

#### Direct BGG Lookup:
```typescript
import { lookupBggGame, searchBggGames } from './lib/bgg';

// Look up by BGG ID
const game = await lookupBggGame(174430); // Gloomhaven

// Search by name
const results = await searchBggGames('Wingspan');
```

## Security Benefits

✅ **Token Protection** - BGG API token never exposed to browsers
✅ **Usage Control** - Monitor and rate-limit through single endpoint
✅ **Easy Rotation** - Update token without changing code
✅ **Audit Trail** - All requests logged in Supabase
✅ **Free Tier** - 500K function calls/month included

## Migration Checklist

- [ ] Deploy Edge Function to Supabase
- [ ] Set BGG_API_TOKEN secret
- [ ] Test Edge Function with sample BGG ID
- [ ] Update barcode scanning to use `lookupBarcodeWithBgg()`
- [ ] (Optional) Update manual entry to use BGG search
- [ ] Remove old direct BGG API calls (if any)
- [ ] Verify `.env` files are gitignored

## Testing

### Test the Edge Function

```bash
# Test locally
supabase functions serve bgg-lookup --env-file supabase/functions/.env

# In another terminal, test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/bgg-lookup' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"bggId": 174430}'
```

### Test from Your App

```typescript
// Test in browser console or component
import { lookupBggGame } from './lib/bgg';

lookupBggGame(174430).then(console.log).catch(console.error);
// Should return Gloomhaven data
```

## Monitoring & Costs

### View Logs
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click "Edge Functions" → "bgg-lookup"
4. View real-time logs and metrics

### Free Tier Limits
- **500,000 invocations/month** - ~16,000/day
- **2M compute seconds/month** - plenty for API calls
- Overage: $2 per 1M invocations (very cheap)

## Troubleshooting

### "BGG_API_TOKEN not configured"
- Run: `supabase secrets set BGG_API_TOKEN=your-bgg-api-token-here`
- Redeploy: `supabase functions deploy bgg-lookup`

### "CORS error"
- Function includes CORS headers, but check browser console
- Ensure you're using `supabase.functions.invoke()` not raw `fetch()`

### "Function not found"
- Verify deployment: `supabase functions list`
- Check project is linked: `supabase projects list`

## Next Steps

1. Consider adding caching to reduce BGG API calls:
   - Cache game data in Supabase database by BGG ID
   - Check cache before calling BGG API
   - Save 💰 and improve performance

2. Add rate limiting:
   - Track requests per user
   - Prevent abuse
   - Protect your BGG API quota

3. Enhance error handling:
   - Show user-friendly messages
   - Retry failed requests
   - Fallback to GameUPC-only data

## Reference

- **Edge Function Code**: `/supabase/functions/bgg-lookup/index.ts`
- **Client Helper**: `/src/lib/bgg.ts`
- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **BGG API Docs**: https://boardgamegeek.com/wiki/page/BGG_XML_API2
