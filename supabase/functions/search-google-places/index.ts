const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

const SEARCH_RADIUS_METERS = 50000;

type PlaceResult = {
  id: string;
  name: string;
  address: string;
  category: string;
  rating: number | null;
  reviewCount: number | null;
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  provider: 'google';
  raw: Record<string, unknown>;
};

type RequestBody = {
  category: string;
  option: string;
  query?: string;
  latitude: number;
  longitude: number;
  city?: string;
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function normalizeText(value: string) {
  return String(value)
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

function getGooglePlaceType(category: string) {
  const types: Record<string, string> = {
    restaurants: 'restaurant',
    cafes: 'cafe',
    garages: 'car_repair',
    clinics_hospitals: 'hospital',
    entertainment_parks: 'tourist_attraction',
  };

  return types[category] ?? 'point_of_interest';
}

function getFallbackText(category: string) {
  const fallback: Record<string, string> = {
    restaurants: 'restaurant',
    cafes: 'cafe',
    garages: 'car repair garage',
    clinics_hospitals: 'hospital clinic',
    entertainment_parks: 'tourist attraction park',
  };

  return fallback[category] ?? 'place';
}

function isSpecificSearch(option: string) {
  if (!option || option === 'أفضل اختيار') return false;

  const normalized = normalizeText(option);

  const generalOptions = [
    'مطاعم',
    'كافيهات',
    'كراجات',
    'عيادات',
    'مستشفيات',
    'ترفيه',
    'منتزهات',
  ];

  return !generalOptions.some((item) =>
    normalized.includes(normalizeText(item))
  );
}

function getPrimarySearchText(category: string, option: string) {
  const normalized = normalizeText(option);

  if (normalized.includes('سوداني')) {
    return 'مطعم سوداني Sudanese restaurant Sudanese food';
  }

  const map: Record<string, string> = {
    عربي: 'Arabic restaurant Middle Eastern restaurant',
    هندي: 'Indian restaurant',
    باكستاني: 'Pakistani restaurant',
    صيني: 'Chinese restaurant',
    تركي: 'Turkish restaurant',
    إيراني: 'Iranian Persian restaurant',
    مصري: 'Egyptian restaurant',
    شاورما: 'shawarma restaurant',
    برجر: 'burger restaurant',
    مندي: 'mandi restaurant Yemeni mandi',
    بحري: 'seafood restaurant fish restaurant',
    مشاوي: 'grill barbecue restaurant',
    نباتي: 'vegetarian restaurant vegan restaurant',

    هادئ: 'quiet cafe',
    'مناسب للعمل والدراسة': 'laptop friendly cafe study cafe coworking cafe',
    'مناسب للعائلات': 'family cafe',
    'جلسات خارجية': 'outdoor cafe terrace cafe',
    'مناسب للتصوير': 'instagram cafe beautiful cafe',

    Toyota: 'Toyota garage repair',
    Lexus: 'Lexus garage repair',
    Nissan: 'Nissan garage repair',
    Infiniti: 'Infiniti garage repair',
    GMC: 'GMC garage repair',
    Chevrolet: 'Chevrolet garage repair',
    Ford: 'Ford garage repair',
    Mercedes: 'Mercedes garage repair',
    BMW: 'BMW garage repair',
    Audi: 'Audi garage repair',

    'فحص كمبيوتر': 'car computer diagnostic OBD scan',
    'فحص شامل': 'vehicle inspection car inspection',
    'فحص قبل الشراء': 'pre purchase car inspection',
    'صيانة دورية': 'car service maintenance',
    'تبديل زيوت': 'oil change car service',
    'قير / جير': 'transmission repair gearbox repair',
    مكينة: 'engine repair garage',
    'كهرباء سيارات': 'auto electrical car electrician',
    'مكيفات سيارات': 'car AC repair',
    بطارية: 'car battery replacement',
    إطارات: 'tyre tire shop',

    مستشفى: 'hospital',
    طوارئ: 'emergency hospital emergency room',
    'عيادة عامة': 'medical clinic general clinic',
    أسنان: 'dentist dental clinic',
    جلدية: 'dermatology clinic',
    عيون: 'eye clinic ophthalmology',
    أطفال: 'pediatric clinic',
    عظام: 'orthopedic clinic',
    مختبر: 'medical laboratory',

    'حدائق ومنتزهات': 'park garden',
    منتزهات: 'park',
    حدائق: 'garden park',
    شواطئ: 'beach',
    مولات: 'shopping mall',
    سينما: 'cinema movie theater',
    ممشى: 'walkway promenade corniche',
    'أماكن سياحية': 'tourist attraction landmark',
  };

  if (option && option !== 'أفضل اختيار' && map[option]) {
    return map[option];
  }

  return getFallbackText(category);
}

function getSearchQueries(body: RequestBody) {
  const city = body.city ?? 'United Arab Emirates';
  const customQuery = body.query?.trim();

  if (customQuery) {
    return [
      `${customQuery} في ${city}`,
      `${customQuery} in ${city}`,
    ];
  }

  const option = body.option;
  const normalized = normalizeText(option);
  const primary = getPrimarySearchText(body.category, option);

  if (normalized.includes('سوداني')) {
    return [
      `مطعم سوداني في ${city}`,
      `Sudanese restaurant in ${city}`,
      `Sudanese food in ${city}`,
      `Sudan cuisine restaurant in ${city}`,
    ];
  }

  if (option === 'مناسب للعمل والدراسة') {
    return [
      `laptop friendly cafe in ${city}`,
      `study cafe in ${city}`,
      `coworking cafe in ${city}`,
      `quiet cafe workspace in ${city}`,
    ];
  }

  if (isSpecificSearch(option)) {
    return [
      `${primary} in ${city}`,
      `${option} in ${city}`,
    ];
  }

  return [`${primary} in ${city}`];
}

function getOptionKeywords(optionOrQuery: string) {
  const normalized = normalizeText(optionOrQuery);

  if (normalized.includes('سوداني')) {
    return ['sudanese', 'sudan', 'سوداني', 'مطعم سوداني'];
  }

  const keywords: Record<string, string[]> = {
    هندي: ['indian', 'هندي'],
    عربي: ['arabic', 'arab', 'middle eastern', 'عربي'],
    باكستاني: ['pakistani', 'باكستاني'],
    صيني: ['chinese', 'صيني'],
    تركي: ['turkish', 'تركي'],
    إيراني: ['iranian', 'persian', 'ايراني', 'إيراني'],
    مصري: ['egyptian', 'مصري'],
    شاورما: ['shawarma', 'شاورما'],
    برجر: ['burger', 'برجر'],
    مندي: ['mandi', 'مندي'],
    بحري: ['seafood', 'fish', 'بحري', 'سمك'],
    مشاوي: ['grill', 'barbecue', 'bbq', 'مشاوي'],
    نباتي: ['vegetarian', 'vegan', 'نباتي'],

    Infiniti: ['infiniti'],
    Toyota: ['toyota'],
    Nissan: ['nissan'],
    GMC: ['gmc'],
    Chevrolet: ['chevrolet', 'chevy'],
    Ford: ['ford'],
    Mercedes: ['mercedes', 'benz'],
    BMW: ['bmw'],
    Audi: ['audi'],

    أسنان: ['dentist', 'dental', 'اسنان', 'أسنان'],
    مستشفى: ['hospital', 'مستشفى'],
    طوارئ: ['emergency', 'طوارئ'],
    جلدية: ['dermatology', 'جلدية'],
    عيون: ['eye', 'ophthalmology', 'عيون'],
    أطفال: ['pediatric', 'children', 'اطفال', 'أطفال'],
    عظام: ['orthopedic', 'عظام'],

    سينما: ['cinema', 'movie', 'سينما'],
    مولات: ['mall', 'shopping', 'مول'],
    شواطئ: ['beach', 'شاطئ'],
    حدائق: ['garden', 'park', 'حديقة'],
    منتزهات: ['park', 'منتزه'],
  };

  for (const [key, value] of Object.entries(keywords)) {
    if (normalized.includes(normalizeText(key))) {
      return value;
    }
  }

  return [];
}

function shouldStrictlyFilterOption(optionOrQuery: string) {
  const normalized = normalizeText(optionOrQuery);

  const strictOptions = [
    'سوداني',
    'هندي',
    'باكستاني',
    'صيني',
    'تركي',
    'ايراني',
    'إيراني',
    'مصري',
    'شاورما',
    'برجر',
    'مندي',
    'بحري',
    'مشاوي',
    'نباتي',
  ];

  return strictOptions.some((item) =>
    normalized.includes(normalizeText(item))
  );
}

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const earthRadius = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c);
}

