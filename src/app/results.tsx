import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { cities, getCityByKey } from '../../lib/cities';
import {
  calculateWenBestScore,
  PlaceResult,
  searchPlaces,
} from '../../lib/places';
import { supabase } from '../../lib/supabase';

const logoImage = require('../../assets/images/wenbest-logo.png');

const colors = {
  navy: '#06214A',
  teal: '#09AFA3',
  tealDark: '#07877E',
  gold: '#F5B942',
  bg: '#F5F8FC',
  text: '#0B1F3A',
  muted: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
  red: '#DC2626',
  green: '#047857',
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

type SortMode = 'best' | 'rating' | 'reviews' | 'nearest';

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

function formatDistance(distance: number | null) {
  if (distance === null || Number.isNaN(distance)) {
    return 'غير معروف';
  }

  if (distance < 1000) {
    return `${Math.round(distance)} متر`;
  }

  return `${(distance / 1000).toFixed(1)} كم`;
}

function getOpenStatus(place: PlaceResult) {
  const raw = place.raw ?? {};

  const rawStatus = String(raw.open_status ?? '')
    .replace('🟢', '')
    .replace('🔴', '')
    .replace('⚪', '')
    .trim();

  if (rawStatus) return rawStatus;

  if (raw.opening_hours?.open_now === true) return 'مفتوح الآن';
  if (raw.opening_hours?.open_now === false) return 'مغلق الآن';
  if (raw.current_opening_hours?.open_now === true) return 'مفتوح الآن';
  if (raw.current_opening_hours?.open_now === false) return 'مغلق الآن';

  return 'غير متوفر';
}

function getOpenStatusIcon(status: string) {
  const cleanStatus = String(status)
    .replace('🟢', '')
    .replace('🔴', '')
    .replace('⚪', '')
    .trim();

  if (cleanStatus === 'مفتوح الآن') return '🟢';
  if (cleanStatus === 'مغلق الآن') return '🔴';
  return '⚪';
}

function getMatchLabel(place: PlaceResult) {
  return place.raw?.wenbest_match_label ?? 'مطابقة عامة';
}

function getRankBadge(index: number) {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return String(index + 1);
}

function buildMapsSearchUrl(place: PlaceResult) {
  if (place.latitude !== null && place.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  }

  const encoded = encodeURIComponent(`${place.name} ${place.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

function buildDirectionsUrl(place: PlaceResult) {
  if (place.latitude !== null && place.longitude !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
  }

  const encoded = encodeURIComponent(`${place.name} ${place.address}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
}

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const category = String(params.category ?? 'restaurants');
  const option = String(params.option ?? 'أفضل اختيار');
  const optionGroup = String(params.optionGroup ?? '');
  const cityKey = String(params.city ?? 'sharjah');
  const query = params.query ? String(params.query) : '';

  const selectedCity = getCityByKey(cityKey);
  const isMobile = width < 700;

  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Record<string, boolean>>({});
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [userDistances, setUserDistances] = useState<Record<string, number>>({});
  const [activeSort, setActiveSort] = useState<SortMode>('best');
  const [openOnly, setOpenOnly] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const pageSubtitle = optionGroup
    ? `${optionGroup} • ${option} • ${selectedCity.nameAr}`
    : `${getCategoryArabic(category)} • ${option} • ${selectedCity.nameAr}`;

  useEffect(() => {
    loadResults();
  }, [category, option, cityKey, query]);

  function changeCity(nextCityKey: string) {
    setCityModalVisible(false);

    router.replace({
      pathname: '/results',
      params: {
        category,
        option,
        optionGroup,
        query,
        city: nextCityKey,
      },
    });
  }

  function getEffectiveDistance(place: PlaceResult) {
    if (activeSort === 'nearest') {
      return userDistances[place.id] ?? place.distance;
    }

    return place.distance;
  }

  function calculateUserDistances(
    currentLocation: UserLocation,
    list: PlaceResult[] = []
  ) {
    const nextDistances: Record<string, number> = {};

    list.forEach((place) => {
      if (
        place?.id &&
        place.latitude !== null &&
        place.latitude !== undefined &&
        place.longitude !== null &&
        place.longitude !== undefined
      ) {
        nextDistances[place.id] = getDistanceInMeters(
          currentLocation.latitude,
          currentLocation.longitude,
          place.latitude,
          place.longitude
        );
      }
    });

    setUserDistances(nextDistances);
  }

  async function activateNearestSort() {
    setMessage('');
    setIsError(false);
    setLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setActiveSort('nearest');
        setMessage('لم يتم تفعيل الموقع، سيتم ترتيب الأقرب حسب مركز المدينة المختارة.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const currentLocation = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setUserLocation(currentLocation);
      calculateUserDistances(currentLocation, places);
      setActiveSort('nearest');
      setMessage('تم تفعيل موقعك الحالي، ويتم الآن ترتيب النتائج حسب الأقرب لك فعليًا.');
    } catch {
      setActiveSort('nearest');
      setMessage('تعذر تحديد موقعك الحالي، سيتم ترتيب الأقرب حسب مركز المدينة المختارة.');
    } finally {
      setLocating(false);
    }
  }

  const sortedPlaces = useMemo(() => {
    const list = [...places];

    let filteredList = [...list];

    if (openOnly) {
      filteredList = filteredList.filter(
        (place) => getOpenStatus(place) === 'مفتوح الآن'
      );
    }

    if (activeSort === 'rating') {
      return filteredList.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }

    if (activeSort === 'reviews') {
      return filteredList.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    }

    if (activeSort === 'nearest') {
      return filteredList.sort((a, b) => {
        const ad = userDistances[a.id] ?? a.distance ?? Number.MAX_SAFE_INTEGER;
        const bd = userDistances[b.id] ?? b.distance ?? Number.MAX_SAFE_INTEGER;
        return ad - bd;
      });
    }

    return filteredList.sort((a, b) => calculateWenBestScore(b) - calculateWenBestScore(a));
  }, [places, activeSort, userDistances, openOnly]);

  const bestPlace = sortedPlaces[0] ?? null;

  function getFeaturedTitle() {
    if (activeSort === 'nearest') return '📍 الأقرب لك الآن';
    if (activeSort === 'rating') return '⭐ الأعلى تقييماً';
    if (activeSort === 'reviews') return '💬 الأكثر مراجعات';
    return '🏆 الأعلى في WenBest';
  }

  function goBackSafely() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function loadResults() {
    setLoading(true);
    setMessage('');
    setIsError(false);
    setUserDistances({});
    setUserLocation(null);
    setActiveSort('best');
    setOpenOnly(false);
    setFavoriteIds({});

    try {
      const data = await searchPlaces({
        category,
        option,
        query,
        latitude: selectedCity.latitude,
        longitude: selectedCity.longitude,
        city: cityKey,
      });

      setPlaces(data);

      const { data: userData } = await supabase.auth.getUser();

      if (userData.user && data.length > 0) {
        const placeIds = data.map((place) => place.id);

        const { data: favoritesData, error: favoritesError } = await supabase
          .from('favorites')
          .select('place_id')
          .eq('user_id', userData.user.id)
          .in('place_id', placeIds);

        if (!favoritesError && favoritesData) {
          const nextFavoriteIds: Record<string, boolean> = {};

          favoritesData.forEach((item) => {
            if (item.place_id) nextFavoriteIds[item.place_id] = true;
          });

          setFavoriteIds(nextFavoriteIds);
        }
      }
    } catch {
      setIsError(true);
      setMessage('تعذر الاتصال بالخدمة. تأكد من الإنترنت ثم حاول مرة أخرى.');
      setPlaces([]);
      setFavoriteIds({});
    } finally {
      setLoading(false);
    }
  }

  async function openDirections(place: PlaceResult) {
    await Linking.openURL(buildDirectionsUrl(place));
  }

  async function openGoogleMaps(place: PlaceResult) {
    await Linking.openURL(buildMapsSearchUrl(place));
  }

  function openDetails(place: PlaceResult) {
    const score = calculateWenBestScore(place);
    const openStatus = getOpenStatus(place);
    const displayDistance = getEffectiveDistance(place);

    router.push({
      pathname: '/place-details',
      params: {
        id: place.id,
        name: place.name,
        address: place.address,
        category,
        option,
        optionGroup,
        sortMode: activeSort,
        city: cityKey,
        provider: place.provider,
        latitude: place.latitude !== null ? String(place.latitude) : '',
        longitude: place.longitude !== null ? String(place.longitude) : '',
        distance:
          displayDistance !== null && displayDistance !== undefined
            ? String(displayDistance)
            : '',
        score: String(score),
        matchLabel: getMatchLabel(place),
        rating: place.rating !== null ? String(place.rating) : '',
        reviewCount: place.reviewCount !== null ? String(place.reviewCount) : '',
        openStatusLabel: openStatus,
        openStatusIcon: getOpenStatusIcon(openStatus),
      },
    });
  }

  async function saveFavorite(place: PlaceResult) {
    setSavingId(place.id);
    setMessage('');
    setIsError(false);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setSavingId(null);
      router.push('/login');
      return;
    }

    const score = calculateWenBestScore(place);
    const openStatus = getOpenStatus(place);
    const displayDistance = getEffectiveDistance(place);

    const favoritePayload = {
      user_id: userData.user.id,
      place_id: place.id,
      place_name: place.name,
      category,
      address: place.address,
      rating: place.rating,
      review_count: place.reviewCount,
      latitude: place.latitude,
      longitude: place.longitude,
      provider: place.provider,
      raw_place_data: {
        ...place.raw,
        selected_category: category,
        selected_category_ar: getCategoryArabic(category),
        selected_option: option,
        selected_option_group: optionGroup,
        selected_city: selectedCity,
        user_location: userLocation,
        display_distance: displayDistance,
        wenbest_score: score,
        match_label: getMatchLabel(place),
        open_status: openStatus,
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('favorites')
      .upsert(favoritePayload, {
        onConflict: 'user_id,place_id',
      });

    setSavingId(null);

    if (error) {
      setIsError(true);
      setMessage('تعذر حفظ المكان. حاول مرة أخرى.');
      return;
    }

    setFavoriteIds((current) => ({
      ...current,
      [place.id]: true,
    }));

    setMessage(`تم حفظ "${place.name}" في المفضلة.`);
  }

  async function removeFavorite(place: PlaceResult) {
    setSavingId(place.id);
    setMessage('');
    setIsError(false);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setSavingId(null);
      router.push('/login');
      return;
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('place_id', place.id);

    setSavingId(null);

    if (error) {
      setIsError(true);
      setMessage('تعذر حذف المكان من المفضلة. حاول مرة أخرى.');
      return;
    }

    setFavoriteIds((current) => {
      const next = { ...current };
      delete next[place.id];
      return next;
    });

    setMessage(`تم حذف "${place.name}" من المفضلة.`);
  }

  async function toggleFavorite(place: PlaceResult) {
    if (favoriteIds[place.id]) {
      await removeFavorite(place);
    } else {
      await saveFavorite(place);
    }
  }

  function handleSortPress(value: SortMode) {
    if (value === 'nearest') {
      activateNearestSort();
      return;
    }

    setMessage('');
    setIsError(false);
    setActiveSort(value);
  }

  function renderSortButton(label: string, value: SortMode, icon: string) {
    const active = activeSort === value;

    return (
      <TouchableOpacity
        style={[styles.sortButton, active && styles.sortButtonActive]}
        onPress={() => handleSortPress(value)}
        disabled={locating && value === 'nearest'}
      >
        <Text style={[styles.sortButtonText, active && styles.sortButtonTextActive]}>
          {locating && value === 'nearest'
            ? '📍 جاري تحديد موقعك...'
            : `${icon} ${label}`}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderPlaceCard(place: PlaceResult, index: number, featured = false) {
    const score = calculateWenBestScore(place);
    const openStatus = getOpenStatus(place);
    const displayDistance = getEffectiveDistance(place);
    const isFavorite = favoriteIds[place.id];

    const reasonLabel =
      activeSort === 'nearest'
        ? `📍 يبعد ${formatDistance(displayDistance ?? null)}`
        : activeSort === 'rating'
          ? `⭐ تقييم ${place.rating ?? '-'}`
          : activeSort === 'reviews'
            ? `💬 ${place.reviewCount?.toLocaleString() ?? 0} مراجعة`
            : '🏆 أفضل نتيجة حسب WenBest';

    return (
      <View
        key={`${place.id}-${index}`}
        style={[styles.resultCard, featured && styles.featuredResultCard]}
      >
        <View style={styles.resultTopRow}>
          <View style={styles.rankCircle}>
            <Text style={styles.rankText}>{getRankBadge(index)}</Text>
          </View>

          <View style={styles.resultTitleBox}>
            <Text style={[styles.resultTitle, featured && styles.featuredResultTitle]}>
              {place.name}
            </Text>
            <Text style={[styles.resultAddress, featured && styles.featuredResultAddress]}>
              {place.address}
            </Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>🏆 {score}/100</Text>
          </View>

          <View style={styles.googleBadge}>
            <Text style={styles.googleBadgeText}>Google</Text>
          </View>

          {optionGroup ? (
            <View style={styles.groupBadge}>
              <Text style={styles.groupBadgeText}>{optionGroup}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>⭐ {place.rating ?? 'غير متوفر'}</Text>
            <Text style={styles.metaLabel}>التقييم</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaText}>💬 {place.reviewCount ?? 0}</Text>
            <Text style={styles.metaLabel}>المراجعات</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaText}>📍 {formatDistance(displayDistance ?? null)}</Text>
            <Text style={styles.metaLabel}>
              {activeSort === 'nearest' && userLocation
                ? 'المسافة من موقعك'
                : 'المسافة من المدينة'}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaText}>
              {getOpenStatusIcon(openStatus)} {openStatus}
            </Text>
            <Text style={styles.metaLabel}>الدوام</Text>
          </View>

          <View style={styles.metaItemWide}>
            <Text style={styles.metaText}>{reasonLabel}</Text>
            <Text style={styles.metaLabel}>سبب الترتيب</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
  <TouchableOpacity style={styles.primaryAction} onPress={() => openDetails(place)}>
    <Text style={styles.primaryActionText}>اضغط لفتح التفاصيل</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.saveAction, isFavorite && styles.removeFavoriteAction]}
    onPress={() => toggleFavorite(place)}
    disabled={savingId === place.id}
  >
    <Text style={[styles.saveActionText, isFavorite && styles.removeFavoriteActionText]}>
      {savingId === place.id
        ? 'جاري التنفيذ...'
        : isFavorite
          ? 'حذف من المفضلة'
          : 'حفظ في المفضلة'}
    </Text>
  </TouchableOpacity>
</View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.iconButton} onPress={goBackSafely}>
            <Text style={styles.iconButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.logoMiniBox}>
            <Image source={logoImage} style={styles.logoMini} resizeMode="contain" />
          </View>

          <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')}>
            <Text style={styles.homeButtonText}>الرئيسية</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>نتائج WenBest</Text>
          <Text style={styles.pageSubtitle}>{pageSubtitle}</Text>

          <View style={styles.headerPills}>
            <TouchableOpacity
              style={styles.headerPill}
              onPress={() => setCityModalVisible(true)}
            >
              <Text style={styles.headerPillText}>📍 {selectedCity.nameAr} ▼</Text>
            </TouchableOpacity>

            <View style={styles.headerPillGold}>
              <Text style={styles.headerPillGoldText}>{sortedPlaces.length} نتيجة</Text>
            </View>

            {activeSort === 'nearest' && userLocation ? (
              <View style={styles.headerPillTeal}>
                <Text style={styles.headerPillTealText}>الأقرب من موقعك الحالي</Text>
              </View>
            ) : null}

            {optionGroup ? (
              <View style={styles.headerPillTeal}>
                <Text style={styles.headerPillTealText}>{optionGroup}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.sortCard}>
          <Text style={styles.sortTitle}>رتّب وفلتر النتائج</Text>
          <View style={styles.sortRow}>
            {renderSortButton('WenBest', 'best', '🏆')}
            {renderSortButton('الأقرب إلي', 'nearest', '📍')}
            {renderSortButton('أعلى تقييم', 'rating', '⭐')}
            {renderSortButton('أكثر مراجعات', 'reviews', '💬')}

            <TouchableOpacity
              style={[styles.sortButton, openOnly && styles.sortButtonActive]}
              onPress={() => setOpenOnly((current) => !current)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  openOnly && styles.sortButtonTextActive,
                ]}
              >
                🟢 مفتوح الآن
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.navy} />
            <Text style={styles.loadingText}>جاري تحميل النتائج...</Text>
          </View>
        ) : null}

        {message ? (
          <View style={[styles.messageBox, isError && styles.errorBox]}>
            <Text style={[styles.messageText, isError && styles.errorText]}>
              {message}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.sponsoredResultSlot}>
  <View style={styles.sponsoredBadge}>
    <Text style={styles.sponsoredBadgeText}>مساحة إعلانية</Text>
  </View>

  <Text style={styles.sponsoredTitle}>
    يظهر هنا محتوى ترويجي مميز
  </Text>

  <Text style={styles.sponsoredDescription}>
    يتم عرض الإعلانات بشكل مستقل عن نتائج WenBest مع المحافظة على شفافية الترتيب.
  </Text>
</TouchableOpacity>

        {!loading && bestPlace ? (
  <View style={styles.featuredSection}>
    <Text style={styles.bestLabel}>{getFeaturedTitle()}</Text>
    {renderPlaceCard(bestPlace, 0, true)}
  </View>
) : null}

        {!loading && sortedPlaces.length > 0 ? (
  <View style={styles.listSection}>
    <Text style={styles.listTitle}>قائمة النتائج</Text>
    <Text style={styles.listCount}>{Math.max(sortedPlaces.length - 1, 0)} مكان</Text>

    <View style={styles.resultsList}>
      {sortedPlaces.slice(1).map((place, index) => (
  <View key={`${place.id}-with-ad`}>
    {index === 3 ? (
      <TouchableOpacity style={styles.midSponsoredCard}>
        <View style={styles.midSponsoredBadge}>
          <Text style={styles.midSponsoredBadgeText}>مساحة إعلانية</Text>
        </View>

        <Text style={styles.midSponsoredTitle}>مساحة مخصصة للمحتوى الترويجي</Text>

        <Text style={styles.midSponsoredDescription}>
          يظهر هذا المحتوى بشكل مستقل عن ترتيب نتائج WenBest.
        </Text>
      </TouchableOpacity>
    ) : null}

    {renderPlaceCard(place, index + 1)}
  </View>
))}
    </View>
  </View>
) : null}

        {!loading && sortedPlaces.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyTitle}>لا توجد نتائج مناسبة</Text>
            <Text style={styles.emptyText}>
              جرّب تغيير المدينة أو الرجوع للرئيسية وكتابة بحث حر أكثر تحديدًا.
            </Text>
          </View>
        ) : null}

