import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type GoogleReview = {
  author_name?: string;
  rating?: number;
  relative_time_description?: string;
  text?: string;
  time?: number;
  profile_photo_url?: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: 'Method not allowed',
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const googleApiKey =
      Deno.env.get('GOOGLE_PLACES_API_KEY') ||
      Deno.env.get('GOOGLE_MAPS_API_KEY') ||
      Deno.env.get('GOOGLE_API_KEY');

    if (!googleApiKey) {
      return new Response(
        JSON.stringify({
          error:
            'Google API key is missing. Add GOOGLE_PLACES_API_KEY in Supabase secrets.',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const body = await req.json().catch(() => ({}));

    const placeId = String(
      body.placeId || body.place_id || body.id || ''
    ).trim();

    const language = String(body.language || 'ar').trim();

    if (!placeId) {
      return new Response(
        JSON.stringify({
          error: 'placeId is required',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/details/json'
    );

    url.searchParams.set('place_id', placeId);
    url.searchParams.set(
      'fields',
      'name,rating,user_ratings_total,reviews,url'
    );
    url.searchParams.set('language', language);
    url.searchParams.set('key', googleApiKey);

    const googleResponse = await fetch(url.toString());

    const googleData = await googleResponse.json();
    console.log(
  JSON.stringify(
    {
      status: googleData.status,
      result: {
        name: googleData.result?.name,
        reviewsCount: googleData.result?.reviews?.length || 0,
        userRatingsTotal: googleData.result?.user_ratings_total,
      },
    },
    null,
    2
  )
);

    if (!googleResponse.ok || googleData.status === 'REQUEST_DENIED') {
      return new Response(
        JSON.stringify({
          error:
            googleData.error_message ||
            'Google Place Details request failed.',
          googleStatus: googleData.status,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (googleData.status !== 'OK') {
      return new Response(
        JSON.stringify({
          error: `Google returned status: ${googleData.status}`,
          googleStatus: googleData.status,
          reviews: [],
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const result = googleData.result || {};
    const reviews: GoogleReview[] = Array.isArray(result.reviews)
      ? result.reviews
      : [];

    return new Response(
      JSON.stringify({
        placeId,
        name: result.name || '',
        rating: result.rating || null,
        reviewCount: result.user_ratings_total || null,
        googleMapsUrl: result.url || '',
        reviews,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected server error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});