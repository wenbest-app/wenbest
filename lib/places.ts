export type PlacesProvider = 'google' | 'geoapify';

export type SearchPlacesParams = {
  category: string;
  option: string;
  query?: string;
  latitude: number;
  longitude: number;
  city: string;
};

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  reviewCount: number | null;
  distance: number | null;
  provider: PlacesProvider;
  raw: any;
};

const GOOGLE_FUNCTION_URL =
  process.env.EXPO_PUBLIC_SUPABASE_GOOGLE_PLACES_FUNCTION ?? '';

const PLACES_PROVIDER =
  process.env.EXPO_PUBLIC_PLACES_PROVIDER ?? 'google';

function normalizeText(value: string) {
  return String(value)
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return null;
  }

  return numberValue;
}

function getDistanceInMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
) {
  const earthRadius = 6371000;

  const lat1 = (latitude1 * Math.PI) / 180;
  const lat2 = (latitude2 * Math.PI) / 180;
  const deltaLat = ((latitude2 - latitude1) * Math.PI) / 180;
  const deltaLng = ((longitude2 - longitude1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function getCategoryArabic(category: string) {
  const names: Record<string, string> = {
    restaurants: 'مطاعم',
    cafes: 'كافيهات',
    garages: 'كراجات سيارات',
    clinics_hospitals: 'عيادات ومستشفيات',
    entertainment_parks: 'ترفيه ومنتزهات',
    salons_barbers: 'صالونات وحلاقة',
    home_services: 'خدمات منزلية',
    laundries: 'مغاسل',
    hotels_apartments: 'فنادق وشقق فندقية',
  };

  return names[category] ?? category;
}

function getGoogleSearchText(category: string, option: string, query?: string) {
  const cleanQuery = query?.trim();

  if (cleanQuery) {
    return cleanQuery;
  }

  const optionKey = normalizeText(option);

  const optionQueries: Record<string, string> = {
    // Restaurants
    'افضل اختيار': 'best restaurants',
    سوداني: 'Sudanese restaurant',
    عربي: 'Arabic restaurant',
    هندي: 'Indian restaurant',
    باكستاني: 'Pakistani restaurant',
    صيني: 'Chinese restaurant',
    تركي: 'Turkish restaurant',
    ايراني: 'Iranian restaurant',
    مصري: 'Egyptian restaurant',
    شاورما: 'shawarma restaurant',
    برجر: 'burger restaurant',
    مندي: 'mandi restaurant',
    بحري: 'seafood restaurant',
    مشاوي: 'grill restaurant',
    نباتي: 'vegetarian restaurant',

    // International restaurant chains
    kfc: 'KFC restaurant',
    كنتاكي: 'KFC restaurant',

    "mcdonald's": "McDonald's restaurant",
    mcdonalds: "McDonald's restaurant",
    mcdonald: "McDonald's restaurant",
    ماكدونالدز: "McDonald's restaurant",
    ماكدونالد: "McDonald's restaurant",
    ماك: "McDonald's restaurant",

    'burger king': 'Burger King restaurant',
    'برجر كنج': 'Burger King restaurant',
    'بيرجر كنج': 'Burger King restaurant',

    'pizza hut': 'Pizza Hut restaurant',
    'بيتزا هت': 'Pizza Hut restaurant',

    "domino's pizza": "Domino's Pizza restaurant",
    "domino's": "Domino's Pizza restaurant",
    dominos: "Domino's Pizza restaurant",
    دومينوز: "Domino's Pizza restaurant",
    'دومينوز بيتزا': "Domino's Pizza restaurant",

    "hardee's": "Hardee's restaurant",
    hardees: "Hardee's restaurant",
    هارديز: "Hardee's restaurant",

    'texas chicken': 'Texas Chicken restaurant',
    'تكساس تشيكن': 'Texas Chicken restaurant',

    popeyes: 'Popeyes restaurant',
    بوبايز: 'Popeyes restaurant',

    subway: 'Subway restaurant',
    'صب واي': 'Subway restaurant',
    صبواي: 'Subway restaurant',

    jollibee: 'Jollibee restaurant',
    جوليبي: 'Jollibee restaurant',

    starbucks: 'Starbucks cafe',
    ستاربكس: 'Starbucks cafe',

    'tim hortons': 'Tim Hortons cafe',
    'تيم هورتنز': 'Tim Hortons cafe',
    'تيم هورتونز': 'Tim Hortons cafe',

    // Cafes
    هادئ: 'quiet cafe',
    'مناسب للعمل والدراس': 'cafe for work and study',
    'جلسات خارجيه': 'outdoor seating cafe',
    'مناسب للعائلات': 'family cafe',
    'مناسب للتصوير': 'instagrammable cafe',

    // Garages brands
    toyota: 'Toyota garage',
    lexus: 'Lexus garage',
    nissan: 'Nissan garage',
    infiniti: 'Infiniti garage',
    honda: 'Honda garage',
    mazda: 'Mazda garage',
    mitsubishi: 'Mitsubishi garage',
    subaru: 'Subaru garage',
    suzuki: 'Suzuki garage',
    gmc: 'GMC garage',
    chevrolet: 'Chevrolet garage',
    ford: 'Ford garage',
    jeep: 'Jeep garage',
    cadillac: 'Cadillac garage',
    dodge: 'Dodge garage',
    chrysler: 'Chrysler garage',
    tesla: 'Tesla garage',
    mercedes: 'Mercedes garage',
    bmw: 'BMW garage',
    audi: 'Audi garage',
    porsche: 'Porsche garage',
    volkswagen: 'Volkswagen garage',
    mini: 'Mini Cooper garage',
    hyundai: 'Hyundai garage',
    kia: 'Kia garage',
    genesis: 'Genesis garage',
    'range rover': 'Range Rover garage',
    'land rover': 'Land Rover garage',
    jaguar: 'Jaguar garage',
    bentley: 'Bentley garage',
    'rolls royce': 'Rolls Royce garage',
    volvo: 'Volvo garage',
    peugeot: 'Peugeot garage',
    renault: 'Renault garage',
    fiat: 'Fiat garage',
    'alfa romeo': 'Alfa Romeo garage',

    // Garage services
    'فحص كمبيوتر': 'car diagnostic garage',
    'فحص شامل': 'car inspection garage',
    'فحص قبل الشراء': 'pre purchase car inspection',
    'صيانه دوريه': 'car service garage',
    'تبديل زيوت': 'oil change car service',
    'قير / جير': 'car transmission repair',
    مكينه: 'car engine repair',
    'كهرباء سيارات': 'auto electrical garage',
    'مكيفات سيارات': 'car AC repair',
    بطاريه: 'car battery service',
    اطارات: 'tyre shop',
    'سمكره وصبغ': 'car body shop paint',
    تلميع: 'car detailing',

    // Medical
    مستشفى: 'hospital',
    طوارئ: 'emergency hospital',
    'عياده عامه': 'general clinic',
    اسنان: 'dental clinic',
    جلديه: 'dermatology clinic',
    عيون: 'eye clinic',
    اطفال: 'pediatric clinic',
    'نساء وولاده': 'gynecology clinic',
    عظام: 'orthopedic clinic',
    'انف واذن وحنجره': 'ENT clinic',
    مختبر: 'medical laboratory',
    اشعه: 'radiology center',
    'علاج طبيعي': 'physiotherapy clinic',

    // Entertainment
    'حدائق ومنتزهات': 'parks',
    منتزهات: 'parks',
    حدائق: 'gardens parks',
    شواطئ: 'beach',
    مولات: 'shopping mall',
    سينما: 'cinema',
    'العاب اطفال': 'kids play area',
    'اماكن عائليه': 'family attractions',
    'اماكن مجانيه': 'free attractions',
    'اماكن داخليه': 'indoor activities',
    'اماكن خارجيه': 'outdoor activities',
    ممشى: 'walking promenade',
    'اماكن سياحيه': 'tourist attraction',

    // Salons and barbers
    'حلاق رجالي': 'men barber shop',
    حلاق: 'men barber shop',
    'صالون نسائي': 'ladies salon',
    صالون: 'beauty salon',
    تجميل: 'beauty salon',
    اظافر: 'nail salon',
    مساج: 'massage spa',
    'حمام مغربي': 'moroccan bath spa',
    'عنايه بالبشره': 'facial skin care salon',

    // Home services
    سباك: 'plumber service',
    كهربائي: 'electrician service',
    مكيفات: 'AC repair service',
    تكييف: 'AC repair service',
    'تنظيف منازل': 'house cleaning service',
    'مكافحه حشرات': 'pest control service',
    حشرات: 'pest control service',
    'نقل اثاث': 'furniture moving service',
    'صيانه عامه': 'handyman service',

    // Laundries
    'مغسله ملابس': 'laundry',
    مغسله: 'laundry',
    'تنظيف جاف': 'dry cleaning',
    كوي: 'ironing service',
    'مغسله سجاد': 'carpet cleaning',
    سجاد: 'carpet cleaning',
    'مغسله سيارات': 'car wash',

    // Hotels
    فنادق: 'hotel',
    فندق: 'hotel',
    'شقق فندقيه': 'hotel apartments',
    رخيص: 'budget hotel',
    فاخر: 'luxury hotel',
    'قريب من البحر': 'beach hotel',
    'قريب من المطار': 'airport hotel',
  };

  const directOptionQuery = optionQueries[optionKey];

  if (directOptionQuery) {
    return directOptionQuery;
  }

  if (category === 'restaurants') {
    return option === 'أفضل اختيار' ? 'best restaurants' : `${option} restaurant`;
  }

  if (category === 'cafes') {
    return option === 'أفضل اختيار' ? 'best cafes' : `${option} cafe`;
  }

  if (category === 'garages') {
    return option === 'أفضل اختيار' ? 'best car garage' : `${option} garage`;
  }

  if (category === 'clinics_hospitals') {
    return option === 'أفضل اختيار' ? 'best clinic hospital' : `${option} clinic`;
  }

  if (category === 'entertainment_parks') {
    return option === 'أفضل اختيار' ? 'best attractions parks' : `${option}`;
  }

  if (category === 'salons_barbers') {
    return option === 'أفضل اختيار' ? 'best barber beauty salon' : `${option} salon`;
  }

  if (category === 'home_services') {
    return option === 'أفضل اختيار' ? 'home maintenance service' : `${option} service`;
  }

  if (category === 'laundries') {
    return option === 'أفضل اختيار' ? 'laundry' : `${option}`;
  }

  if (category === 'hotels_apartments') {
    return option === 'أفضل اختيار' ? 'best hotels hotel apartments' : `${option}`;
  }

  return option || getCategoryArabic(category);
}

function getCategoryGoogleType(category: string) {
  const types: Record<string, string> = {
    restaurants: 'restaurant',
    cafes: 'cafe',
    garages: 'car_repair',
    clinics_hospitals: 'hospital',
    entertainment_parks: 'tourist_attraction',
    salons_barbers: 'beauty_salon',
    home_services: '',
    laundries: 'laundry',
    hotels_apartments: 'lodging',
  };

  return types[category] ?? '';
}

function getMatchLabel(item: any, category: string, option: string, query?: string) {
  const rawText = normalizeText(
    [
      item.name,
      item.address,
      item.formatted_address,
      item.vicinity,
      item.business_status,
      item.types?.join(' '),
    ]
      .filter(Boolean)
      .join(' ')
  );

  const searchText = normalizeText(query || option || '');

  if (!searchText || option === 'أفضل اختيار') {
    return 'مطابقة عامة';
  }

  const words = searchText
    .split(' ')
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);

  const matchedWords = words.filter((word) => rawText.includes(word));

  if (matchedWords.length >= 2) {
    return 'مطابقة عالية';
  }

  if (matchedWords.length === 1) {
    return 'مطابقة جيدة';
  }

  if (category === 'restaurants') {
    return 'مطابقة عامة';
  }

  if (category === 'hotels_apartments' && rawText.includes('hotel')) {
    return 'مطابقة عامة';
  }

  return 'مطابقة ضعيفة';
}

function getOptionMatchLevel(item: any, category: string, option: string, query?: string) {
  const label = getMatchLabel(item, category, option, query);

  if (label === 'مطابقة عالية') return 3;
  if (label === 'مطابقة جيدة') return 2;
  if (label === 'مطابقة عامة') return 1;

  return 0;
}

function normalizeGoogleItem(
  item: any,
  params: SearchPlacesParams
): PlaceResult | null {
  const id =
    item.id ??
    item.place_id ??
    item.placeId ??
    item.google_place_id ??
    item.name;

  const name = item.name ?? item.displayName?.text ?? item.title;

  if (!id || !name) {
    return null;
  }

  const address =
    item.address ??
    item.formatted_address ??
    item.vicinity ??
    item.location?.address ??
    'لا يوجد عنوان';

  const latitude =
    toNumber(item.latitude) ??
    toNumber(item.lat) ??
    toNumber(item.geometry?.location?.lat) ??
    toNumber(item.location?.lat) ??
    toNumber(item.location?.latitude);

  const longitude =
    toNumber(item.longitude) ??
    toNumber(item.lng) ??
    toNumber(item.lon) ??
    toNumber(item.geometry?.location?.lng) ??
    toNumber(item.location?.lng) ??
    toNumber(item.location?.longitude);

  const rating =
    toNumber(item.rating) ??
    toNumber(item.google_rating) ??
    toNumber(item.stars);

  const reviewCount =
    toNumber(item.reviewCount) ??
    toNumber(item.review_count) ??
    toNumber(item.user_ratings_total) ??
    toNumber(item.reviews);

  const distance =
    toNumber(item.distance) ??
    toNumber(item.distanceMeters) ??
    toNumber(item.distance_meters) ??
    (latitude !== null && longitude !== null
      ? getDistanceInMeters(
          params.latitude,
          params.longitude,
          latitude,
          longitude
        )
      : null);

  const provider: PlacesProvider =
    item.provider === 'geoapify' ? 'geoapify' : 'google';

    const openNow =
  item.opening_hours?.open_now ??
  item.openingHours?.openNow ??
  item.current_opening_hours?.open_now ??
  item.currentOpeningHours?.openNow ??
  item.open_now ??
  item.openNow ??
  item.is_open ??
  item.isOpen ??
  null;

const openStatus =
  openNow === true
    ? 'مفتوح الآن'
    : openNow === false
      ? 'مغلق الآن'
      : item.open_status ??
        item.openStatus ??
        item.raw?.open_status ??
        item.raw?.openStatus ??
        'حالة الدوام غير متوفرة';

  const matchLabel =
    item.raw?.wenbest_match_label ??
    item.wenbest_match_label ??
    getMatchLabel(item, params.category, params.option, params.query);

  const matchLevel =
    item.raw?.wenbest_option_match_level ??
    item.wenbest_option_match_level ??
    getOptionMatchLevel(item, params.category, params.option, params.query);

  return {
    id: String(id),
    name: String(name),
    address: String(address),
    latitude,
    longitude,
    rating,
    reviewCount,
    distance,
    provider,
    raw: {
  ...item,
  open_status: openStatus,
  opening_hours: {
    ...(item.opening_hours ?? {}),
    open_now: openNow,
  },
  wenbest_match_label: matchLabel,
  wenbest_option_match_level: matchLevel,
  wenbest_category: params.category,
  wenbest_option: params.option,
  wenbest_query: params.query ?? '',
  distance,
},
  };
}

function extractResults(data: any) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.places)) {
    return data.places;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function removeDuplicates(items: PlaceResult[]) {
  const seen = new Set<string>();
  const unique: PlaceResult[] = [];

  for (const item of items) {
    const key = item.id || `${item.name}-${item.address}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
}

function isProbablyRelevant(place: PlaceResult, params: SearchPlacesParams) {
  if (params.option === 'أفضل اختيار') {
    return true;
  }

  const level = Number(place.raw?.wenbest_option_match_level ?? 0);

  if (level >= 1) {
    return true;
  }

  const text = normalizeText(
    `${place.name} ${place.address} ${JSON.stringify(place.raw?.types ?? [])}`
  );

  const option = normalizeText(params.option);
  const query = normalizeText(params.query ?? '');

  if (option && text.includes(option)) {
    return true;
  }

  if (query) {
    const words = query.split(' ').filter((word) => word.length >= 3);

    if (words.some((word) => text.includes(word))) {
      return true;
    }
  }

  return false;
}

function sortInitialResults(items: PlaceResult[]) {
  return [...items].sort((a, b) => {
    const bScore = calculateWenBestScore(b);
    const aScore = calculateWenBestScore(a);

    if (bScore !== aScore) {
      return bScore - aScore;
    }

    const aDistance = a.distance ?? Number.MAX_SAFE_INTEGER;
    const bDistance = b.distance ?? Number.MAX_SAFE_INTEGER;

    return aDistance - bDistance;
  });
}

export function calculateWenBestScore(place: PlaceResult) {
  const rating = place.rating ?? 0;
  const reviewCount = place.reviewCount ?? 0;
  const distance = place.distance ?? 999999;

  const ratingScore = Math.min(rating / 5, 1) * 55;
  const reviewScore = Math.min(Math.log10(reviewCount + 1) / 4, 1) * 25;

  let distanceScore = 0;

  if (distance <= 1000) {
    distanceScore = 20;
  } else if (distance <= 3000) {
    distanceScore = 16;
  } else if (distance <= 7000) {
    distanceScore = 12;
  } else if (distance <= 15000) {
    distanceScore = 8;
  } else if (distance <= 30000) {
    distanceScore = 4;
  }

  const matchLevel = Number(place.raw?.wenbest_option_match_level ?? 1);
  const matchBonus = Math.min(matchLevel, 3) * 3;

  const score = Math.round(ratingScore + reviewScore + distanceScore + matchBonus);

  return Math.max(0, Math.min(score, 100));
}

export async function searchPlaces(params: SearchPlacesParams): Promise<PlaceResult[]> {
  if (PLACES_PROVIDER !== 'google') {
    throw new Error('مزود البحث الحالي غير مدعوم. استخدم Google Places.');
  }

  if (!GOOGLE_FUNCTION_URL) {
    throw new Error(
      'رابط Supabase Google Places Function غير موجود في ملف .env'
    );
  }

  const searchText = getGoogleSearchText(
    params.category,
    params.option,
    params.query
  );

  const googleType = getCategoryGoogleType(params.category);

  const response = await fetch(GOOGLE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category: params.category,
      option: params.option,
      query: searchText,
      originalQuery: params.query ?? '',
      latitude: params.latitude,
      longitude: params.longitude,
      city: params.city,
      type: googleType,
      radius: 30000,
      language: 'ar',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `فشل البحث في Google Places. Status: ${response.status}`
    );
  }

  const data = await response.json();
  const rawResults = extractResults(data);

  const normalized = rawResults
    .map((item: any) =>
      normalizeGoogleItem(item, {
        ...params,
        query: searchText,
      })
    )
    .filter(Boolean) as PlaceResult[];

  const unique = removeDuplicates(normalized);

  const relevant =
    params.option === 'أفضل اختيار'
      ? unique
      : unique.filter((place) => isProbablyRelevant(place, params));

  const finalResults = relevant.length >= 3 ? relevant : unique;

  return sortInitialResults(finalResults);
}