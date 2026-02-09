# Netlify Deployment Setup

## Issue: Secret Detection in Built Files

Netlify's security scanner detects `VITE_SUPABASE_ANON_KEY` in the built `dist/` folder and flags it as a potential secret. However, this is a **false positive** because:

- Supabase anon keys are **designed to be public** and safe to expose in client-side code
- They are protected by **Row Level Security (RLS)** policies in Supabase
- They are meant to be embedded in your JavaScript bundle

## Solution

### 1. Configuration Files Created

We've created two configuration files:

#### `netlify.toml`
- Configures build command and publish directory
- Sets up SPA routing (redirects all routes to `index.html`)
- Adds security headers
- Specifies Node.js version

#### `.netlify/audit-ignore.json`
- Explicitly tells Netlify to ignore Supabase public keys
- Whitelists the `VITE_SUPABASE_ANON_KEY` pattern
- Includes justification for why these are safe to expose

### 2. Netlify Dashboard Configuration

#### Step 1: Set Environment Variables

In your Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add the following variables:
   ```
   VITE_SUPABASE_URL = https://oorilcytrytxhffindgy.supabase.co
   VITE_SUPABASE_ANON_KEY = your_anon_key_here
   ```

#### Step 2: Disable Sensitive Variable Scanning (if needed)

If the audit-ignore file doesn't work:

1. Go to **Site settings** → **Build & deploy** → **Build settings**
2. Scroll to **Sensitive variable policy**
3. Either:
   - Select **"Don't block builds"** for this project
   - Or contact Netlify support to whitelist your Supabase anon key

### 3. Alternative Solutions

#### Option A: Use Netlify's Secret Detection Override

If you have access to Netlify's secret detection settings:

1. Navigate to **Site settings** → **Build & deploy** → **Post processing**
2. Find **Secret detection**
3. Add an exception for Supabase anon keys

#### Option B: Contact Netlify Support

If automated solutions don't work:

1. Create a support ticket explaining:
   - Supabase anon keys are public by design
   - They are protected by RLS policies
   - They need to be embedded in client code
2. Request whitelisting for your specific anon key

### 4. Verify the Fix

After deploying:

1. Check the deploy log for any secret detection warnings
2. Verify the site builds successfully
3. Test that your Supabase connection works in production

## Security Notes

### What's Safe to Expose

✅ **VITE_SUPABASE_URL** - Public Supabase project URL
✅ **VITE_SUPABASE_ANON_KEY** - Public anon key (protected by RLS)

### What Should Stay Secret

❌ **BGG_API_TOKEN** - Should only be used in Supabase Edge Functions
❌ **BARCODELOOKUP_API_KEY** - Should only be used in Supabase Edge Functions
❌ **UPCGAME_API_KEY** - Should only be used in Supabase Edge Functions
❌ **SUPABASE_SERVICE_ROLE_KEY** - Never expose this (admin access)

### Edge Functions Handle Secrets

All sensitive API keys (BGG, BarcodeLookup, GameUPC) are stored as secrets in Supabase Edge Functions:

- `supabase/functions/bgg-lookup/` - Uses `BGG_API_TOKEN`
- `supabase/functions/barcode-lookup/` - Uses `BARCODELOOKUP_API_KEY` and `UPCGAME_API_KEY`

These secrets are set in Supabase dashboard under **Edge Functions** → **Secrets**, not in Netlify.

## Troubleshooting

### Build still fails with secret detection

1. Double-check that `.netlify/audit-ignore.json` exists
2. Verify the pattern matches your key format
3. Try the "Don't block builds" option in Netlify settings
4. Contact Netlify support with details about Supabase anon keys

### Environment variables not working

1. Ensure variables are set in Netlify dashboard
2. Check that variable names start with `VITE_`
3. Verify variables are available to the build command
4. Try triggering a clear cache and rebuild

### Production site can't connect to Supabase

1. Check browser console for errors
2. Verify Supabase URL and anon key are correct
3. Ensure RLS policies are configured correctly
4. Check Supabase dashboard for API usage logs
