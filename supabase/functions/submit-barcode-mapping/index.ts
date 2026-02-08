// Supabase Edge Function to submit barcode to BGG ID mapping to GameUPC
// This helps improve the GameUPC database with new mappings

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GAMEUPC_API_KEY = Deno.env.get('GAMEUPC_API_KEY');

interface SubmitMappingRequest {
  barcode: string;
  bggId: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!GAMEUPC_API_KEY) {
      console.error('GAMEUPC_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: SubmitMappingRequest = await req.json();
    const { barcode, bggId } = body;

    if (!barcode || !bggId) {
      return new Response(
        JSON.stringify({ error: 'Barcode and bggId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Submitting mapping: barcode ${barcode} -> BGG ID ${bggId}`);

    // Submit to GameUPC API endpoint: /upc/{upc}/bgg/{bgg_id}
    const gameUpcResponse = await fetch(
      `https://api.gameupc.com/v1/upc/${barcode}/bgg/${bggId}`,
      {
        method: 'POST',
        headers: {
          'x-api-key': GAMEUPC_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!gameUpcResponse.ok) {
      const errorText = await gameUpcResponse.text();
      console.error('GameUPC API error:', gameUpcResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: 'Failed to submit mapping to GameUPC',
          status: gameUpcResponse.status,
        }),
        {
          status: gameUpcResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const result = await gameUpcResponse.json();
    console.log('GameUPC submission successful:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Barcode mapping submitted successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in submit-barcode-mapping function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