function removeDuplicates(items: any[]) {
  const map = new Map<string, any>();

  for (const item of items) {
    const key = String(
      item.place_id ?? `${item.name}_${item.formatted_address ?? item.vicinity ?? ''}`
    );

    if (!map.has(key)) map.set(key, item);
  }

  return Array.from(map.values());
}

function getSearchableTextFromGoogleItem(item: any) {
  return normalizeText(
    [
      item.name,
      item.formatted_address,
      item.vicinity,
      Array.isArray(item.types) ? item.types.join(' ') : '',
      item.business_status,
    ]
      .filter(Boolean)
      .join(' ')
  );
}

function getOptionMatchLevel(item: any, optionOrQuery: string) {
  if (!optionOrQuery || optionOrQuery === 'أفضل اختيار') return 1;

  const keywords = getOptionKeywords(optionOrQuery);

  if (!keywords.length) return 1;

  const text = getSearchableTextFromGoogleItem(item);
  const normalizedKeywords = keywords.map(normalizeText);

  const exact = normalizedKeywords.some((keyword) => text.includes(keyword));

  if (exact) return 3;

  return 0;
}

function getMatchLabel(optionLevel: number) {
  if (optionLevel >= 3) return 'مطابقة عالية';
  if (optionLevel >= 1) return 'مطابقة عامة';
  return 'مطابقة ضعيفة';
}