<TouchableOpacity style={styles.bottomSponsoredCard}>
  <Text style={styles.bottomSponsoredTitle}>
    ⭐ مساحة مخصصة للظهور المميز
  </Text>

  <Text style={styles.bottomSponsoredDescription}>
    يمكن للأنشطة التجارية الظهور في مواقع مخصصة داخل التطبيق
    بشكل مستقل عن ترتيب النتائج.
  </Text>

  <View style={styles.bottomSponsoredButton}>
    <Text style={styles.bottomSponsoredButtonText}>
      المزيد
    </Text>
  </View>
</TouchableOpacity>

        <Text style={styles.footerNote}>
          خيار الأقرب إلي يستخدم موقعك الحالي فقط عند الضغط عليه، أما باقي الخيارات فتعتمد على المدينة المختارة.
        </Text>
      </ScrollView>

      <Modal
        visible={cityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.cityModalBox}>
            <Text style={styles.cityModalTitle}>اختر المدينة</Text>
            <Text style={styles.cityModalSubtitle}>
              سيتم تحديث النتائج حسب المدينة المختارة
            </Text>

            <View style={styles.cityModalList}>
              {cities.map((city) => {
                const active = city.key === cityKey;

                return (
                  <TouchableOpacity
                    key={city.key}
                    style={[styles.cityModalChip, active && styles.cityModalChipActive]}
                    onPress={() => changeCity(city.key)}
                  >
                    <Text
                      style={[
                        styles.cityModalChipText,
                        active && styles.cityModalChipTextActive,
                      ]}
                    >
                      {active ? '✓ ' : ''}
                      {city.nameAr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.cityModalCancel}
              onPress={() => setCityModalVisible(false)}
            >
              <Text style={styles.cityModalCancelText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: 18,
    paddingBottom: 44,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  containerMobile: {
    padding: 14,
    paddingBottom: 34,
  },
  topHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: '900',
  },
  homeButton: {
    backgroundColor: colors.navy,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  homeButtonText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 15,
  },
  logoMiniBox: {
    width: 76,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMini: {
    width: 64,
    height: 48,
  },
  pageHeader: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  pageTitle: {
    color: colors.navy,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'right',
  },
  pageSubtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 8,
    lineHeight: 24,
  },
  headerPills: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  headerPill: {
    backgroundColor: '#E6FFFA',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerPillText: {
    color: colors.tealDark,
    fontWeight: '900',
  },
  headerPillGold: {
    backgroundColor: '#FFF7E0',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerPillGoldText: {
    color: colors.navy,
    fontWeight: '900',
  },
  headerPillTeal: {
    backgroundColor: colors.navy,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerPillTealText: {
    color: colors.white,
    fontWeight: '900',
  },
  sortCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sortTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 12,
  },
  sortRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  sortButtonActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  sortButtonText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '900',
  },
  sortButtonTextActive: {
    color: colors.white,
  },
  loadingBox: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: colors.navy,
    fontWeight: '900',
    marginTop: 12,
  },
  messageBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  messageText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
    lineHeight: 22,
  },
  errorText: {
    color: colors.red,
  },
  featuredSection: {
  marginBottom: 16,
},
  bestLabel: {
    color: colors.gold,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  featuredResultCard: {
    backgroundColor: '#0B2B5B',
    borderColor: '#123B78',
  },
  resultTopRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    alignItems: 'flex-start',
  },
  rankCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: colors.tealDark,
    fontSize: 16,
    fontWeight: '900',
  },
  resultTitleBox: {
    flex: 1,
  },
  resultTitle: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
    lineHeight: 28,
  },
  featuredResultTitle: {
    color: colors.white,
  },
  resultAddress: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 21,
    marginTop: 5,
  },
  featuredResultAddress: {
    color: '#CBD5E1',
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  scoreBadge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  scoreBadgeText: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 13,
  },
  googleBadge: {
    backgroundColor: '#EEF6FF',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  googleBadgeText: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 13,
  },
  groupBadge: {
    backgroundColor: '#E6FFFA',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  groupBadgeText: {
    color: colors.tealDark,
    fontWeight: '900',
    fontSize: 13,
  },
  metaGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaItem: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 10,
    minWidth: 130,
    flexGrow: 1,
  },
  metaItemWide: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 10,
    width: '100%',
  },
  metaText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 12,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: colors.gold,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionText: {
    color: colors.navy,
    fontWeight: '900',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionText: {
    color: colors.tealDark,
    fontWeight: '900',
  },
  mapAction: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapActionText: {
    color: colors.navy,
    fontWeight: '900',
  },
  saveAction: {
    flex: 1,
    backgroundColor: colors.navy,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveActionText: {
    color: colors.white,
    fontWeight: '900',
  },
  removeFavoriteAction: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removeFavoriteActionText: {
    color: colors.red,
    fontWeight: '900',
  },
  listSection: {
    marginTop: 4,
  },
  listTitle: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',
  },
  listCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 12,
  },
  resultsList: {
    gap: 0,
  },
  emptyBox: {
    backgroundColor: colors.white,
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.navy,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 8,
  },
  footerNote: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 33, 74, 0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  cityModalBox: {
    backgroundColor: colors.white,
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityModalTitle: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'right',
  },
  cityModalSubtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 14,
  },
  cityModalList: {
    gap: 10,
  },
  cityModalChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'flex-end',
  },
  cityModalChipActive: {
    backgroundColor: '#E6FFFA',
    borderColor: '#99F6E4',
  },
  cityModalChipText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  cityModalChipTextActive: {
    color: colors.tealDark,
  },
  cityModalCancel: {
    backgroundColor: colors.navy,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  bestSummaryBox: {
  backgroundColor: colors.navy,
  borderRadius: 20,
  paddingVertical: 14,
  paddingHorizontal: 18,
  marginBottom: 16,
  alignItems: 'flex-end',
},
bestSummaryTitle: {
  color: colors.gold,
  fontSize: 16,
  fontWeight: '900',
  textAlign: 'right',
},
bestSummaryName: {
  color: colors.white,
  fontSize: 20,
  fontWeight: '900',
  textAlign: 'right',
  marginTop: 6,
},
bestSummaryMeta: {
  color: '#CBD5E1',
  fontSize: 13,
  fontWeight: '700',
  textAlign: 'right',
  marginTop: 4,
},
bestSummaryHint: {
  color: colors.gold,
  fontSize: 12,
  fontWeight: '800',
  textAlign: 'right',
  marginTop: 8,
},
  cityModalCancelText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  sponsoredResultSlot: {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#FDE68A',
  borderRadius: 24,
  padding: 20,
  marginBottom: 18,
  overflow: 'hidden',
},

sponsoredBadge: {
  alignSelf: 'flex-start',
  backgroundColor: '#FFF7E0',
  borderRadius: 999,
  paddingHorizontal: 10,
  paddingVertical: 5,
},

sponsoredBadgeText: {
  color: '#A16207',
  fontSize: 11,
  fontWeight: '900',
},

sponsoredTitle: {
  color: colors.navy,
  fontSize: 22,
  fontWeight: '900',
  textAlign: 'right',
  marginTop: 12,
},

sponsoredDescription: {
  color: colors.muted,
  fontSize: 14,
  lineHeight: 24,
  textAlign: 'right',
  marginTop: 8,
},
midSponsoredCard: {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#FDE68A',
  borderRadius: 24,
  padding: 20,
  marginBottom: 18,
},

midSponsoredBadge: {
  alignSelf: 'flex-start',
  backgroundColor: '#FFF7E0',
  borderRadius: 999,
  paddingHorizontal: 10,
  paddingVertical: 5,
},

midSponsoredBadgeText: {
  color: '#A16207',
  fontWeight: '900',
  fontSize: 11,
},

midSponsoredTitle: {
  color: colors.navy,
  fontSize: 18,
  fontWeight: '900',
  textAlign: 'right',
  marginTop: 10,
},

midSponsoredDescription: {
  color: colors.muted,
  fontSize: 13,
  textAlign: 'right',
  marginTop: 6,
  lineHeight: 22,
},
bottomSponsoredCard: {
  backgroundColor: '#FFFCF5',
  borderWidth: 1,
  borderColor: '#FDE68A',
  borderRadius: 24,
  padding: 22,
  marginTop: 24,
  marginBottom: 24,
},

bottomSponsoredTitle: {
  color: colors.navy,
  fontSize: 22,
  fontWeight: '900',
  textAlign: 'center',
},

bottomSponsoredDescription: {
  color: colors.muted,
  fontSize: 14,
  lineHeight: 24,
  textAlign: 'center',
  marginTop: 10,
},

bottomSponsoredButton: {
  alignSelf: 'center',
  marginTop: 16,
  backgroundColor: colors.gold,
  paddingHorizontal: 24,
  paddingVertical: 10,
  borderRadius: 999,
},

bottomSponsoredButtonText: {
  color: colors.navy,
  fontWeight: '900',
},
});