export type PlaceProvider = 'geoapify' | 'google';

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  category: string;
  rating: number | null;
  reviewCount: number | null;
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  provider: PlaceProvider;
  raw: any;
};

const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
const PLACES_PROVIDER = process.env.EXPO_PUBLIC_PLACES_PROVIDER ?? 'geoapify';
const SUPABASE_GOOGLE_PLACES_FUNCTION =
  process.env.EXPO_PUBLIC_SUPABASE_GOOGLE_PLACES_FUNCTION;

const SEARCH_RADIUS_METERS = 50000;

const defaultCategoryMap: Record<string, string> = {
  restaurants: 'catering.restaurant',
  cafes: 'catering.cafe',
  garages: 'building.garage,commercial.vehicle,commercial.vehicle_repair',
  clinics_hospitals: 'building.healthcare,building.hospital',
  entertainment_parks: 'leisure.park,entertainment,tourism',
};

const restaurantCategoryByOption: Record<string, string> = {
  عربي: 'catering.restaurant.arab',
  هندي: 'catering.restaurant.indian',
  باكستاني: 'catering.restaurant.pakistani',
  صيني: 'catering.restaurant.chinese',
  تركي: 'catering.restaurant.turkish',
  إيراني: 'catering.restaurant.persian',
  مصري: 'catering.restaurant.arab',
  سوداني: 'catering.restaurant.african',
  شاورما: 'catering.restaurant.arab',
  برجر: 'catering.fast_food.burger,catering.restaurant.burger',
  مندي: 'catering.restaurant.arab',
  بحري: 'catering.restaurant.seafood',
  مشاوي: 'catering.restaurant.barbecue',
  نباتي: 'catering.restaurant.vegetarian',
};

const textSearchByOption: Record<string, string> = {
  عربي: 'Arabic Middle Eastern Lebanese Syrian Levant restaurant',
  هندي: 'Indian restaurant Indian food',
  باكستاني: 'Pakistani restaurant Pakistani food',
  صيني: 'Chinese restaurant Chinese food',
  تركي: 'Turkish restaurant Turkish food',
  إيراني: 'Iranian Persian restaurant',
  مصري: 'Egyptian restaurant Egyptian food',
  سوداني: 'Sudanese restaurant Sudanese food Sudan cuisine مطعم سوداني',
  شاورما: 'shawarma restaurant',
  برجر: 'burger restaurant',
  مندي: 'mandi restaurant Yemeni food',
  بحري: 'seafood fish restaurant',
  مشاوي: 'grill barbecue BBQ restaurant',
  نباتي: 'vegetarian vegan restaurant',

  هادئ: 'quiet calm specialty coffee cafe',
  'مناسب للعمل والدراسة': 'coworking laptop friendly study workspace quiet coffee cafe',
  'مناسب للعائلات': 'family coffee cafe',
  'جلسات خارجية': 'outdoor terrace garden patio coffee cafe',
  'مناسب للتصوير': 'instagram beautiful photo specialty coffee cafe',

  Toyota: 'Toyota repair specialist garage',
  Lexus: 'Lexus repair specialist garage',
  Nissan: 'Nissan repair specialist garage',
  Infiniti: 'Infiniti repair specialist garage',
  Honda: 'Honda repair specialist garage',
  Mazda: 'Mazda repair specialist garage',
  Mitsubishi: 'Mitsubishi repair specialist garage',
  Subaru: 'Subaru repair specialist garage',
  Suzuki: 'Suzuki repair specialist garage',

  GMC: 'GMC repair specialist garage',
  Chevrolet: 'Chevrolet Chevy repair specialist garage',
  Ford: 'Ford repair specialist garage',
  Mercedes: 'Mercedes Benz repair specialist garage',
  BMW: 'BMW repair specialist garage',
  Audi: 'Audi repair specialist garage',

  'فحص كمبيوتر': 'computer diagnostic OBD scan car garage',
  'فحص شامل': 'vehicle inspection car inspection',
  'فحص قبل الشراء': 'pre purchase car inspection',
  'صيانة دورية': 'car service maintenance garage',
  'تبديل زيوت': 'oil change lube service car',
  'قير / جير': 'transmission gearbox repair garage',
  مكينة: 'engine repair mechanic garage',
  'كهرباء سيارات': 'auto electrical car electrician',
  'مكيفات سيارات': 'car AC repair auto air conditioning',
  بطارية: 'car battery replacement',
  إطارات: 'tyre tire wheel',

  مستشفى: 'hospital',
  طوارئ: 'emergency hospital emergency room',
  'عيادة عامة': 'medical clinic general clinic',
  أسنان: 'dentist dental clinic',
  جلدية: 'dermatology dermatologist clinic',
  عيون: 'eye clinic ophthalmology optometrist',
  أطفال: 'pediatric children clinic pediatrician',
  عظام: 'orthopedic orthopedics clinic',
  مختبر: 'medical laboratory lab',

  'حدائق ومنتزهات': 'park garden public park',
  منتزهات: 'park public park',
  حدائق: 'garden park',
  شواطئ: 'beach public beach',
  مولات: 'shopping mall',
  سينما: 'cinema movie theater',
  ممشى: 'walkway promenade corniche',
  'أماكن سياحية': 'tourist attraction landmark',
};

