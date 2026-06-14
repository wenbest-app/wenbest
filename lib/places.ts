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
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
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

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    travel_tourism: 'وكالات السفر والسياحة',
  };

  return names[category] ?? category;
}

function getCityNames(city: string) {
  const map: Record<string, string[]> = {
    ajman: ['ajman', 'عجمان'],
    sharjah: ['sharjah', 'الشارقه', 'الشارقة'],
    dubai: ['dubai', 'دبي'],
    abu_dhabi: ['abu dhabi', 'abudhabi', 'ابوظبي', 'ابو ظبي', 'أبوظبي', 'أبو ظبي'],
    al_ain: ['al ain', 'alain', 'العين'],
    ras_al_khaimah: ['ras al khaimah', 'rasalkhaimah', 'راس الخيمه', 'رأس الخيمة'],
    fujairah: ['fujairah', 'الفجيره', 'الفجيرة'],
    umm_al_quwain: ['umm al quwain', 'ummalquwain', 'ام القيوين', 'أم القيوين'],
  };

  return map[city] ?? [city];
}

function getRadiusByCity(city: string) {
  const radiusMap: Record<string, number> = {
    ajman: 9000,
    sharjah: 14000,
    dubai: 18000,
    abu_dhabi: 22000,
    al_ain: 18000,
    ras_al_khaimah: 18000,
    fujairah: 16000,
    umm_al_quwain: 12000,
  };

  return radiusMap[city] ?? 12000;
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
    travel_tourism: 'travel_agency',
  };

  return types[category] ?? '';
}

