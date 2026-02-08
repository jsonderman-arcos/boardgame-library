# Manual Entry Flow Implementation

## Overview
Enhanced the Add Game process to handle failed barcode lookups by allowing users to manually search for games on BoardGameGeek, then automatically submitting new barcode mappings to GameUPC to improve the database.

## Features Implemented

### 1. **Enhanced Barcode Lookup** ([src/lib/bgg.ts](../src/lib/bgg.ts))
- Modified `lookupBarcodeWithBgg()` to track which API source was used (`gameupc`, `barcodelookup`, or `upcitemdb`)
- Returns the source in the response so we know if GameUPC found it or if a fallback was used

### 2. **GameUPC Barcode Mapping Submission** ([src/lib/bgg.ts](../src/lib/bgg.ts))
- Added `submitBarcodeToGameUpc()` function to submit new barcode→BGG ID mappings
- Calls Supabase edge function `submit-barcode-mapping`
- Non-blocking, best-effort operation (won't fail the main flow if it errors)

### 3. **Edge Function for GameUPC Submission** ([supabase/functions/submit-barcode-mapping/index.ts](../supabase/functions/submit-barcode-mapping/index.ts))
- Securely calls GameUPC API endpoint: `POST /v1/upc/{barcode}/bgg/{bgg_id}`
- Keeps API key server-side only
- Handles errors gracefully

### 4. **Redesigned Manual Entry UI** ([src/components/ManualGameEntry.tsx](../src/components/ManualGameEntry.tsx))
- **Before**: Simple form with manual text input for name, publisher, year, cover image
- **After**: Full BGG search and selection flow
  - User types game name
  - Click "Search" to query BoardGameGeek
  - Select correct game from search results
  - Auto-fills with full BGG data (publisher, year, players, playtime, categories, mechanics, etc.)
  - Preview card shows all game details before adding
  - Option to search again if wrong game selected

### 5. **Updated Add Game Handler** ([src/components/Library.tsx](../src/components/Library.tsx))
- `handleManualGameEntry()` now:
  - Accepts full BGG data structure (all fields)
  - Saves game with barcode + complete BGG metadata
  - Automatically submits barcode mapping to GameUPC (non-blocking)
- `handleScanBarcode()` now:
  - Detects when barcode was found via backup API (not GameUPC)
  - Automatically submits mapping to GameUPC for future lookups

## User Flow

### Scenario 1: Barcode Lookup Succeeds
1. User scans barcode
2. Barcode found in GameUPC/BarcodeLookup/UPCItemDB
3. BGG data enriched
4. Game added to library
5. **If source was NOT GameUPC**: Mapping submitted to GameUPC for future users

### Scenario 2: Barcode Lookup Fails (All 3 APIs Return Nothing)
1. User scans barcode
2. All 3 barcode APIs fail or return "Unknown Game"
3. **Manual Entry Modal Opens**
4. User types game name (e.g., "Ticket to Ride")
5. User clicks "Search" → BGG search returns results
6. User selects correct game from list
7. Full BGG details fetched and displayed in preview
8. User clicks "Add to Library"
9. Game saved with:
   - Original barcode
   - BGG ID
   - Complete game metadata from BGG
10. **Barcode mapping submitted to GameUPC** (barcode → BGG ID)
11. Future scans of this barcode will now work via GameUPC!

## API Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User Scans Barcode                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Barcode Lookup │
         │   Edge Function│
         └────────┬───────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
   ┌─────────┐      ┌───────────────┐
   │ GameUPC │──NO─▶│ BarcodeLookup │
   └────┬────┘      └───────┬───────┘
        │                   │
       YES                 NO
        │                   │
        │                   ▼
        │          ┌────────────┐
        │          │ UPCItemDB  │
        │          └─────┬──────┘
        │                │
        └────────┬───────┘
                 │
        ┌────────┴─────────┐
        │                  │
       YES                NO
        │                  │
        ▼                  ▼
   ┌─────────┐      ┌──────────────┐
   │ Add Game│      │ Manual Entry │
   │with BGG │      │    Modal     │
   │  Data   │      └──────┬───────┘
   └────┬────┘             │
        │                  ▼
        │           ┌─────────────┐
        │           │ BGG Search  │
        │           └──────┬──────┘
        │                  │
        │                  ▼
        │           ┌─────────────┐
        │           │ User Selects│
        │           │    Game     │
        │           └──────┬──────┘
        │                  │
        │                  ▼
        │           ┌─────────────┐
        │           │  Fetch BGG  │
        │           │   Details   │
        │           └──────┬──────┘
        │                  │
        └──────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Submit Mapping │
         │   to GameUPC   │
         │ (if not from   │
         │   GameUPC)     │
         └────────────────┘
```

## Benefits

1. **Better User Experience**: Users can now add games even when barcode lookup fails
2. **Complete Data**: Games added via manual entry have full BGG metadata (publisher, players, playtime, categories, mechanics, etc.)
3. **Improved Database**: Each manual entry submits the barcode mapping to GameUPC, improving future lookups for all users
4. **Delegation Working**: Backup APIs (BarcodeLookup, UPCItemDB) now contribute to GameUPC's database
5. **Remember Original Barcode**: Games scanned with a barcode always keep that barcode, even if added manually

## Testing

Two test scripts have been created:

1. **[test-barcode.ts](../test-barcode.ts)**: Tests successful barcode lookup with BGG enrichment
   ```bash
   npx tsx test-barcode.ts
   ```

2. **[test-manual-entry.ts](../test-manual-entry.ts)**: Tests manual entry flow when barcode fails
   ```bash
   npx tsx test-manual-entry.ts
   ```

## Files Modified

- [src/lib/bgg.ts](../src/lib/bgg.ts) - Added `submitBarcodeToGameUpc()`, updated return types
- [src/components/ManualGameEntry.tsx](../src/components/ManualGameEntry.tsx) - Complete redesign with BGG search
- [src/components/Library.tsx](../src/components/Library.tsx) - Updated handlers to submit mappings
- [supabase/functions/submit-barcode-mapping/index.ts](../supabase/functions/submit-barcode-mapping/index.ts) - New edge function

## Future Enhancements

- Add retry logic for GameUPC submission failures
- Track submission success/failure metrics
- Allow users to see which games were added via manual entry vs. barcode lookup
- Bulk barcode submission for offline mode
