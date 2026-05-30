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
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

const logoImage = require('../../assets/images/wenbest-logo.png');

const GOOGLE_PLACE_DETAILS_FUNCTION_URL =
  process.env.EXPO_PUBLIC_SUPABASE_GOOGLE_PLACE_DETAILS_FUNCTION ?? '';

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

type ReviewItem = {
  author_name?: string;
  authorName?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
  relativeTimeDescription?: string;
  time?: number;
  profile_photo_url?: string;
};

function formatDistance(distanceValue: string) {
  const distance = Number(distanceValue);

  if (!distanceValue || Number.isNaN(distance)) {
    return 'غير معروف';
  }

  if (distance < 1000) {
    return `${Math.round(distance)} متر`;
  }

  return `${(distance / 1000).toFixed(1)} كم`;
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

function getMapsUrl(name: string, address: string, latitude: string, longitude: string) {
  if (latitude && longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${address}`
  )}`;
}

function getDirectionsUrl(name: string, address: string, latitude: string, longitude: string) {
  if (latitude && longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${name} ${address}`
  )}`;
}

function parseReviews(value: any): ReviewItem[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (Array.isArray(parsed?.reviews)) {
      return parsed.reviews;
    }

    if (Array.isArray(parsed?.result?.reviews)) {
      return parsed.result.reviews;
    }

    return [];
  } catch {
    return [];
  }
}

function renderStars(rating?: number) {
  const value = Number(rating || 0);

  if (!value || Number.isNaN(value)) {
    return '⭐';
  }

  const fullStars = Math.max(1, Math.min(5, Math.round(value)));

  return '⭐'.repeat(fullStars);
}

export default function PlaceDetailsScreen() {
  const params = useLocalSearchParams();
  const sortMode = String(params.sortMode ?? 'best');

  const id = String(params.id ?? '');
  const name = String(params.name ?? 'مكان غير معروف');
  const address = String(params.address ?? 'لا يوجد عنوان');
  const category = String(params.category ?? '');
  const option = String(params.option ?? '');
  const optionGroup = String(params.optionGroup ?? '');
  const city = String(params.city ?? '');
  const provider = String(params.provider ?? 'google');

  const latitude = String(params.latitude ?? '');
  const longitude = String(params.longitude ?? '');
  const distance = String(params.distance ?? '');
  const score = String(params.score ?? '0');
  const matchLabel = String(params.matchLabel ?? 'مطابقة عامة');
  const rating = String(params.rating ?? '');
  const reviewCount = String(params.reviewCount ?? '');
  const openStatusLabel = String(params.openStatusLabel ?? 'غير معلوم');
  const openStatusIcon = String(params.openStatusIcon ?? '⚪');
  const explainTitle =
  sortMode === 'nearest'
    ? '📍 لماذا ظهر كالأقرب لك؟'
    : sortMode === 'rating'
      ? '⭐ لماذا ظهر كأعلى تقييم؟'
      : sortMode === 'reviews'
        ? '💬 لماذا ظهر كأكثر مراجعات؟'
        : '🏆 لماذا اختاره WenBest؟';

const explainText =
  sortMode === 'nearest'
    ? 'تم ترتيبه بناءً على قربه من موقعك الحالي مع مراعاة بيانات المكان المتاحة.'
    : sortMode === 'rating'
      ? 'ظهر هنا لأن تقييمه من Google من بين الأعلى ضمن النتائج.'
      : sortMode === 'reviews'
        ? 'ظهر هنا لأنه من أكثر الأماكن حصولًا على مراجعات من المستخدمين.'
        : 'يعتمد WenBest على التقييم، عدد المراجعات، المسافة، ومدى مطابقة المكان لبحثك.';

  const initialReviews = useMemo(() => {
    return parseReviews(params.reviews ?? params.googleReviews ?? params.rawReviews);
  }, [params.reviews, params.googleReviews, params.rawReviews]);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [reviewsVisible, setReviewsVisible] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [googleReviews, setGoogleReviews] = useState<ReviewItem[]>(initialReviews);
  const [reviewsLoaded, setReviewsLoaded] = useState(initialReviews.length > 0);

  const categoryLabel = getCategoryArabic(category);
  const mapsUrl = getMapsUrl(name, address, latitude, longitude);
  const directionsUrl = getDirectionsUrl(name, address, latitude, longitude);

  const reviewsToShow = googleReviews.length > 0 ? googleReviews : initialReviews;

  useEffect(() => {
    checkFavoriteStatus();
  }, [id]);

  async function checkFavoriteStatus() {
    if (!id) {
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setFavoriteId(null);
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('place_id', id)
      .maybeSingle();

    if (error) {
      setFavoriteId(null);
      return;
    }

    setFavoriteId(data?.id ?? null);
  }

  async function toggleFavorite() {
    setMessage('');
    setIsError(false);
    setFavoriteLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setFavoriteLoading(false);
      router.push('/login');
      return;
    }

    if (favoriteId) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      setFavoriteLoading(false);

      if (error) {
        setIsError(true);
        setMessage(`تعذر إزالة المكان من المفضلة: ${error.message}`);
        return;
      }

      setFavoriteId(null);
      setIsError(false);
      setMessage('تمت إزالة المكان من المفضلة.');
      return;
    }

    const favoritePayload = {
      user_id: userData.user.id,
      place_id: id,
      place_name: name,
      category,
      address,
      rating: rating ? Number(rating) : null,
      review_count: reviewCount ? Number(reviewCount) : null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      provider,
      raw_place_data: {
        selected_category: category,
        selected_category_ar: categoryLabel,
        selected_option: option,
        selected_option_group: optionGroup,
        selected_city_key: city,
        wenbest_score: score,
        match_label: matchLabel,
        open_status: openStatusLabel,
        distance,
        maps_url: mapsUrl,
      },
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('favorites')
      .upsert(favoritePayload, {
        onConflict: 'user_id,place_id',
      })
      .select('id')
      .single();

    setFavoriteLoading(false);

    if (error) {
      setIsError(true);
      setMessage(`تعذر حفظ المكان في المفضلة: ${error.message}`);
      return;
    }

    setFavoriteId(data?.id ?? null);
    setIsError(false);
    setMessage('تم حفظ المكان في المفضلة.');
  }

  function goBackSafely() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  function goHome() {
    router.replace('/');
  }

  async function openDirections() {
    setMessage('');
    setIsError(false);

    try {
      await Linking.openURL(directionsUrl);
    } catch (error) {
      setIsError(true);
      setMessage('تعذر فتح الاتجاهات. حاول فتح المكان عبر Google Maps.');
    }
  }

  async function openGoogleMaps() {
    setMessage('');
    setIsError(false);

    try {
      await Linking.openURL(mapsUrl);
    } catch (error) {
      setIsError(true);
      setMessage('تعذر فتح Google Maps لهذا المكان.');
    }
  }

  async function sharePlace() {
    setMessage('');
    setIsError(false);

    const shareText = `رشحت لك هذا المكان من WenBest:

${name}

العنوان:
${address}

التصنيف:
${optionGroup || categoryLabel}${option ? ` - ${option}` : ''}

التقييم: ${rating || 'غير متوفر'}
المراجعات: ${reviewCount || 'غير متوفر'}
درجة WenBest: ${score}/100
المسافة: ${formatDistance(distance)}

رابط المكان:
${mapsUrl}`;

    try {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: name,
          text: shareText,
          url: mapsUrl,
        });
        return;
      }

      const canOpenWhatsapp = await Linking.canOpenURL(whatsappUrl);

      if (canOpenWhatsapp) {
        await Linking.openURL(whatsappUrl);
        return;
      }

      await Linking.openURL(mapsUrl);
    } catch (error) {
      setIsError(true);
      setMessage('تعذرت المشاركة من هذا المتصفح. يمكنك فتح Google Maps ومشاركة المكان منه.');
    }
  }

  async function loadGoogleReviews() {
    if (reviewsLoaded && googleReviews.length > 0) {
      return;
    }

    setReviewsLoading(true);
    setReviewsError('');

    try {
      if (!GOOGLE_PLACE_DETAILS_FUNCTION_URL) {
        throw new Error('رابط دالة جلب التعليقات غير موجود في ملف .env');
      }

      if (!id) {
        throw new Error('لا يوجد Place ID لهذا المكان.');
      }

      const response = await fetch(GOOGLE_PLACE_DETAILS_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: id,
          language: 'ar',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'فشل جلب التعليقات.');
      }

      if (data?.error && !data?.reviews) {
        throw new Error(data.error);
      }

      const fetchedReviews = parseReviews(data.reviews);

      setGoogleReviews(fetchedReviews);
      setReviewsLoaded(true);

      if (fetchedReviews.length === 0) {
        setReviewsError(data?.error || 'لم تُرجع Google تعليقات لهذا المكان حاليًا.');
      }
    } catch (error: any) {
      setReviewsError(error?.message || 'تعذر جلب التعليقات من Google حاليًا.');
    } finally {
      setReviewsLoading(false);
    }
  }

  async function openReviewsModal() {
    setMessage('');
    setIsError(false);
    setReviewsVisible(true);
    await loadGoogleReviews();
  }

  const openStatusStyle =
    openStatusLabel === 'مفتوح الآن'
      ? styles.statusOpen
      : openStatusLabel === 'مغلق الآن'
        ? styles.statusClosed
        : styles.statusUnknown;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.iconButton} onPress={goBackSafely}>
            <Text style={styles.iconButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.logoMiniBox}>
            <Image source={logoImage} style={styles.logoMini} resizeMode="contain" />
          </View>

          <TouchableOpacity style={styles.homeButton} onPress={goHome}>
            <Text style={styles.homeButtonText}>الرئيسية</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>تفاصيل المكان</Text>
          <Text style={styles.pageSubtitle}>
            {optionGroup || categoryLabel}
            {option ? ` • ${option}` : ''}
            {city ? ` • ${city}` : ''}
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroScoreRow}>
            <View style={styles.scorePill}>
              <Text style={styles.scorePillText}>🧠 {score}/100</Text>
            </View>

            <Text style={styles.bestChoiceText}>
              {Number(score) >= 85 ? '⭐ اختيار قوي' : '⭐ اختيار مناسب'}
            </Text>
          </View>

          <Text style={styles.placeName}>{name}</Text>
          <Text style={styles.placeAddress}>{address}</Text>

          <View style={styles.heroBadges}>
            <View style={styles.whiteBadge}>
              <Text style={styles.whiteBadgeText}>🌐 Google Places</Text>
            </View>

            <View style={[styles.whiteBadge, openStatusStyle]}>
              <Text style={styles.whiteBadgeText}>
                {openStatusIcon} {openStatusLabel}
              </Text>
            </View>

            <View style={styles.whiteBadge}>
              <Text style={styles.whiteBadgeText}>🔎 {matchLabel}</Text>
            </View>
          </View>
        </View>

        {message ? (
          <View style={[styles.messageBox, isError && styles.errorBox]}>
            <Text style={[styles.messageText, isError && styles.errorText]}>
              {message}
            </Text>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{rating || 'غير متوفر'}</Text>
            <Text style={styles.statLabel}>التقييم</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💬</Text>
            <Text style={styles.statValue}>{reviewCount || '0'}</Text>
            <Text style={styles.statLabel}>المراجعات</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statValue}>{formatDistance(distance)}</Text>
            <Text style={styles.statLabel}>المسافة</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🧠</Text>
            <Text style={styles.statValue}>{score}/100</Text>
            <Text style={styles.statLabel}>WenBest</Text>
          </View>
        </View>

        <View style={styles.actionPanel}>
  <TouchableOpacity style={styles.primaryAction} onPress={openDirections}>
    <Text style={styles.primaryActionText}>الاتجاهات</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.secondaryAction} onPress={openGoogleMaps}>
    <Text style={styles.secondaryActionText}>افتح في الخرائط</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.commentsAction} onPress={openReviewsModal}>
    <Text style={styles.commentsActionText}>قراءة التعليقات 💬</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={favoriteId ? styles.removeFavoriteAction : styles.favoriteAction}
    onPress={toggleFavorite}
    disabled={favoriteLoading}
  >
    <Text style={favoriteId ? styles.removeFavoriteActionText : styles.favoriteActionText}>
      {favoriteLoading
        ? 'جاري التنفيذ...'
        : favoriteId
          ? 'إزالة من المفضلة'
          : 'حفظ في المفضلة'}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.shareAction} onPress={sharePlace}>
    <Text style={styles.shareActionText}>مشاركة المكان</Text>
  </TouchableOpacity>