function getOptionAliases(category: string, option: string, query?: string) {
  const cleanQuery = query?.trim();

  if (cleanQuery) {
    return [
      cleanQuery,
      `${cleanQuery} near me`,
      `${cleanQuery} ${getCategoryArabic(category)}`,
    ];
  }

  const optionKey = normalizeText(option);

  const aliases: Record<string, string[]> = {
    'افضل اختيار': [
      `best ${getCategoryArabic(category)}`,
      getCategoryArabic(category),
    ],

    سوداني: [
      'Sudanese restaurant',
      'Sudanese food',
      'Sudanese cuisine',
      'مطعم سوداني',
      'مأكولات سودانية',
      'اكل سوداني',
    ],
    عربي: ['Arabic restaurant', 'Arab restaurant', 'مطعم عربي'],
    هندي: ['Indian restaurant', 'مطعم هندي'],
    باكستاني: ['Pakistani restaurant', 'مطعم باكستاني'],
    صيني: ['Chinese restaurant', 'مطعم صيني'],
    تركي: ['Turkish restaurant', 'مطعم تركي'],
    ايراني: ['Iranian restaurant', 'Persian restaurant', 'مطعم ايراني'],
    مصري: ['Egyptian restaurant', 'مطعم مصري'],
    شاورما: ['shawarma restaurant', 'شاورما'],
    برجر: ['burger restaurant', 'burger', 'برجر'],
    مندي: ['mandi restaurant', 'mendi restaurant', 'مندي'],
    بحري: ['seafood restaurant', 'مطعم سمك', 'seafood'],
    مشاوي: ['grill restaurant', 'bbq restaurant', 'مشاوي'],
    نباتي: ['vegetarian restaurant', 'vegan restaurant', 'نباتي'],

    kfc: ['KFC restaurant', 'KFC'],
    كنتاكي: ['KFC restaurant', 'KFC', 'كنتاكي'],
    mcdonalds: ["McDonald's restaurant", "McDonald's", 'ماكدونالدز'],
    ماكدونالدز: ["McDonald's restaurant", "McDonald's", 'ماكدونالدز'],
    ماك: ["McDonald's restaurant", "McDonald's", 'ماك'],
    'برجر كنج': ['Burger King restaurant', 'Burger King'],
    'بيتزا هت': ['Pizza Hut restaurant', 'Pizza Hut'],
    دومينوز: ["Domino's Pizza restaurant", "Domino's Pizza"],
    هارديز: ["Hardee's restaurant", "Hardee's"],
    ستاربكس: ['Starbucks cafe', 'Starbucks'],
    'تيم هورتنز': ['Tim Hortons cafe', 'Tim Hortons'],

    هادئ: ['quiet cafe', 'calm cafe', 'cafe'],
    'مناسب للعمل والدراس': ['cafe for work and study', 'work cafe', 'study cafe'],
    'جلسات خارجيه': ['outdoor seating cafe', 'outdoor cafe'],
    'مناسب للعائلات': ['family cafe', 'family friendly cafe'],
    'مناسب للتصوير': ['instagrammable cafe', 'beautiful cafe'],

    سباك: ['plumber service', 'plumbing service', 'emergency plumber', 'سباك'],
    كهربائي: ['electrician service', 'electrical maintenance', 'كهربائي'],
    مكيفات: ['AC repair service', 'air conditioning repair', 'تكييف'],
    تكييف: ['AC repair service', 'air conditioning repair', 'مكيفات'],
    'تنظيف منازل': ['house cleaning service', 'home cleaning'],
    'مكافحه حشرات': ['pest control service', 'مكافحة حشرات'],
    حشرات: ['pest control service', 'مكافحة حشرات'],
    'نقل اثاث': ['furniture moving service', 'movers'],
    'صيانه عامه': ['handyman service', 'home maintenance'],

    مستشفى: ['hospital', 'مستشفى'],
    طوارئ: ['emergency hospital', 'emergency room', 'طوارئ'],
    'عياده عامه': ['general clinic', 'medical clinic'],
    اسنان: ['dental clinic', 'dentist', 'اسنان'],
    جلديه: ['dermatology clinic', 'dermatologist'],
    عيون: ['eye clinic', 'ophthalmology clinic'],
    اطفال: ['pediatric clinic', 'children clinic'],
    'نساء وولاده': ['gynecology clinic', 'obgyn clinic'],
    عظام: ['orthopedic clinic', 'orthopedic doctor'],
    مختبر: ['medical laboratory', 'lab test'],
    اشعه: ['radiology center', 'x ray center'],
    'علاج طبيعي': ['physiotherapy clinic', 'physical therapy'],

    'حدائق ومنتزهات': ['parks', 'public park', 'garden'],
    حدائق: ['parks', 'gardens'],
    منتزهات: ['parks', 'public park'],
    شواطئ: ['beach', 'public beach'],
    مولات: ['shopping mall', 'mall'],
    سينما: ['cinema', 'movie theater'],
    'العاب اطفال': ['kids play area', 'children play area'],
    'اماكن عائليه': ['family attractions', 'family places'],
    'اماكن مجانيه': ['free attractions', 'free places'],
    'اماكن داخليه': ['indoor activities', 'indoor places'],
    'اماكن خارجيه': ['outdoor activities', 'outdoor places'],
    ممشى: ['walking promenade', 'walking track'],
    'اماكن سياحيه': ['tourist attraction', 'tourist places'],

    'حلاق رجالي': ['men barber shop', 'barber shop'],
    حلاق: ['men barber shop', 'barber shop'],
    'صالون نسائي': ['ladies salon', 'beauty salon'],
    صالون: ['beauty salon', 'salon'],
    تجميل: ['beauty salon', 'beauty center'],
    اظافر: ['nail salon', 'nails'],
    مساج: ['massage spa', 'spa massage'],
    'حمام مغربي': ['moroccan bath spa', 'moroccan bath'],
    'عنايه بالبشره': ['facial skin care salon', 'skin care'],

    'مغسله ملابس': ['laundry', 'laundromat', 'dry cleaning'],
    مغسله: ['laundry', 'laundromat'],
    'تنظيف جاف': ['dry cleaning', 'dry cleaner'],
    كوي: ['ironing service', 'laundry ironing'],
    'مغسله سجاد': ['carpet cleaning', 'rug cleaning'],
    سجاد: ['carpet cleaning', 'rug cleaning'],
    'مغسله سيارات': ['car wash', 'car cleaning'],

    فنادق: ['hotel', 'hotels'],
    فندق: ['hotel', 'hotels'],
    'شقق فندقيه': ['hotel apartments', 'serviced apartments'],
    رخيص: ['budget hotel', 'cheap hotel'],
    فاخر: ['luxury hotel', 'five star hotel'],
    'قريب من البحر': ['beach hotel', 'hotel near beach'],
    'قريب من المطار': ['airport hotel', 'hotel near airport'],

    'حجوزات طيران': ['travel agency flight tickets', 'flight booking agency'],
    'باقات سياحيه': ['tourism agency tour packages', 'travel packages'],
    'باقات سياحية': ['tourism agency tour packages', 'travel packages'],
    'سياحه داخل الامارات': ['UAE tour agency local tours', 'local tourism agency'],
    'سياحة داخل الإمارات': ['UAE tour agency local tours', 'local tourism agency'],
    'سياحه خارجيه': ['travel agency international tours'],
    'سياحة خارجية': ['travel agency international tours'],
    'تاشيرات سفر': ['visa services travel agency', 'visa service'],
    'تأشيرات سفر': ['visa services travel agency', 'visa service'],
    عمره: ['Umrah travel agency', 'Umrah packages'],
    عمرة: ['Umrah travel agency', 'Umrah packages'],
  };

  const brandAliases: Record<string, string[]> = {
    toyota: ['Toyota garage', 'Toyota service center', 'Toyota specialist'],
    lexus: ['Lexus garage', 'Lexus service center', 'Lexus specialist'],
    nissan: ['Nissan garage', 'Nissan service center', 'Nissan specialist'],
    infiniti: ['Infiniti garage', 'Infiniti service center', 'Infiniti specialist'],
    honda: ['Honda garage', 'Honda service center', 'Honda specialist'],
    mazda: ['Mazda garage', 'Mazda service center', 'Mazda specialist'],
    mitsubishi: ['Mitsubishi garage', 'Mitsubishi service center'],
    gmc: ['GMC garage', 'GMC service center', 'GMC specialist'],
    chevrolet: ['Chevrolet garage', 'Chevrolet service center'],
    ford: ['Ford garage', 'Ford service center', 'Ford specialist'],
    jeep: ['Jeep garage', 'Jeep service center'],
    cadillac: ['Cadillac garage', 'Cadillac service center'],
    dodge: ['Dodge garage', 'Dodge service center'],
    chrysler: ['Chrysler garage', 'Chrysler service center'],
    tesla: ['Tesla garage', 'Tesla service center'],
    mercedes: ['Mercedes garage', 'Mercedes service center', 'Mercedes specialist'],
    bmw: ['BMW garage', 'BMW service center', 'BMW specialist', 'BMW workshop'],
    audi: ['Audi garage', 'Audi service center', 'Audi specialist'],
    porsche: ['Porsche garage', 'Porsche service center'],
    volkswagen: ['Volkswagen garage', 'Volkswagen service center'],
    hyundai: ['Hyundai garage', 'Hyundai service center'],
    kia: ['Kia garage', 'Kia service center'],
    genesis: ['Genesis garage', 'Genesis service center'],
    'range rover': ['Range Rover garage', 'Range Rover service center'],
    'land rover': ['Land Rover garage', 'Land Rover service center'],
  };

  const garageServices: Record<string, string[]> = {
    'فحص كمبيوتر': ['car diagnostic garage', 'computer diagnostic car'],
    'فحص شامل': ['car inspection garage', 'vehicle inspection'],
    'فحص قبل الشراء': ['pre purchase car inspection', 'car inspection before buying'],
    'صيانه دوريه': ['car service garage', 'vehicle maintenance'],
    'تبديل زيوت': ['oil change car service', 'oil change'],
    'قير / جير': ['car transmission repair', 'gearbox repair'],
    مكينه: ['car engine repair', 'engine repair garage'],
    'كهرباء سيارات': ['auto electrical garage', 'car electrician'],
    'مكيفات سيارات': ['car AC repair', 'auto AC repair'],
    بطاريه: ['car battery service', 'battery replacement'],
    اطارات: ['tyre shop', 'tire shop'],
    'سمكره وصبغ': ['car body shop paint', 'auto body repair'],
    تلميع: ['car detailing', 'car polish'],
  };

  const allAliases = {
    ...aliases,
    ...brandAliases,
    ...garageServices,
  };

  const direct = allAliases[optionKey];

  if (direct) return direct;

  if (category === 'restaurants') return [`${option} restaurant`, `${option} food`];
  if (category === 'cafes') return [`${option} cafe`, 'cafe'];
  if (category === 'garages') return [`${option} garage`, `${option} service center`, `${option} specialist`];
  if (category === 'clinics_hospitals') return [`${option} clinic`, `${option} medical center`];
  if (category === 'entertainment_parks') return [`${option}`, `${option} attraction`];
  if (category === 'salons_barbers') return [`${option} salon`, `${option} spa`];
  if (category === 'home_services') return [`${option} service`, `${option} maintenance`];
  if (category === 'laundries') return [`${option}`, 'laundry'];
  if (category === 'hotels_apartments') return [`${option}`, 'hotel'];
  if (category === 'travel_tourism') return [`${option} travel agency`, `${option} tourism agency`];

  return [option || getCategoryArabic(category)];
}

