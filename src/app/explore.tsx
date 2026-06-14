import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { CityKey, getCityByKey } from '../../lib/cities';
import BottomNav from '../components/BottomNav';

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
};

type SmartItem = {
  title: string;
  subtitle: string;
  icon: string;
  category: string;
  option: string;
  query: string;
  city?: CityKey;
  badge?: string;
};

type LastSearch = {
  title?: string;
  query?: string;
  category?: string;
  option?: string;
  city?: CityKey;
  createdAt?: string;
};

const popularItems: SmartItem[] = [
  {
    title: 'مطاعم قريبة',
    subtitle: 'أفضل مطاعم حولك حسب التقييم والمسافة',
    icon: '🍽️',
    category: 'restaurants',
    option: 'أفضل اختيار',
    query: 'مطاعم قريبة',
    badge: 'الأكثر استخدامًا',
  },
  {
    title: 'كافيه للعمل والدراسة',
    subtitle: 'جلسة هادئة، قهوة، ومساحة مناسبة',
    icon: '☕',
    category: 'cafes',
    option: 'مناسب للعمل والدراسة',
    query: 'كوفي للدراسة والعمل',
    badge: 'مفيد يوميًا',
  },
  {
    title: 'كراج سيارات موثوق',
    subtitle: 'ورش وخدمات سيارات حسب التقييم',
    icon: '🔧',
    category: 'garages',
    option: 'أفضل اختيار',
    query: 'كراج سيارات',
  },
  {
    title: 'طبيب أسنان',
    subtitle: 'عيادات أسنان قريبة وذات تقييم جيد',
    icon: '🦷',
    category: 'clinics_hospitals',
    option: 'أسنان',
    query: 'طبيب أسنان',
  },
  {
    title: 'مغسلة سيارات',
    subtitle: 'غسيل وتنظيف سيارات بالقرب منك',
    icon: '🚗',
    category: 'laundries',
    option: 'مغسلة سيارات',
    query: 'مغسلة سيارات',
  },
  {
    title: 'فندق أو شقة فندقية',
    subtitle: 'إقامة قريبة ومناسبة حسب المدينة',
    icon: '🏨',
    category: 'hotels_apartments',
    option: 'فنادق',
    query: 'فندق قريب',
  },
];

const nowItems: SmartItem[] = [
  {
    title: 'مفتوح الآن',
    subtitle: 'ابدأ بنتائج مناسبة للوقت الحالي',
    icon: '🟢',
    category: 'restaurants',
    option: 'أفضل اختيار',
    query: 'مطاعم مفتوحة الآن',
    badge: 'حسب الوقت',
  },
  {
    title: 'الأعلى تقييمًا',
    subtitle: 'أماكن يثق بها المستخدمون أكثر',
    icon: '⭐',
    category: 'restaurants',
    option: 'أعلى تقييم',
    query: 'أفضل مطاعم',
  },
  {
    title: 'الأكثر مراجعات',
    subtitle: 'اختيارات عليها تجارب كثيرة',
    icon: '💬',
    category: 'restaurants',
    option: 'أكثر مراجعات',
    query: 'مطاعم كثيرة المراجعات',
  },
  {
    title: 'مناسب للعائلة',
    subtitle: 'خروج، أكل، أو مكان مريح للعائلة',
    icon: '👨‍👩‍👧‍👦',
    category: 'entertainment_parks',
    option: 'أماكن عائلية',
    query: 'أماكن عائلية',
  },
  {
    title: 'خدمة منزلية سريعة',
    subtitle: 'سباك، كهربائي، تكييف وصيانة',
    icon: '🧰',
    category: 'home_services',
    option: 'صيانة عامة',
    query: 'خدمات منزلية',
  },
  {
    title: 'وكالة سفر وسياحة',
    subtitle: 'تذاكر، تأشيرات، وباقات سياحية',
    icon: '✈️',
    category: 'travel_tourism',
    option: 'أفضل اختيار',
    query: 'وكالة سفر وسياحة',
  },
];