const optionKeywords: Record<string, string[]> = {
  عربي: ['arabic', 'arab', 'middle eastern', 'levant', 'lebanese', 'syrian', 'عربي'],
  هندي: ['indian', 'هندي'],
  باكستاني: ['pakistani', 'باكستاني'],
  صيني: ['chinese', 'صيني'],
  تركي: ['turkish', 'تركي'],
  إيراني: ['iranian', 'persian', 'إيراني', 'ايراني', 'فارسي'],
  مصري: ['egyptian', 'مصري'],
  سوداني: ['sudanese', 'sudan', 'مطعم سوداني', 'سوداني'],
  شاورما: ['shawarma', 'شاورما'],
  برجر: ['burger', 'برجر'],
  مندي: ['mandi', 'مندي'],
  بحري: ['seafood', 'fish', 'بحري', 'سمك', 'أسماك', 'اسماك'],
  مشاوي: ['grill', 'barbecue', 'bbq', 'مشاوي'],
  نباتي: ['vegetarian', 'vegan', 'نباتي'],

  هادئ: ['quiet', 'calm', 'specialty', 'هادئ'],
  'مناسب للعمل والدراسة': ['coworking', 'workspace', 'study', 'laptop', 'work', 'quiet', 'coffee', 'دراسة', 'عمل'],
  'مناسب للعائلات': ['family', 'عائلات', 'عائلي'],
  'جلسات خارجية': ['outdoor', 'terrace', 'garden', 'patio', 'خارجية'],
  'مناسب للتصوير': ['instagram', 'photo', 'specialty', 'beautiful', 'تصوير'],

  Toyota: ['toyota', 'تويوتا'],
  Lexus: ['lexus', 'لكزس'],
  Nissan: ['nissan', 'نيسان'],
  Infiniti: ['infiniti', 'انفينيتي', 'إنفينيتي'],
  Honda: ['honda', 'هوندا'],
  Mazda: ['mazda', 'مازدا'],
  Mitsubishi: ['mitsubishi', 'ميتسوبيشي'],
  Subaru: ['subaru', 'سوبارو'],
  Suzuki: ['suzuki', 'سوزوكي'],
  GMC: ['gmc', 'general motors', 'جي ام سي'],
  Chevrolet: ['chevrolet', 'chevy', 'شفروليه', 'شيفروليه'],
  Ford: ['ford', 'فورد'],
  Mercedes: ['mercedes', 'benz', 'مرسيدس'],
  BMW: ['bmw', 'بي ام', 'بي إم'],
  Audi: ['audi', 'اودي', 'أودي'],

  'فحص كمبيوتر': ['diagnostic', 'computer', 'scan', 'obd', 'كمبيوتر', 'فحص'],
  'فحص شامل': ['inspection', 'testing', 'فحص شامل'],
  'فحص قبل الشراء': ['inspection', 'pre purchase', 'قبل الشراء'],
  'صيانة دورية': ['service', 'maintenance', 'صيانة'],
  'تبديل زيوت': ['oil', 'lube', 'زيت', 'زيوت'],
  'قير / جير': ['transmission', 'gear', 'gearbox', 'قير', 'جير'],
  مكينة: ['engine', 'mechanic', 'مكينة', 'محرك'],
  'كهرباء سيارات': ['electrical', 'electric', 'auto electric', 'كهرباء'],
  'مكيفات سيارات': ['ac', 'a/c', 'air conditioning', 'مكيف'],
  بطارية: ['battery', 'بطارية'],
  إطارات: ['tire', 'tyre', 'wheel', 'إطارات', 'اطارات'],

  مستشفى: ['hospital', 'مستشفى'],
  طوارئ: ['emergency', 'er', 'طوارئ'],
  'عيادة عامة': ['clinic', 'medical center', 'عيادة'],
  أسنان: ['dentist', 'dental', 'أسنان', 'اسنان'],
  جلدية: ['dermatology', 'dermatologist', 'جلدية'],
  عيون: ['eye', 'ophthalmology', 'optical', 'عيون'],
  أطفال: ['pediatric', 'children', 'أطفال', 'اطفال'],
  عظام: ['orthopedic', 'orthopedics', 'عظام'],
  مختبر: ['laboratory', 'lab', 'مختبر'],

  'حدائق ومنتزهات': ['park', 'garden', 'حديقة', 'حدائق', 'منتزه'],
  منتزهات: ['park', 'منتزه'],
  حدائق: ['garden', 'park', 'حديقة', 'حدائق'],
  شواطئ: ['beach', 'شاطئ', 'شواطئ'],
  مولات: ['mall', 'shopping', 'مول'],
  سينما: ['cinema', 'movie', 'سينما'],
  ممشى: ['walk', 'promenade', 'corniche', 'ممشى'],
  'أماكن سياحية': ['tourist', 'attraction', 'landmark', 'سياحي'],
};

