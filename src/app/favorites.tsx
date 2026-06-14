import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNav from '../components/BottomNav';

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

type FavoriteItem = {
  id: string;
  user_id: string;
  place_id: string;
  place_name: string;
  category: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  latitude: number | null;
  longitude: number | null;
  provider: string | null;
  raw_place_data: any;
  created_at?: string;
};

function normalizeText(value: string) {
  return String(value)
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCategoryArabic(category?: string | null) {
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

  if (!category) return 'غير محدد';

  return names[category] ?? category;
}

function formatDistance(distance: any) {
  const value = Number(distance);

  if (!value || Number.isNaN(value)) {
    return 'غير معروف';
  }

  if (value < 1000) {
    return `${Math.round(value)} متر`;
  }

  return `${(value / 1000).toFixed(1)} كم`;
}

function formatValue(value: any, fallback = 'غير متوفر') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return String(value);
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('الكل');

  const categoryFilters = useMemo(() => {
    const names = favorites.map((item) => getCategoryArabic(item.category));
    return ['الكل', ...Array.from(new Set(names))];
  }, [favorites]);

  const filteredFavorites = useMemo(() => {
    const query = normalizeText(searchText);

    return favorites.filter((item) => {
      const categoryName = getCategoryArabic(item.category);
      const cityName = getCityName(item);
      const openStatus = getOpenStatus(item);
      const matchLabel = getMatchLabel(item);

      const matchesCategory =
        selectedCategoryFilter === 'الكل' || categoryName === selectedCategoryFilter;

      const searchableText = normalizeText(
        [
          item.place_name,
          item.address ?? '',
          categoryName,
          cityName,
          openStatus,
          matchLabel,
          item.raw_place_data?.selected_option ?? '',
        ].join(' ')
      );

      const matchesSearch = !query || searchableText.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [favorites, searchText, selectedCategoryFilter]);

  const groupedFavorites = useMemo(() => {
    const groups: Record<string, FavoriteItem[]> = {};

    filteredFavorites.forEach((item) => {
      const categoryName = getCategoryArabic(item.category);

      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }

      groups[categoryName].push(item);
    });

    return groups;
  }, [filteredFavorites]);

  useEffect(() => {
    loadFavorites();
  }, []);

  function goBackSafely() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function loadFavorites() {
    setLoading(true);
    setMessage('');
    setIsError(false);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setLoading(false);
      router.replace('/login');
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage(`خطأ في تحميل المفضلة: ${error.message}`);
      return;
    }

    setFavorites((data ?? []) as FavoriteItem[]);
  }

  async function deleteFavorite(item: FavoriteItem) {
    setDeletingId(item.id);
    setMessage('');
    setIsError(false);

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', item.id);

    setDeletingId(null);

    if (error) {
      setIsError(true);
      setMessage(`خطأ في حذف المكان: ${error.message}`);
      return;
    }

    setFavorites((current) => current.filter((favorite) => favorite.id !== item.id));
    setIsError(false);
    setMessage(`تم حذف "${item.place_name}" من المفضلة.`);
  }

  async function openDirections(item: FavoriteItem) {
    if (item.latitude && item.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`;
      await Linking.openURL(url);
      return;
    }

    const encodedQuery = encodeURIComponent(`${item.place_name} ${item.address ?? ''}`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}`;
    await Linking.openURL(url);
  }

  async function openInGoogleMaps(item: FavoriteItem) {
    if (item.latitude && item.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
      await Linking.openURL(url);
      return;
    }

    const encodedQuery = encodeURIComponent(`${item.place_name} ${item.address ?? ''}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    await Linking.openURL(url);
  }

  function openDetails(item: FavoriteItem) {
    const raw = item.raw_place_data ?? {};

    router.push({
      pathname: '/place-details',
      params: {
        id: item.place_id,
        name: item.place_name,
        address: item.address ?? 'لا يوجد عنوان',
        category: item.category ?? '',
        option: raw.selected_option ?? raw.wenbest_option ?? 'أفضل اختيار',
        city: raw.selected_city?.key ?? 'sharjah',
        provider: item.provider ?? 'google',
        latitude: item.latitude ? String(item.latitude) : '',
        longitude: item.longitude ? String(item.longitude) : '',
        distance: raw.distance ? String(raw.distance) : '',
        score: raw.wenbest_score ? String(raw.wenbest_score) : '',
        matchLabel: raw.match_label ?? raw.wenbest_match_label ?? 'مطابقة عامة',
        rating: item.rating !== null ? String(item.rating) : '',
        reviewCount: item.review_count !== null ? String(item.review_count) : '',
        openStatusLabel: raw.open_status ?? 'حالة الدوام غير متوفرة',
        openStatusIcon:
          raw.open_status === 'مفتوح الآن'
            ? '🟢'
            : raw.open_status === 'مغلق الآن'
              ? '🔴'
              : '⚪',
      },
    });
  }

  function clearFilters() {
    setSearchText('');
    setSelectedCategoryFilter('الكل');
  }

  function getScore(item: FavoriteItem) {
    return item.raw_place_data?.wenbest_score ?? null;
  }

  function getCityName(item: FavoriteItem) {
    return item.raw_place_data?.selected_city?.nameAr ?? 'غير محدد';
  }

  function getOpenStatus(item: FavoriteItem) {
    return item.raw_place_data?.open_status ?? 'حالة الدوام غير متوفرة';
  }

  function getMatchLabel(item: FavoriteItem) {
    return item.raw_place_data?.match_label ?? item.raw_place_data?.wenbest_match_label ?? 'مطابقة عامة';
  }

  const hasActiveFilters = searchText.trim().length > 0 || selectedCategoryFilter !== 'الكل';

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

          <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')}>
            <Text style={styles.homeButtonText}>الرئيسية</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>المفضلة</Text>
          <Text style={styles.pageSubtitle}>
            الأماكن التي حفظتها للرجوع إليها لاحقًا.
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillText}>❤️ المفضلة: {favorites.length}</Text>
            </View>

            <View style={styles.summaryPillTeal}>
              <Text style={styles.summaryPillTealText}>📋 النتائج: {filteredFavorites.length}</Text>
            </View>

            <TouchableOpacity style={styles.refreshPill} onPress={loadFavorites}>
              <Text style={styles.refreshPillText}>تحديث</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>ابحث داخل المفضلة</Text>

          <View style={styles.searchBox}>
            <TextInput
              placeholder="اكتب اسم المكان، التصنيف، المدينة..."
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchInput}
              textAlign="right"
            />
            <Text style={styles.searchIcon}>🔍</Text>
          </View>

          <Text style={styles.filterSubtitle}>فلترة حسب التصنيف</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            {categoryFilters.map((categoryName) => {
              const active = selectedCategoryFilter === categoryName;

              return (
                <TouchableOpacity
                  key={categoryName}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedCategoryFilter(categoryName)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {categoryName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {hasActiveFilters ? (
            <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}>
              <Text style={styles.clearFilterButtonText}>مسح البحث والفلاتر</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.navy} />
            <Text style={styles.loadingText}>جاري تحميل المفضلة...</Text>
          </View>
        ) : null}

        {message ? (
          <View style={[styles.messageBox, isError && styles.errorBox]}>
            <Text style={[styles.messageText, isError && styles.errorText]}>
              {message}
            </Text>
          </View>
        ) : null}

        {!loading && favorites.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🤍</Text>
            <Text style={styles.emptyTitle}>لا توجد أماكن محفوظة بعد</Text>
            <Text style={styles.emptyText}>
              ابحث عن مكان ثم اضغط “حفظ في المفضلة” حتى يظهر هنا.
            </Text>

            <TouchableOpacity style={styles.searchButton} onPress={() => router.replace('/')}>
              <Text style={styles.searchButtonText}>الذهاب للبحث</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && favorites.length > 0 && filteredFavorites.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyTitle}>لا توجد نتائج مطابقة</Text>
            <Text style={styles.emptyText}>
              جرّب كلمة أخرى أو امسح الفلتر الحالي لعرض كل المفضلة.
            </Text>

            <TouchableOpacity style={styles.searchButton} onPress={clearFilters}>
              <Text style={styles.searchButtonText}>مسح البحث والفلاتر</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && filteredFavorites.length > 0 ? (
          <View style={styles.groupsContainer}>
            {Object.entries(groupedFavorites).map(([categoryName, items]) => (
              <View key={categoryName} style={styles.groupBox}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{categoryName}</Text>
                  <Text style={styles.groupCount}>{items.length} مكان</Text>
                </View>

                <View style={styles.list}>
                  {items.map((item) => {
                    const score = getScore(item);

                    return (
                      <View key={item.id} style={styles.card}>
                        <View style={styles.cardTopRow}>
                          <View style={styles.heartCircle}>
                            <Text style={styles.heartText}>❤️</Text>
                          </View>

                          <View style={styles.cardTitleBox}>
                            <Text style={styles.cardTitle}>{item.place_name}</Text>
                            <Text style={styles.cardAddress}>
                              {item.address ?? 'لا يوجد عنوان'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>
                              ⭐ {formatValue(item.rating)}
                            </Text>
                          </View>

                          <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>
                              💬 {formatValue(item.review_count)}
                            </Text>
                          </View>

                          <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>
                              📍 {getCityName(item)}
                            </Text>
                          </View>

                          {score ? (
                            <View style={styles.scorePill}>
                              <Text style={styles.scorePillText}>🧠 {score}/100</Text>
                            </View>
                          ) : null}

                          <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>
                              🔎 {getMatchLabel(item)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.actions}>
                          <TouchableOpacity
                            style={styles.primaryAction}
                            onPress={() => openDirections(item)}
                          >
                            <Text style={styles.primaryActionText}>الاتجاهات</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.secondaryAction}
                            onPress={() => openDetails(item)}
                          >
                            <Text style={styles.secondaryActionText}>التفاصيل</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.actions}>
                          <TouchableOpacity
  style={styles.mapAction}
  onPress={() => openInGoogleMaps(item)}
>
  <Text style={styles.mapActionText}>🗺️ عرض على الخريطة</Text>
</TouchableOpacity>

                          <TouchableOpacity
                            style={styles.deleteAction}
                            onPress={() => deleteFavorite(item)}
                            disabled={deletingId === item.id}
                          >
                            <Text style={styles.deleteActionText}>
                              {deletingId === item.id ? 'جاري الحذف...' : 'حذف'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.footerNote}>
          المفضلة مرتبطة بحسابك، ويمكنك الرجوع لها من أي جهاز بعد تسجيل الدخول.
        </Text>
      </ScrollView>
      <BottomNav />
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
  },
  topHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  homeButtonText: {
    color: colors.white,
    fontWeight: '900',
  },
  logoMiniBox: {
    width: 70,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMini: {
    width: 62,
    height: 46,
  },
  pageHeader: {
    backgroundColor: colors.white,
    borderRadius: 26,
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
    marginTop: 6,
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  summaryPill: {
    backgroundColor: '#FFF7E0',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  summaryPillText: {
    color: colors.navy,
    fontWeight: '900',
  },
  summaryPillTeal: {
    backgroundColor: '#E6FFFA',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  summaryPillTealText: {
    color: colors.tealDark,
    fontWeight: '900',
  },
  refreshPill: {
    backgroundColor: colors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refreshPillText: {
    color: colors.navy,
    fontWeight: '900',
  },
  filterCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  filterTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 10,
  },
  searchBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    height: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  searchIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  filterSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingBottom: 2,
  },
  filterChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterChipText: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  clearFilterButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  clearFilterButtonText: {
    color: colors.red,
    fontWeight: '900',
  },
  loadingBox: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 22,
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
  emptyBox: {
    backgroundColor: colors.white,
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 40,
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
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  searchButton: {
    backgroundColor: colors.gold,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 16,
  },
  searchButtonText: {
    color: colors.navy,
    fontWeight: '900',
  },
  groupsContainer: {
    gap: 16,
  },
  groupBox: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
  },
  groupCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
  },
  heartCircle: {
    width: 42,
    height: 42,
    borderRadius: 17,
    backgroundColor: '#FFF7E0',
    borderWidth: 1,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartText: {
    fontSize: 20,
  },
  cardTitleBox: {
    flex: 1,
  },
  cardTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    lineHeight: 25,
  },
  cardAddress: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 21,
    marginTop: 5,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  metaPillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  scorePill: {
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  scorePillText: {
    color: colors.tealDark,
    fontSize: 12,
    fontWeight: '900',
  },
  actions: {
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
    backgroundColor: colors.white,
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
  deleteAction: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionText: {
    color: colors.red,
    fontWeight: '900',
  },
  footerNote: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 18,
  },
});