</View>

        <View style={styles.reasonCard}>
          <Text style={styles.reasonTitle}>{explainTitle}</Text>
          <Text style={styles.reasonText}>
           {explainText}
          </Text>

          <View style={styles.reasonItem}>
            <View style={styles.reasonIconBox}>
              <Text style={styles.reasonIcon}>⭐</Text>
            </View>
            <View style={styles.reasonTextBox}>
              <Text style={styles.reasonItemTitle}>درجة WenBest</Text>
              <Text style={styles.reasonItemText}>{score}/100</Text>
            </View>
          </View>

          <View style={styles.reasonItem}>
            <View style={styles.reasonIconBox}>
              <Text style={styles.reasonIcon}>🔎</Text>
            </View>
            <View style={styles.reasonTextBox}>
              <Text style={styles.reasonItemTitle}>مطابقة البحث</Text>
              <Text style={styles.reasonItemText}>{matchLabel}</Text>
            </View>
          </View>

          <View style={styles.reasonItem}>
            <View style={styles.reasonIconBox}>
              <Text style={styles.reasonIcon}>📍</Text>
            </View>
            <View style={styles.reasonTextBox}>
              <Text style={styles.reasonItemTitle}>المسافة</Text>
              <Text style={styles.reasonItemText}>{formatDistance(distance)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>معلومات المكان</Text>

          {optionGroup ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>التصنيف الفرعي</Text>
              <Text style={styles.infoValue}>{optionGroup}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>البحث المختار</Text>
            <Text style={styles.infoValue}>{option || 'أفضل اختيار'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>المسافة</Text>
            <Text style={styles.infoValue}>{formatDistance(distance)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>التقييم</Text>
            <Text style={styles.infoValue}>{rating || 'غير متوفر'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>عدد المراجعات</Text>
            <Text style={styles.infoValue}>{reviewCount || '0'}</Text>
          </View>

          {openStatusLabel !== 'غير معلوم' && (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>حالة الدوام</Text>
    <Text style={styles.infoValue}>{openStatusLabel}</Text>
  </View>
)}
  
        </View>

      </ScrollView>

      <Modal
        visible={reviewsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewsVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.reviewsSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.reviewsHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setReviewsVisible(false)}
              >
                <Text style={styles.closeButtonText}>إغلاق</Text>
              </TouchableOpacity>

              <View style={styles.reviewsTitleBox}>
                <Text style={styles.reviewsTitle}>تعليقات المكان</Text>
                <Text style={styles.reviewsSubtitle}>{name}</Text>
              </View>
            </View>

            <ScrollView style={styles.reviewsList} contentContainerStyle={styles.reviewsListContent}>
              {reviewsLoading ? (
                <View style={styles.noReviewsBox}>
                  <ActivityIndicator color={colors.navy} />
                  <Text style={styles.noReviewsTitle}>جاري جلب التعليقات...</Text>
                  <Text style={styles.noReviewsText}>
                    يتم الآن جلب تعليقات Google لهذا المكان.
                  </Text>
                </View>
              ) : reviewsToShow.length > 0 ? (
                reviewsToShow.map((review, index) => {
                  const author = review.author_name || review.authorName || 'مستخدم Google';
                  const reviewRating = Number(review.rating || 0);
                  const reviewText = review.text || 'لا يوجد نص للتعليق.';
                  const timeText =
                    review.relative_time_description ||
                    review.relativeTimeDescription ||
                    '';

                  return (
                    <View key={`${author}-${index}`} style={styles.reviewCard}>
                      <View style={styles.reviewTopRow}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>
                            {author.slice(0, 1).toUpperCase()}
                          </Text>
                        </View>

                        <View style={styles.reviewHeaderText}>
                          <Text style={styles.reviewAuthor}>{author}</Text>
                          <Text style={styles.reviewRating}>
                            {renderStars(reviewRating)} {reviewRating ? `${reviewRating}/5` : ''}
                          </Text>
                          {timeText ? (
                            <Text style={styles.reviewTime}>{timeText}</Text>
                          ) : null}
                        </View>
                      </View>

                      <Text style={styles.reviewText}>{reviewText}</Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.noReviewsBox}>
                  <Text style={styles.noReviewsIcon}>💬</Text>
                  <Text style={styles.noReviewsTitle}>لا توجد تعليقات متاحة حاليًا</Text>
                  <Text style={styles.noReviewsText}>
                    {reviewsError || 'لم تُرجع Google تعليقات لهذا المكان حاليًا.'}
                  </Text>

                  <TouchableOpacity style={styles.openMapsReviewsButton} onPress={openGoogleMaps}>
                    <Text style={styles.openMapsReviewsButtonText}>
                     افتح المكان في الخرائط
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
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
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
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
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'right',
  },
  pageSubtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 8,
    lineHeight: 23,
  },
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: 32,
    padding: 22,
    marginBottom: 16,
  },
  heroScoreRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  scorePill: {
    backgroundColor: colors.teal,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  scorePillText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
  bestChoiceText: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    flex: 1,
  },
  placeName: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 46,
    textAlign: 'center',
  },
  placeAddress: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 27,
    textAlign: 'center',
    marginTop: 14,
  },
  heroBadges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  whiteBadge: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  whiteBadgeText: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  statusOpen: {
    backgroundColor: '#DCFCE7',
  },
  statusClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusUnknown: {
    backgroundColor: colors.gold,
  },
  messageBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  messageText: {
    color: colors.green,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    color: colors.red,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    minHeight: 150,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  statValue: {
    color: colors.navy,
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  actionPanel: {
    backgroundColor: colors.white,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  primaryAction: {
    backgroundColor: colors.gold,
    borderRadius: 18,
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryAction: {
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 18,
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionText: {
    color: colors.tealDark,
    fontSize: 16,
    fontWeight: '900',
  },
  commentsAction: {
    backgroundColor: '#FFF7E0',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsActionText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
  },
  favoriteAction: {
  backgroundColor: '#DDF7F4',
  borderWidth: 1,
  borderColor: '#A7E7DF',
  borderRadius: 18,
  minHeight: 54,
  justifyContent: 'center',
  alignItems: 'center',
},
favoriteActionText: {
  color: '#0A7A70',
  fontSize: 16,
  fontWeight: '900',
},
  removeFavoriteAction: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFavoriteActionText: {
    color: colors.red,
    fontSize: 16,
    fontWeight: '900',
  },
  shareAction: {
    backgroundColor: colors.navy,
    borderRadius: 18,
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareActionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  reasonCard: {
    backgroundColor: colors.white,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  reasonTitle: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',
  },
  reasonText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 23,
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 14,
  },
  reasonItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 10,
  },
  reasonIconBox: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonIcon: {
    fontSize: 28,
  },
  reasonTextBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  reasonItemTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  reasonItemText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 8,
  },
  infoRow: {
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    paddingVertical: 14,
    alignItems: 'flex-end',
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 5,
  },
  infoValue: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
    lineHeight: 23,
  },
  footerNote: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 33, 74, 0.55)',
    justifyContent: 'flex-end',
  },
  reviewsSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '82%',
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 22,
  },
  modalHandle: {
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  reviewsHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  reviewsTitleBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  reviewsTitle: {
    color: colors.navy,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'right',
  },
  reviewsSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: colors.navy,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  closeButtonText: {
    color: colors.white,
    fontWeight: '900',
  },
  reviewsList: {
    flexGrow: 0,
  },
  reviewsListContent: {
    paddingBottom: 8,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  reviewTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '900',
  },
  reviewHeaderText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  reviewAuthor: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  reviewRating: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 4,
  },
  reviewTime: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 3,
  },
  reviewText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 25,
    fontWeight: '700',
    textAlign: 'right',
  },
  noReviewsBox: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    alignItems: 'center',
  },
  noReviewsIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  noReviewsTitle: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 10,
  },
  noReviewsText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 8,
  },
  openMapsReviewsButton: {
    backgroundColor: colors.gold,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 16,
  },
  openMapsReviewsButtonText: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 15,
  },
});