function getFallbackText(category: string) {
  const defaults: Record<string, string> = {
    restaurants: 'restaurant',
    cafes: 'cafe coffee shop',
    garages: 'car repair garage',
    clinics_hospitals: 'hospital clinic',
    entertainment_parks: 'park entertainment attraction',
  };

  return defaults[category] ?? 'place';
}

function getGeoapifyCategories(category: string, option: string) {
  if (category === 'restaurants' && restaurantCategoryByOption[option]) {
    return restaurantCategoryByOption[option];
  }

  return defaultCategoryMap[category] ?? 'commercial';
}

function getTextSearch(category: string, option: string) {
  if (option && option !== 'أفضل اختيار' && textSearchByOption[option]) {
    return textSearchByOption[option];
  }

  return getFallbackText(category);
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

function calculateDistanceMeters(params: {
  fromLat: number;
  fromLng: number;
  toLat: number | null;
  toLng: number | null;
}) {
  if (params.toLat === null || params.toLng === null) return null;

  const earthRadius = 6371000;
  const dLat = ((params.toLat - params.fromLat) * Math.PI) / 180;
  const dLng = ((params.toLng - params.fromLng) * Math.PI) / 180;

  const lat1 = (params.fromLat * Math.PI) / 180;
  const lat2 = (params.toLat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c);
}

function getSearchablePlaceText(place: PlaceResult) {
  const raw = place.raw ?? {};

  return normalizeText(
    [
      place.name,
      place.address,
      raw.name,
      raw.formatted_address,
      raw.vicinity,
      Array.isArray(raw.types) ? raw.types.join(' ') : '',
      raw.business_status,
      raw.wenbest_option,
      raw.wenbest_query,
      raw.datasource?.raw?.name,
      raw.datasource?.raw?.brand,
      raw.datasource?.raw?.operator,
      raw.datasource?.raw?.amenity,
      raw.datasource?.raw?.shop,
      raw.datasource?.raw?.cuisine,
    ]
      .filter(Boolean)
      .join(' ')
  );
}

function optionMatchLevel(place: PlaceResult, optionOrQuery: string) {
  if (!optionOrQuery || optionOrQuery === 'أفضل اختيار') {
    return 1;
  }

  const normalized = normalizeText(optionOrQuery);

  let keywords: string[] = [];

  if (normalized.includes('سوداني')) {
    keywords = ['sudanese', 'sudan', 'مطعم سوداني', 'سوداني'];
  } else {
    for (const [key, value] of Object.entries(optionKeywords)) {
      if (normalized.includes(normalizeText(key))) {
        keywords = value;
        break;
      }
    }

    if (!keywords.length && optionKeywords[optionOrQuery]) {
      keywords = optionKeywords[optionOrQuery];
    }
  }

  if (!keywords.length) {
    return 1;
  }

  const searchable = getSearchablePlaceText(place);
  const normalizedKeywords = keywords.map(normalizeText);

  const exact = normalizedKeywords.some((keyword) => searchable.includes(keyword));

  if (exact) return 3;

  return 0;
}

function categoryMatchLevel(place: PlaceResult, category: string) {
  const searchable = getSearchablePlaceText(place);

  const groups: Record<string, string[]> = {
    restaurants: ['restaurant', 'food', 'cuisine', 'مطعم', 'اكل', 'أكل'],
    cafes: ['cafe', 'coffee', 'espresso', 'قهوه', 'قهوة', 'كافيه'],
    garages: ['garage', 'repair', 'workshop', 'auto', 'car', 'vehicle', 'mechanic', 'كراج', 'سيارات'],
    clinics_hospitals: ['hospital', 'clinic', 'medical', 'dentist', 'dental', 'laboratory', 'عيادة', 'مستشفى', 'طبي', 'اسنان', 'أسنان'],
    entertainment_parks: ['park', 'mall', 'cinema', 'beach', 'tourist', 'attraction', 'play', 'garden', 'منتزه', 'حديقة', 'مول', 'سينما', 'شاطئ'],
  };

  const keywords = groups[category] ?? [];

  if (!keywords.length) return 1;

  const matched = keywords.some((keyword) => searchable.includes(normalizeText(keyword)));

  return matched ? 2 : 0;
}

function getMatchLabelByLevels(optionLevel: number, categoryLevel: number) {
  if (optionLevel >= 3) return 'مطابقة عالية';
  if (optionLevel >= 2 || categoryLevel >= 2) return 'مطابقة متوسطة';
  return 'مطابقة عامة';
}

function applySoftMatching(
  places: PlaceResult[],
  category: string,
  optionOrQuery: string
): PlaceResult[] {
  return places
    .map((place) => {
      const optionLevel = optionMatchLevel(place, optionOrQuery);
      const categoryLevel = categoryMatchLevel(place, category);

      return {
        ...place,
        raw: {
          ...place.raw,
          wenbest_option_match_level: optionLevel,
          wenbest_category_match_level: categoryLevel,
          wenbest_match_label:
            place.raw?.wenbest_match_label ??
            getMatchLabelByLevels(optionLevel, categoryLevel),
        },
      };
    })
    .sort((a, b) => {
      const aOption = a.raw?.wenbest_option_match_level ?? 0;
      const bOption = b.raw?.wenbest_option_match_level ?? 0;

      if (bOption !== aOption) return bOption - aOption;

      const aCategory = a.raw?.wenbest_category_match_level ?? 0;
      const bCategory = b.raw?.wenbest_category_match_level ?? 0;

      if (bCategory !== aCategory) return bCategory - aCategory;

      return calculateWenBestScore(b) - calculateWenBestScore(a);
    });
}

function removeDuplicates(places: PlaceResult[]) {
  const map = new Map<string, PlaceResult>();

  for (const place of places) {
    const key = normalizeText(`${place.name}_${place.address}`);

    if (!map.has(key)) {
      map.set(key, place);
    }
  }

  return Array.from(map.values());
}

function filterByMaximumDistance(places: PlaceResult[], maxDistanceMeters = SEARCH_RADIUS_METERS) {
  return places.filter((place) => {
    if (place.distance === null) return true;
    return place.distance <= maxDistanceMeters;
  });
}

function normalizeFeatureToGeoapifyPlace(
  feature: any,
  index: number,
  category: string,
  option: string,
  source: string
): PlaceResult {
  const properties = feature.properties ?? {};
  const coordinates = feature.geometry?.coordinates ?? [];

  const lon =
    typeof coordinates[0] === 'number'
      ? coordinates[0]
      : typeof properties.lon === 'number'
        ? properties.lon
        : null;

  const lat =
    typeof coordinates[1] === 'number'
      ? coordinates[1]
      : typeof properties.lat === 'number'
        ? properties.lat
        : null;

  const id =
    properties.place_id ??
    properties.datasource?.raw?.osm_id ??
    properties.osm_id ??
    `${properties.name ?? 'place'}_${lat ?? ''}_${lon ?? ''}_${source}_${index}`;

  const rawName =
    properties.name ??
    properties.datasource?.raw?.name ??
    properties.datasource?.raw?.['name:en'] ??
    properties.datasource?.raw?.brand ??
    properties.datasource?.raw?.operator ??
    properties.address_line1 ??
    properties.formatted?.split(',')?.[0] ??
    option ??
    'مكان بدون اسم';

  const name = String(rawName).trim();

  const address =
    properties.formatted ??
    properties.address_line2 ??
    properties.address_line1 ??
    'لا يوجد عنوان';

  return {
    id: String(id),
    name,
    address,
    category,
    rating: null,
    reviewCount: null,
    distance: typeof properties.distance === 'number' ? properties.distance : null,
    longitude: lon,
    latitude: lat,
    provider: 'geoapify',
    raw: {
      ...feature,
      wenbest_source: source,
      wenbest_option: option,
    },
  };
}

async function searchByGeoapifyPlacesApi(params: {
  category: string;
  option: string;
  latitude: number;
  longitude: number;
  radius: number;
}) {
  const categories = getGeoapifyCategories(params.category, params.option);

  const url =
    `https://api.geoapify.com/v2/places` +
    `?categories=${encodeURIComponent(categories)}` +
    `&filter=circle:${params.longitude},${params.latitude},${params.radius}` +
    `&bias=proximity:${params.longitude},${params.latitude}` +
    `&limit=40` +
    `&apiKey=${GEOAPIFY_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    return [];
  }

  const json = await response.json();
  const features = Array.isArray(json.features) ? json.features : [];

  return features.map((feature: any, index: number) =>
    normalizeFeatureToGeoapifyPlace(
      feature,
      index,
      params.category,
      params.option,
      'places'
    )
  );
}

async function searchByGeoapifyTextApi(params: {
  category: string;
  option: string;
  latitude: number;
  longitude: number;
  city?: string;
}) {
  const text = getTextSearch(params.category, params.option);
  const city = params.city ?? 'Sharjah UAE';

  const url =
    `https://api.geoapify.com/v1/geocode/search` +
    `?text=${encodeURIComponent(`${text} near ${city}`)}` +
    `&limit=30` +
    `&filter=circle:${params.longitude},${params.latitude},${SEARCH_RADIUS_METERS}` +
    `&bias=proximity:${params.longitude},${params.latitude}` +
    `&apiKey=${GEOAPIFY_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    return [];
  }

  const json = await response.json();
  const features = Array.isArray(json.features) ? json.features : [];

  return features.map((feature: any, index: number) =>
    normalizeFeatureToGeoapifyPlace(
      feature,
      index,
      params.category,
      params.option,
      'text'
    )
  );
}

async function searchByGeoapifyNearbyTextVariations(params: {
  category: string;
  option: string;
  latitude: number;
  longitude: number;
  city?: string;
}) {
  const baseText = getTextSearch(params.category, params.option);
  const city = params.city ?? 'Sharjah UAE';

  let variations = [
    `${baseText} near ${city}`,
    `${baseText} in ${city}`,
  ];

  if (params.category === 'cafes' && params.option === 'مناسب للعمل والدراسة') {
    variations = [
      `coworking cafe in ${city}`,
      `study cafe in ${city}`,
      `laptop friendly cafe in ${city}`,
      `specialty coffee workspace in ${city}`,
    ];
  }

  const all: PlaceResult[] = [];

  for (const query of variations) {
    const url =
      `https://api.geoapify.com/v1/geocode/search` +
      `?text=${encodeURIComponent(query)}` +
      `&limit=15` +
      `&filter=circle:${params.longitude},${params.latitude},${SEARCH_RADIUS_METERS}` +
      `&bias=proximity:${params.longitude},${params.latitude}` +
      `&apiKey=${GEOAPIFY_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      continue;
    }

    const json = await response.json();
    const features = Array.isArray(json.features) ? json.features : [];

    const mapped = features.map((feature: any, index: number) =>
      normalizeFeatureToGeoapifyPlace(
        feature,
        index,
        params.category,
        params.option,
        'text_variation'
      )
    );

    all.push(...mapped);
  }

  return all;
}

function shouldPrioritizeTextOnly(category: string) {
  return (
    category === 'garages' ||
    category === 'entertainment_parks' ||
    category === 'clinics_hospitals' ||
    category === 'cafes'
  );
}

async function searchGeoapifyPlaces(params: {
  category: string;
  option: string;
  latitude: number;
  longitude: number;
  city?: string;
}) {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is missing. Check your .env file.');
  }

  const textResults = await searchByGeoapifyTextApi({
    category: params.category,
    option: params.option,
    latitude: params.latitude,
    longitude: params.longitude,
    city: params.city,
  });

  const variationResults = await searchByGeoapifyNearbyTextVariations({
    category: params.category,
    option: params.option,
    latitude: params.latitude,
    longitude: params.longitude,
    city: params.city,
  });

  let placesResults: PlaceResult[] = [];

  if (!shouldPrioritizeTextOnly(params.category)) {
    placesResults = await searchByGeoapifyPlacesApi({
      category: params.category,
      option: params.option,
      latitude: params.latitude,
      longitude: params.longitude,
      radius: SEARCH_RADIUS_METERS,
    });
  } else if (textResults.length + variationResults.length < 5) {
    placesResults = await searchByGeoapifyPlacesApi({
      category: params.category,
      option: params.option,
      latitude: params.latitude,
      longitude: params.longitude,
      radius: SEARCH_RADIUS_METERS,
    });
  }

  const merged = removeDuplicates([
    ...textResults,
    ...variationResults,
    ...placesResults,
  ]);

  const nearbyOnly = filterByMaximumDistance(merged, SEARCH_RADIUS_METERS);

  return applySoftMatching(nearbyOnly, params.category, params.option);
}

async function searchGoogleViaSupabase(params: {
  category: string;
  option: string;
  query?: string;
  latitude: number;
  longitude: number;
  city?: string;
}) {
  if (!SUPABASE_GOOGLE_PLACES_FUNCTION) {
    throw new Error('Supabase Google Places function URL is missing. Check your .env file.');
  }

  const response = await fetch(SUPABASE_GOOGLE_PLACES_FUNCTION, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category: params.category,
      option: params.option,
      query: params.query ?? '',
      latitude: params.latitude,
      longitude: params.longitude,
      city: params.city,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error ?? 'Supabase Google Places request failed');
  }

  const places = Array.isArray(json.places) ? json.places : [];

  const normalized: PlaceResult[] = places.map((place: any) => ({
    id: String(place.id ?? place.place_id ?? `${place.name}_${place.latitude}_${place.longitude}`),
    name: String(place.name ?? 'مكان بدون اسم'),
    address: String(place.address ?? 'لا يوجد عنوان'),
    category: String(place.category ?? params.category),
    rating: typeof place.rating === 'number' ? place.rating : null,
    reviewCount: typeof place.reviewCount === 'number' ? place.reviewCount : null,
    distance: typeof place.distance === 'number' ? place.distance : null,
    latitude: typeof place.latitude === 'number' ? place.latitude : null,
    longitude: typeof place.longitude === 'number' ? place.longitude : null,
    provider: 'google',
    raw: {
      ...(place.raw ?? {}),
      wenbest_source: 'supabase_google_places',
      wenbest_option: params.option,
      wenbest_query: params.query ?? '',
    },
  }));

  const nearbyOnly = filterByMaximumDistance(normalized, SEARCH_RADIUS_METERS);

  return applySoftMatching(nearbyOnly, params.category, params.query || params.option);
}

function isStrictUserSearch(optionOrQuery: string) {
  const normalized = normalizeText(optionOrQuery);

  const strictWords = [
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

  return strictWords.some((word) => normalized.includes(normalizeText(word)));
}

export async function searchPlaces(params: {
  category: string;
  option: string;
  query?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
}): Promise<PlaceResult[]> {
  const latitude = params.latitude ?? 25.3463;
  const longitude = params.longitude ?? 55.4209;

  if (PLACES_PROVIDER === 'google') {
    try {
      return await searchGoogleViaSupabase({
        category: params.category,
        option: params.option,
        query: params.query,
        latitude,
        longitude,
        city: params.city,
      });
    } catch (error) {
      console.warn('Supabase Google Places failed:', error);

      if (isStrictUserSearch(params.query || params.option)) {
        return [];
      }

      return searchGeoapifyPlaces({
        category: params.category,
        option: params.option,
        latitude,
        longitude,
        city: params.city,
      });
    }
  }

  return searchGeoapifyPlaces({
    category: params.category,
    option: params.option,
    latitude,
    longitude,
    city: params.city,
  });
}

export function calculateWenBestScore(place: PlaceResult) {
  let score = 42;

  if (place.provider === 'google') {
    score += 10;
  }

  const optionLevel = place.raw?.wenbest_option_match_level ?? 0;
  const categoryLevel = place.raw?.wenbest_category_match_level ?? 0;

  if (optionLevel >= 3) score += 20;
  else if (optionLevel >= 2) score += 12;
  else if (optionLevel === 0 && place.raw?.wenbest_option !== 'أفضل اختيار') score -= 8;

  if (categoryLevel >= 2) score += 8;

  if (place.rating !== null) {
    if (place.rating >= 4.7) score += 18;
    else if (place.rating >= 4.5) score += 15;
    else if (place.rating >= 4.2) score += 12;
    else if (place.rating >= 4.0) score += 8;
    else if (place.rating >= 3.5) score += 4;
  }

  if (place.reviewCount !== null) {
    if (place.reviewCount >= 1000) score += 14;
    else if (place.reviewCount >= 500) score += 11;
    else if (place.reviewCount >= 200) score += 8;
    else if (place.reviewCount >= 50) score += 5;
    else if (place.reviewCount >= 10) score += 2;
  }

  if (place.distance !== null) {
    if (place.distance <= 1000) score += 14;
    else if (place.distance <= 3000) score += 10;
    else if (place.distance <= 6000) score += 6;
    else if (place.distance <= 12000) score += 3;
    else score += 1;
  }

  if (place.name && place.name !== 'مكان بدون اسم') score += 4;
  if (place.address && place.address !== 'لا يوجد عنوان') score += 4;

  return Math.max(0, Math.min(score, 100));
}