function buildSearchQueries(params: SearchPlacesParams) {
  const cityNames = getCityNames(params.city);
  const mainCity = cityNames[0];
  const aliases = getOptionAliases(params.category, params.option, params.query);

  const queries = aliases.flatMap((alias) => [
    `${alias} in ${mainCity} UAE`,
    `${mainCity} ${alias}`,
  ]);

  return Array.from(new Set(queries)).slice(0, 10);
}

function getItemText(item: any) {
  return normalizeText(
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
}

function getSearchWords(category: string, option: string, query?: string) {
  const clean = normalizeText(query || option || '');

  if (!clean || clean === normalizeText('أفضل اختيار')) return [];

  const ignored = new Set([
    'مطعم',
    'مطاعم',
    'كافيه',
    'كافيهات',
    'فندق',
    'فنادق',
    'كراج',
    'كراجات',
    'سيارات',
    'خدمه',
    'خدمة',
    'service',
    'restaurant',
    'restaurants',
    'cafe',
    'hotel',
    'garage',
    'near',
    'best',
  ]);

  return clean
    .split(' ')
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !ignored.has(word));
}

function getMatchLabel(item: any, category: string, option: string, query?: string) {
  const rawText = getItemText(item);
  const words = getSearchWords(category, option, query);

  if (!words.length || option === 'أفضل اختيار') return 'مطابقة عامة';

  const matchedWords = words.filter((word) => rawText.includes(word));

  if (matchedWords.length >= 2) return 'مطابقة عالية';
  if (matchedWords.length === 1) return 'مطابقة جيدة';

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

  if (!id || !name) return null;

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
      ? getDistanceInMeters(params.latitude, params.longitude, latitude, longitude)
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
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.places)) return data.places;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function removeDuplicates(items: PlaceResult[]) {
  const seen = new Set<string>();
  const unique: PlaceResult[] = [];

  for (const item of items) {
    const normalizedName = normalizeText(item.name);
    const normalizedAddress = normalizeText(item.address);
    const key = item.id || `${normalizedName}-${normalizedAddress}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
}

function isInSelectedCity(place: PlaceResult, params: SearchPlacesParams) {
  const text = normalizeText(`${place.name} ${place.address}`);
  const cityNames = getCityNames(params.city).map(normalizeText);

  if (cityNames.some((cityName) => text.includes(cityName))) {
    return true;
  }

  if (place.distance !== null && place.distance !== undefined) {
    return place.distance <= getRadiusByCity(params.city);
  }

  return false;
}

function isProbablyRelevant(place: PlaceResult, params: SearchPlacesParams) {
  if (params.option === 'أفضل اختيار' && !params.query) return true;

  const level = Number(place.raw?.wenbest_option_match_level ?? 0);

  if (level >= 1) return true;

  const text = normalizeText(
    `${place.name} ${place.address} ${JSON.stringify(place.raw?.types ?? [])}`
  );

  const words = getSearchWords(params.category, params.option, params.query);

  if (!words.length) return true;

  return words.some((word) => text.includes(word));
}

function getStrictRelevanceScore(place: PlaceResult, params: SearchPlacesParams) {
  const text = normalizeText(
    `${place.name} ${place.address} ${JSON.stringify(place.raw?.types ?? [])}`
  );

  const words = getSearchWords(params.category, params.option, params.query);
  const matchedWords = words.filter((word) => text.includes(word)).length;

  const matchLevel = Number(place.raw?.wenbest_option_match_level ?? 0);
  const cityBonus = isInSelectedCity(place, params) ? 8 : 0;
  const distanceBonus =
    place.distance !== null && place.distance !== undefined
      ? Math.max(0, 8 - place.distance / 3000)
      : 0;

  return matchedWords * 12 + matchLevel * 10 + cityBonus + distanceBonus;
}

function sortInitialResults(items: PlaceResult[], params: SearchPlacesParams) {
  return [...items].sort((a, b) => {
    const relevanceDiff =
      getStrictRelevanceScore(b, params) - getStrictRelevanceScore(a, params);

    if (relevanceDiff !== 0) return relevanceDiff;

    const scoreDiff = calculateWenBestScore(b) - calculateWenBestScore(a);

    if (scoreDiff !== 0) return scoreDiff;

    const aDistance = a.distance ?? Number.MAX_SAFE_INTEGER;
    const bDistance = b.distance ?? Number.MAX_SAFE_INTEGER;

    return aDistance - bDistance;
  });
}

export function calculateWenBestScore(place: PlaceResult) {
  const rating = place.rating ?? 0;
  const reviewCount = place.reviewCount ?? 0;
  const distance = place.distance ?? 999999;

  const ratingScore = Math.min(rating / 5, 1) * 50;
  const reviewScore = Math.min(Math.log10(reviewCount + 1) / 4, 1) * 22;

  let distanceScore = 0;

  if (distance <= 1000) distanceScore = 20;
  else if (distance <= 3000) distanceScore = 17;
  else if (distance <= 7000) distanceScore = 13;
  else if (distance <= 15000) distanceScore = 8;
  else if (distance <= 30000) distanceScore = 3;

  const matchLevel = Number(place.raw?.wenbest_option_match_level ?? 1);
  const matchBonus = Math.min(matchLevel, 3) * 5;

  const score = Math.round(ratingScore + reviewScore + distanceScore + matchBonus);

  return Math.max(0, Math.min(score, 100));
}

async function fetchGoogleResults(params: SearchPlacesParams, searchText: string) {
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
      radius: getRadiusByCity(params.city),
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
  return extractResults(data);
}

export async function searchPlaces(params: SearchPlacesParams): Promise<PlaceResult[]> {
  if (PLACES_PROVIDER !== 'google') {
    throw new Error('مزود البحث الحالي غير مدعوم. استخدم Google Places.');
  }

  if (!GOOGLE_FUNCTION_URL) {
    throw new Error('رابط Supabase Google Places Function غير موجود في ملف .env');
  }

  const queries = buildSearchQueries(params);
  const allRawResults: any[] = [];

  for (const query of queries) {
    try {
      const results = await fetchGoogleResults(params, query);
      allRawResults.push(...results);

      if (allRawResults.length >= 60) {
        break;
      }
    } catch {
      // تجاهل فشل بحث واحد واستمر في بقية المرادفات
    }
  }

  const normalized = allRawResults
    .map((item: any) =>
      normalizeGoogleItem(item, {
        ...params,
        query: params.query || params.option,
      })
    )
    .filter(Boolean) as PlaceResult[];

  const unique = removeDuplicates(normalized);

  const cityFiltered = unique.filter((place) => isInSelectedCity(place, params));

// لا ترجع لمدن أخرى إلا إذا لم توجد أي نتيجة داخل المدينة
const cityPool = cityFiltered.length > 0 ? cityFiltered : unique;

  const relevant =
    params.option === 'أفضل اختيار' && !params.query
      ? cityPool
      : cityPool.filter((place) => isProbablyRelevant(place, params));

  const finalResults =
    relevant.length >= 4
      ? relevant
      : cityPool.length >= 4
        ? cityPool
        : unique;

  return sortInitialResults(finalResults, params).slice(0, 30);
}