const moodItems: SmartItem[] = [
  {
    title: 'أريد آكل الآن',
    subtitle: 'مطاعم مناسبة وقريبة',
    icon: '😋',
    category: 'restaurants',
    option: 'أفضل اختيار',
    query: 'مطعم قريب',
  },
  {
    title: 'أريد مكان هادئ',
    subtitle: 'كافيهات وجلسات هادئة',
    icon: '🤫',
    category: 'cafes',
    option: 'هادئ',
    query: 'كوفي هادئ',
  },
  {
    title: 'عندي مشكلة في السيارة',
    subtitle: 'كراجات وخدمات سيارات',
    icon: '🚘',
    category: 'garages',
    option: 'صيانة دورية',
    query: 'كراج سيارات',
  },
  {
    title: 'أريد أطلع مع الأسرة',
    subtitle: 'حدائق، ممشى، ومراكز ترفيه',
    icon: '🌳',
    category: 'entertainment_parks',
    option: 'أماكن عائلية',
    query: 'أماكن عائلية',
  },
];

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;

  const [lastSearch, setLastSearch] = useState<LastSearch | null>(null);

  useEffect(() => {
    loadLastSearch();
  }, []);

  async function loadLastSearch() {
    try {
      const value = await AsyncStorage.getItem('wenbest:lastSearch');

      if (!value) {
        setLastSearch(null);
        return;
      }

      const parsed = JSON.parse(value);
      setLastSearch(parsed);
    } catch {
      setLastSearch(null);
    }
  }

  async function saveLastSearch(item: SmartItem) {
    try {
      const payload: LastSearch = {
        title: item.title,
        query: item.query,
        category: item.category,
        option: item.option,
        city: item.city ?? 'sharjah',
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('wenbest:lastSearch', JSON.stringify(payload));
      setLastSearch(payload);
    } catch {
      // لا توقف التطبيق إذا فشل التخزين المحلي
    }
  }

  async function openSmartItem(item: SmartItem) {
    await saveLastSearch(item);

    router.push({
      pathname: '/results',
      params: {
        category: item.category,
        option: item.option,
        query: item.query,
        city: item.city ?? 'sharjah',
      },
    });
  }

  function openLastSearch() {
    if (!lastSearch?.category || !lastSearch?.option) return;

    router.push({
      pathname: '/results',
      params: {
        category: lastSearch.category,
        option: lastSearch.option,
        query: lastSearch.query ?? lastSearch.title ?? '',
        city: lastSearch.city ?? 'sharjah',
      },
    });
  }

  async function clearLastSearch() {
    try {
      await AsyncStorage.removeItem('wenbest:lastSearch');
      setLastSearch(null);
    } catch {
      setLastSearch(null);
    }
  }

  function renderSmartCard(item: SmartItem, compact = false) {
    return (
      <TouchableOpacity
        key={`${item.title}-${item.query}`}
        style={[
          styles.smartCard,
          isMobile && styles.smartCardMobile,
          compact && styles.compactCard,
        ]}
        onPress={() => openSmartItem(item)}
        activeOpacity={0.86}
      >
        <View style={styles.smartIconBox}>
          <Text style={styles.smartIcon}>{item.icon}</Text>
        </View>

        <View style={styles.smartTextBox}>
          <View style={styles.smartTitleRow}>
            {item.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}

            <Text style={styles.smartTitle}>{item.title}</Text>
          </View>

          <Text style={styles.smartSubtitle}>{item.subtitle}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const lastCity = getCityByKey(lastSearch?.city ?? 'sharjah');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          isMobile && styles.containerMobile,
        ]}
      >
        <View style={styles.hero}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" />

          <View style={styles.heroTextBox}>
            <Text style={styles.heroEyebrow}>WenBest Smart Discover</Text>
            <Text style={styles.heroTitle}>استكشف بذكاء</Text>
            <Text style={styles.heroSubtitle}>
              اختيارات جاهزة تساعدك تصل لأفضل مكان بسرعة حسب الحاجة، التقييم، والمدينة.
            </Text>
          </View>
        </View>

        {lastSearch ? (
          <View style={styles.memoryCard}>
            <View style={styles.memoryHeader}>
              <Text style={styles.memoryTitle}>🧠 ذاكرتك الأخيرة</Text>

              <TouchableOpacity onPress={clearLastSearch}>
                <Text style={styles.clearText}>مسح</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.lastSearchButton}
              onPress={openLastSearch}
              activeOpacity={0.85}
            >
              <View style={styles.lastSearchTextBox}>
                <Text style={styles.lastSearchTitle}>
                  {lastSearch.title || lastSearch.query || 'آخر بحث'}
                </Text>
                <Text style={styles.lastSearchSubtitle}>
                  {lastSearch.query || 'بحث سابق'} • {lastCity.nameAr}
                </Text>
              </View>

              <Text style={styles.lastSearchIcon}>↗</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.memoryCard}>
            <Text style={styles.memoryTitle}>🧠 ذاكرتك ستظهر هنا</Text>
            <Text style={styles.memoryEmptyText}>
              بعد أول بحث من هذه الصفحة سيظهر لك آخر اختيار لتعود إليه بسرعة.
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>الأكثر استخدامًا</Text>
          <Text style={styles.sectionHint}>اختيارات عملية يومية</Text>
        </View>

        <View style={styles.grid}>
          {popularItems.map((item) => renderSmartCard(item))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ماذا تحتاج الآن؟</Text>
          <Text style={styles.sectionHint}>بحث حسب الموقف</Text>
        </View>

        <View style={styles.grid}>
          {nowItems.map((item) => renderSmartCard(item))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>اختيار حسب المزاج</Text>
          <Text style={styles.sectionHint}>تجربة مختلفة وسريعة</Text>
        </View>

        <View style={styles.moodGrid}>
          {moodItems.map((item) => renderSmartCard(item, true))}
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerTitle}>✨ لماذا هذه الصفحة مختلفة؟</Text>
          <Text style={styles.footerText}>
            بدل تصفح التصنيفات فقط، هذه الصفحة تجمع أكثر الاحتياجات اليومية وتحوّلها مباشرة إلى بحث ذكي داخل WenBest.
          </Text>
        </View>
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
    paddingBottom: 125,
    maxWidth: 1150,
    width: '100%',
    alignSelf: 'center',
  },
  containerMobile: {
    padding: 14,
    paddingBottom: 125,
  },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: 30,
    padding: 22,
    marginBottom: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 18,
  },
  logo: {
    width: 120,
    height: 90,
  },
  heroTextBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  heroEyebrow: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 5,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'right',
  },
  heroSubtitle: {
    color: '#D9F7F4',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 8,
  },
  memoryCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  memoryHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  memoryTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  clearText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  memoryEmptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    fontWeight: '700',
    marginTop: 6,
  },
  lastSearchButton: {
    backgroundColor: '#E6FFFA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#99F6E4',
    padding: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastSearchTextBox: {
    flex: 1,
  },
  lastSearchTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  lastSearchSubtitle: {
    color: colors.tealDark,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 4,
  },
  lastSearchIcon: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '900',
    marginRight: 12,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'right',
  },
  sectionHint: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  moodGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  smartCard: {
    width: '48.9%',
    minHeight: 128,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  smartCardMobile: {
    width: '100%',
  },
  compactCard: {
    minHeight: 108,
  },
  smartIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#EEF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartIcon: {
    fontSize: 29,
  },
  smartTextBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  smartTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  smartTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  smartSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  badge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '900',
  },
  footerNote: {
    backgroundColor: colors.navy,
    borderRadius: 24,
    padding: 18,
  },
  footerTitle: {
    color: colors.gold,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 6,
  },
  footerText: {
    color: '#D9F7F4',
    fontSize: 14,
    lineHeight: 23,
    fontWeight: '700',
    textAlign: 'right',
  },
});