function normalizeGoogleResult(item: any, body: RequestBody): PlaceResult {
  const lat =
    typeof item.geometry?.location?.lat === 'number'
      ? item.geometry.location.lat
      : null;

  const lng =
    typeof item.geometry?.location?.lng === 'number'
      ? item.geometry.location.lng
      : null;

  const distance =
    lat !== null && lng !== null
      ? distanceMeters(body.latitude, body.longitude, lat, lng)
      : null;

  const searchTerm = body.query?.trim() || body.option;
  const optionLevel = getOptionMatchLevel(item, searchTerm);

  return {
    id: String(item.place_id ?? `${item.name}_${lat}_${lng}`),
    name: String(item.name ?? 'مكان بدون اسم'),
    address: String(item.formatted_address ?? item.vicinity ?? 'لا يوجد عنوان'),
    category: body.category,
    rating: typeof item.rating === 'number' ? item.rating : null,
    reviewCount:
      typeof item.user_ratings_total === 'number'
        ? item.user_ratings_total
        : null,
    distance,
    latitude: lat,
    longitude: lng,
    provider: 'google',
    raw: {
      ...item,
      wenbest_source: 'supabase_google_places',
      wenbest_option: body.option,
      wenbest_query: body.query ?? '',
      wenbest_option_match_level: optionLevel,
      wenbest_match_label: getMatchLabel(optionLevel),
    },
  };
}

async function googleTextSearch(query: string, body: RequestBody) {
  const url =
    `https://maps.googleapis.com/maps/api/place/textsearch/json` +
    `?query=${encodeURIComponent(query)}` +
    `&location=${body.latitude},${body.longitude}` +
    `&radius=${SEARCH_RADIUS_METERS}` +
    `&language=ar` +
    `&region=ae` +
    `&key=${GOOGLE_PLACES_API_KEY}`;

  const response = await fetch(url);
  const json = await response.json();

  if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(
      `Google Text Search error: ${json.status}${
        json.error_message ? ` - ${json.error_message}` : ''
      }`
    );
  }

  return Array.isArray(json.results) ? json.results : [];
}

async function googleNearbySearch(body: RequestBody) {
  const placeType = getGooglePlaceType(body.category);
  const keyword = getPrimarySearchText(body.category, body.option);

  const url =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${body.latitude},${body.longitude}` +
    `&radius=${SEARCH_RADIUS_METERS}` +
    `&keyword=${encodeURIComponent(keyword)}` +
    `&type=${encodeURIComponent(placeType)}` +
    `&language=ar` +
    `&region=ae` +
    `&key=${GOOGLE_PLACES_API_KEY}`;

  const response = await fetch(url);
  const json = await response.json();

  if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(
      `Google Nearby Search error: ${json.status}${
        json.error_message ? ` - ${json.error_message}` : ''
      }`
    );
  }

  return Array.isArray(json.results) ? json.results : [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Missing GOOGLE_PLACES_API_KEY secret');
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        },
      });
    }

    const body = (await req.json()) as RequestBody;

    if (
      !body.category ||
      !body.option ||
      typeof body.latitude !== 'number' ||
      typeof body.longitude !== 'number'
    ) {
      throw new Error('Missing required search parameters');
    }

    const queries = getSearchQueries(body);

    const textResultsGroups = await Promise.all(
      queries.map((query) => googleTextSearch(query, body))
    );

    let mergedRaw = removeDuplicates(textResultsGroups.flat());

    if (!body.query?.trim() && !isSpecificSearch(body.option)) {
      const nearbyResults = await googleNearbySearch(body);
      mergedRaw = removeDuplicates([...mergedRaw, ...nearbyResults]);
    }

    let normalized = mergedRaw
      .map((item) => normalizeGoogleResult(item, body))
      .filter((place) => {
        if (place.distance === null) return false;
        return place.distance <= SEARCH_RADIUS_METERS;
      });

    const strictTarget = body.query?.trim() || body.option;

    if (shouldStrictlyFilterOption(strictTarget)) {
      const exactOnly = normalized.filter(
        (place) => (place.raw?.wenbest_option_match_level as number) >= 3
      );

      if (exactOnly.length > 0) {
        normalized = exactOnly;
      }
    }

    normalized = normalized.sort((a, b) => {
      const aLevel = (a.raw?.wenbest_option_match_level as number) ?? 0;
      const bLevel = (b.raw?.wenbest_option_match_level as number) ?? 0;

      if (bLevel !== aLevel) return bLevel - aLevel;

      const aRating = a.rating ?? 0;
      const bRating = b.rating ?? 0;

      if (bRating !== aRating) return bRating - aRating;

      const aReviews = a.reviewCount ?? 0;
      const bReviews = b.reviewCount ?? 0;

      if (bReviews !== aReviews) return bReviews - aReviews;

      const aDistance = a.distance ?? SEARCH_RADIUS_METERS;
      const bDistance = b.distance ?? SEARCH_RADIUS_METERS;

      return aDistance - bDistance;
    });

    return new Response(JSON.stringify({ places: normalized }), {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        },
      }
    );
  }
});