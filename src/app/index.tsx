import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { cities, CityKey, getCityByKey } from '../../lib/cities';
import { supabase } from '../../lib/supabase';

const logoImage = require('../../assets/images/wenbest-logo.png');
const cityWatermarkImage = require('../../assets/images/city-watermark.png');

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
  red: '#991B1B',
};

const categories = [
  {
    title: 'مطاعم',
    subtitle: 'أفضل المطاعم حولك',
    icon: '🍽️',
    category: 'restaurants',
  },
  {
    title: 'كافيهات',
    subtitle: 'جلسات وقهوة ومذاق',
    icon: '☕',
    category: 'cafes',
  },
  {
    title: 'كراجات سيارات',
    subtitle: 'حسب الماركة والخدمة',
    icon: '🔧',
    category: 'garages',
  },
  {
    title: 'عيادات ومستشفيات',
    subtitle: 'حسب التخصص والمنطقة',
    icon: '🏥',
    category: 'clinics_hospitals',
  },
  {
    title: 'ترفيه ومنتزهات',
    subtitle: 'أماكن عائلية وخروج',
    icon: '🌳',
    category: 'entertainment_parks',
  },
  {
    title: 'صالونات وحلاقة',
    subtitle: 'حلاقة، تجميل وعناية',
    icon: '💈',
    category: 'salons_barbers',
  },
  {
    title: 'خدمات منزلية',
    subtitle: 'سباك، كهربائي وصيانة',
    icon: '🧰',
    category: 'home_services',
  },
  {
    title: 'مغاسل',
    subtitle: 'ملابس، سجاد وسيارات',
    icon: '🧺',
    category: 'laundries',
  },
  {
    title: 'وكالات السفر والسياحة',
    subtitle: 'رحلات، تأشيرات وباقات سياحية',
    icon: '✈️',
    category: 'travel_tourism',
  },
  {
    title: 'فنادق وشقق فندقية',
    subtitle: 'إقامة وسكن مؤقت',
    icon: '🏨',
    category: 'hotels_apartments',
  },
];

const quickFilters = [
  {
    label: 'ترشيح WenBest',
    icon: '🏆',
  },
  {
    label: 'الأقرب لي',
    icon: '📍',
  },
  {
    label: 'أعلى تقييم',
    icon: '⭐',
  },
  {
    label: 'أكثر مراجعات',
    icon: '💬',
  },
];

type UserInfo = {
  id: string;
  email: string | null;
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

function detectSearchIntent(text: string) {
  const query = normalizeText(text);

  if (!query) {
    return {
      category: 'restaurants',
      option: 'أفضل اختيار',
    };
  }

  const rules: Array<{
    keywords: string[];
    category: string;
    option: string;
  }> = [
    { keywords: ['سوداني', 'sudanese', 'sudan'], category: 'restaurants', option: 'سوداني' },
    { keywords: ['هندي', 'indian'], category: 'restaurants', option: 'هندي' },
    { keywords: ['عربي', 'arabic'], category: 'restaurants', option: 'عربي' },
    { keywords: ['باكستاني', 'pakistani'], category: 'restaurants', option: 'باكستاني' },
    { keywords: ['صيني', 'chinese'], category: 'restaurants', option: 'صيني' },
    { keywords: ['تركي', 'turkish'], category: 'restaurants', option: 'تركي' },
    { keywords: ['ايراني', 'إيراني', 'persian', 'iranian'], category: 'restaurants', option: 'إيراني' },
    { keywords: ['مصري', 'egyptian'], category: 'restaurants', option: 'مصري' },
    { keywords: ['شاورما', 'shawarma'], category: 'restaurants', option: 'شاورما' },
    { keywords: ['برجر', 'burger'], category: 'restaurants', option: 'برجر' },
    { keywords: ['مندي', 'mandi'], category: 'restaurants', option: 'مندي' },
    { keywords: ['بحري', 'seafood', 'سمك'], category: 'restaurants', option: 'بحري' },
    { keywords: ['مشاوي', 'grill', 'bbq'], category: 'restaurants', option: 'مشاوي' },
    { keywords: ['نباتي', 'vegetarian', 'vegan'], category: 'restaurants', option: 'نباتي' },

    { keywords: ['kfc', 'كنتاكي'], category: 'restaurants', option: 'KFC' },
    {
      keywords: ['mcdonald', 'mcdonalds', "mcdonald's", 'ماكدونالدز', 'ماكدونالد', 'ماك'],
      category: 'restaurants',
      option: "McDonald's",
    },
    {
      keywords: ['burger king', 'برجر كنج', 'بيرجر كنج'],
      category: 'restaurants',
      option: 'Burger King',
    },
    {
      keywords: ['pizza hut', 'بيتزا هت'],
      category: 'restaurants',
      option: 'Pizza Hut',
    },
    {
      keywords: ['dominos', "domino's", 'دومينوز', 'دومينوز بيتزا'],
      category: 'restaurants',
      option: "Domino's Pizza",
    },
    {
      keywords: ['hardees', "hardee's", 'هارديز'],
      category: 'restaurants',
      option: "Hardee's",
    },
    {
      keywords: ['texas chicken', 'تكساس تشيكن'],
      category: 'restaurants',
      option: 'Texas Chicken',
    },
    {
      keywords: ['popeyes', 'بوبايز'],
      category: 'restaurants',
      option: 'Popeyes',
    },
    {
      keywords: ['subway', 'صب واي', 'صبواي'],
      category: 'restaurants',
      option: 'Subway',
    },
    {
      keywords: ['jollibee', 'جوليبي'],
      category: 'restaurants',
      option: 'Jollibee',
    },
    {
      keywords: ['starbucks', 'ستاربكس'],
      category: 'restaurants',
      option: 'Starbucks',
    },
    {
      keywords: ['tim hortons', 'تيم هورتنز', 'تيم هورتونز'],
      category: 'restaurants',
      option: 'Tim Hortons',
    },

    { keywords: ['مطعم', 'مطاعم', 'restaurant'], category: 'restaurants', option: 'أفضل اختيار' },

    { keywords: ['دراسة', 'study', 'لابتوب', 'laptop', 'عمل', 'work'], category: 'cafes', option: 'مناسب للعمل والدراسة' },
    { keywords: ['هادئ', 'quiet'], category: 'cafes', option: 'هادئ' },
    { keywords: ['خارجية', 'outdoor', 'جلسات'], category: 'cafes', option: 'جلسات خارجية' },
    { keywords: ['عائلات', 'family'], category: 'cafes', option: 'مناسب للعائلات' },
    { keywords: ['تصوير', 'instagram', 'photo'], category: 'cafes', option: 'مناسب للتصوير' },
    { keywords: ['كافيه', 'كوفي', 'قهوة', 'cafe', 'coffee'], category: 'cafes', option: 'أفضل اختيار' },

    { keywords: ['toyota', 'تويوتا'], category: 'garages', option: 'Toyota' },
    { keywords: ['lexus', 'لكزس'], category: 'garages', option: 'Lexus' },
    { keywords: ['nissan', 'نيسان'], category: 'garages', option: 'Nissan' },
    { keywords: ['infiniti', 'انفينيتي', 'إنفينيتي'], category: 'garages', option: 'Infiniti' },
    { keywords: ['gmc', 'جي ام سي'], category: 'garages', option: 'GMC' },
    { keywords: ['chevrolet', 'شفروليه', 'شيفروليه'], category: 'garages', option: 'Chevrolet' },
    { keywords: ['ford', 'فورد'], category: 'garages', option: 'Ford' },
    { keywords: ['bmw', 'بي ام', 'بي إم'], category: 'garages', option: 'BMW' },
    { keywords: ['mercedes', 'مرسيدس'], category: 'garages', option: 'Mercedes' },
    { keywords: ['audi', 'اودي', 'أودي'], category: 'garages', option: 'Audi' },
    { keywords: ['mazda', 'مازدا'], category: 'garages', option: 'Mazda' },
    { keywords: ['honda', 'هوندا'], category: 'garages', option: 'Honda' },
    { keywords: ['hyundai', 'هيونداي'], category: 'garages', option: 'Hyundai' },
    { keywords: ['kia', 'كيا'], category: 'garages', option: 'Kia' },

    { keywords: ['كمبيوتر', 'computer', 'diagnostic', 'obd'], category: 'garages', option: 'فحص كمبيوتر' },
    { keywords: ['فحص شامل'], category: 'garages', option: 'فحص شامل' },
    { keywords: ['قبل الشراء'], category: 'garages', option: 'فحص قبل الشراء' },
    { keywords: ['صيانة', 'maintenance', 'service'], category: 'garages', option: 'صيانة دورية' },
    { keywords: ['زيت', 'زيوت', 'oil'], category: 'garages', option: 'تبديل زيوت' },
    { keywords: ['قير', 'جير', 'transmission'], category: 'garages', option: 'قير / جير' },
    { keywords: ['مكينة', 'engine'], category: 'garages', option: 'مكينة' },
    { keywords: ['كهرباء', 'electrical'], category: 'garages', option: 'كهرباء سيارات' },
    { keywords: ['مكيف', 'ac', 'air conditioning'], category: 'garages', option: 'مكيفات سيارات' },
    { keywords: ['بطارية', 'battery'], category: 'garages', option: 'بطارية' },
    { keywords: ['اطارات', 'إطارات', 'tyre', 'tire'], category: 'garages', option: 'إطارات' },
    { keywords: ['كراج', 'garage', 'ورشة', 'workshop'], category: 'garages', option: 'أفضل اختيار' },

    { keywords: ['أسنان', 'اسنان', 'dentist', 'dental'], category: 'clinics_hospitals', option: 'أسنان' },
    { keywords: ['عيون', 'eye', 'ophthalmology'], category: 'clinics_hospitals', option: 'عيون' },
    { keywords: ['أطفال', 'اطفال', 'pediatric'], category: 'clinics_hospitals', option: 'أطفال' },
    { keywords: ['جلدية', 'derma', 'dermatology'], category: 'clinics_hospitals', option: 'جلدية' },
    { keywords: ['عظام', 'ortho', 'orthopedic'], category: 'clinics_hospitals', option: 'عظام' },
    { keywords: ['مختبر', 'lab', 'laboratory'], category: 'clinics_hospitals', option: 'مختبر' },
    { keywords: ['طوارئ', 'emergency'], category: 'clinics_hospitals', option: 'طوارئ' },
    { keywords: ['مستشفى', 'hospital'], category: 'clinics_hospitals', option: 'مستشفى' },
    { keywords: ['عيادة', 'clinic'], category: 'clinics_hospitals', option: 'عيادة عامة' },

    { keywords: ['شاطئ', 'شواطئ', 'beach'], category: 'entertainment_parks', option: 'شواطئ' },
    { keywords: ['مول', 'mall'], category: 'entertainment_parks', option: 'مولات' },
    { keywords: ['سينما', 'cinema', 'movie'], category: 'entertainment_parks', option: 'سينما' },
    { keywords: ['ألعاب', 'العاب', 'kids', 'playground'], category: 'entertainment_parks', option: 'ألعاب أطفال' },
    { keywords: ['ممشى', 'walk', 'promenade', 'corniche'], category: 'entertainment_parks', option: 'ممشى' },
    { keywords: ['حديقة', 'حدائق', 'منتزه', 'park'], category: 'entertainment_parks', option: 'حدائق ومنتزهات' },
    { keywords: ['ترفيه', 'entertainment'], category: 'entertainment_parks', option: 'أفضل اختيار' },

    { keywords: ['حلاق', 'barber'], category: 'salons_barbers', option: 'حلاق رجالي' },
    { keywords: ['صالون نسائي', 'ladies salon', 'women salon'], category: 'salons_barbers', option: 'صالون نسائي' },
    { keywords: ['صالون', 'salon'], category: 'salons_barbers', option: 'أفضل اختيار' },
    { keywords: ['تجميل', 'beauty'], category: 'salons_barbers', option: 'تجميل' },
    { keywords: ['اظافر', 'أظافر', 'nails'], category: 'salons_barbers', option: 'أظافر' },
    { keywords: ['مساج', 'massage', 'spa'], category: 'salons_barbers', option: 'مساج' },
    { keywords: ['حمام مغربي', 'moroccan bath'], category: 'salons_barbers', option: 'حمام مغربي' },
    { keywords: ['بشرة', 'skin care', 'facial'], category: 'salons_barbers', option: 'عناية بالبشرة' },

    { keywords: ['سباك', 'plumber', 'plumbing'], category: 'home_services', option: 'سباك' },
    { keywords: ['كهربائي', 'electrician'], category: 'home_services', option: 'كهربائي' },
    { keywords: ['مكيفات', 'تكييف', 'ac repair', 'air conditioning'], category: 'home_services', option: 'مكيفات' },
    { keywords: ['تنظيف منازل', 'cleaning', 'house cleaning'], category: 'home_services', option: 'تنظيف منازل' },
    { keywords: ['حشرات', 'pest control'], category: 'home_services', option: 'مكافحة حشرات' },
    { keywords: ['نقل اثاث', 'نقل أثاث', 'moving'], category: 'home_services', option: 'نقل أثاث' },
    { keywords: ['صيانة عامة', 'handyman'], category: 'home_services', option: 'صيانة عامة' },

    { keywords: ['مغسلة ملابس', 'laundry'], category: 'laundries', option: 'مغسلة ملابس' },
    { keywords: ['تنظيف جاف', 'dry clean', 'dry cleaning'], category: 'laundries', option: 'تنظيف جاف' },
    { keywords: ['كوي', 'ironing'], category: 'laundries', option: 'كوي' },
    { keywords: ['سجاد', 'carpet cleaning'], category: 'laundries', option: 'مغسلة سجاد' },
    { keywords: ['مغسلة سيارات', 'car wash'], category: 'laundries', option: 'مغسلة سيارات' },
    { keywords: ['مغسلة', 'laundries'], category: 'laundries', option: 'أفضل اختيار' },


    { keywords: ['وكالة سفر', 'وكالات سفر', 'سفر', 'سياحة', 'travel agency', 'tourism agency'], category: 'travel_tourism', option: 'أفضل اختيار' },
    { keywords: ['طيران', 'تذاكر', 'flight', 'air ticket'], category: 'travel_tourism', option: 'حجوزات طيران' },
    { keywords: ['باقات سياحية', 'باقة سياحية', 'tour package', 'holiday package'], category: 'travel_tourism', option: 'باقات سياحية' },
    { keywords: ['سياحة داخل الامارات', 'سياحة داخل الإمارات', 'uae tour', 'local tour'], category: 'travel_tourism', option: 'سياحة داخل الإمارات' },
    { keywords: ['سياحة خارجية', 'رحلات خارجية', 'international tour'], category: 'travel_tourism', option: 'سياحة خارجية' },
    { keywords: ['تأشيرة', 'تاشيرة', 'فيزا', 'visa'], category: 'travel_tourism', option: 'تأشيرات سفر' },
    { keywords: ['عمرة', 'umrah'], category: 'travel_tourism', option: 'عمرة' },
    { keywords: ['كروز', 'رحلة بحرية', 'رحلات بحرية', 'cruise'], category: 'travel_tourism', option: 'رحلات بحرية' },
    { keywords: ['تأجير سيارات للسفر', 'تاجير سيارات للسفر', 'rent a car travel'], category: 'travel_tourism', option: 'تأجير سيارات للسفر' },

    { keywords: ['فندق', 'فنادق', 'hotel', 'hotels'], category: 'hotels_apartments', option: 'فنادق' },
    { keywords: ['شقق فندقية', 'hotel apartment', 'hotel apartments', 'aparthotel'], category: 'hotels_apartments', option: 'شقق فندقية' },
    { keywords: ['رخيص', 'cheap', 'budget'], category: 'hotels_apartments', option: 'رخيص' },
    { keywords: ['فاخر', 'luxury'], category: 'hotels_apartments', option: 'فاخر' },
    { keywords: ['مناسب للعائلات', 'family hotel'], category: 'hotels_apartments', option: 'مناسب للعائلات' },
    { keywords: ['قريب من البحر', 'near beach', 'beach hotel'], category: 'hotels_apartments', option: 'قريب من البحر' },
    { keywords: ['قريب من المطار', 'near airport', 'airport hotel'], category: 'hotels_apartments', option: 'قريب من المطار' },
  ];

  const found = rules.find((rule) =>
    rule.keywords.some((keyword) => query.includes(normalizeText(keyword)))
  );

  return found
    ? { category: found.category, option: found.option }
    : { category: 'restaurants', option: text.trim() || 'أفضل اختيار' };
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 700;
  const isSmallMobile = width < 390;
  const isTablet = width >= 700 && width < 1024;

  const categoryCardWidth = isMobile ? '48%' : isTablet ? '48%' : '32%';
  const quickCardWidth = isMobile ? '48%' : isTablet ? '48%' : '24%';

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedCityKey, setSelectedCityKey] = useState<CityKey>('sharjah');
  const [searchText, setSearchText] = useState('');

  const selectedCity = getCityByKey(selectedCityKey);

  useEffect(() => {
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? null,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email ?? null,
      });
    } else {
      setUser(null);
    }

    setLoadingUser(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  function goToLogin() {
    router.push('/login');
  }

  function goToFavorites() {
    router.push('/favorites');
  }

  function goToCategory(category: string) {
    router.push({
      pathname: '/category',
      params: {
        category,
        city: selectedCityKey,
      },
    });
  }

  function runSearch() {
    const text = searchText.trim();

    if (!text) {
      router.push({
        pathname: '/category',
        params: {
          category: 'restaurants',
          city: selectedCityKey,
        },
      });
      return;
    }

    const intent = detectSearchIntent(text);

    router.push({
      pathname: '/results',
      params: {
        category: intent.category,
        option: intent.option,
        query: text,
        city: selectedCityKey,
      },
    });
  }

  function runQuickFilter(filter: string) {
    router.push({
      pathname: '/results',
      params: {
        category: 'restaurants',
        option: filter,
        city: selectedCityKey,
      },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.favoriteTopButton} onPress={goToFavorites}>
            <Text style={styles.favoriteTopButtonText}>❤️</Text>
          </TouchableOpacity>

          <View style={styles.cityPill}>
            <Text style={styles.cityPillText}>📍 {selectedCity.nameAr}</Text>
          </View>
        </View>

        <ImageBackground
          source={cityWatermarkImage}
          style={[styles.heroCard, isMobile && styles.heroCardMobile]}
          imageStyle={styles.heroBackgroundImage}
          resizeMode="cover"
        >
          <View style={[styles.heroOverlay, isMobile && styles.heroOverlayMobile]}>
            <Image
              source={logoImage}
              style={[styles.logoImage, isMobile && styles.logoImageMobile]}
              resizeMode="contain"
            />

            <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
              وين الأفضل حولك؟
            </Text>

            <Text style={[styles.heroTagline, isMobile && styles.heroTaglineMobile]}>
              دليلك الذكي لاختيار الأفضل في مدينتك
            </Text>

            <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
              ابحث عن أفضل مطعم، كافيه، كراج، عيادة، صالون، خدمة منزلية، وكالة سفر أو فندق حسب المدينة والتقييم والمسافة.
            </Text>
          </View>
        </ImageBackground>

        <View style={[styles.searchPanel, isMobile && styles.searchPanelMobile]}>
          <Text style={styles.searchLabel}>اكتب ما تبحث عنه</Text>

          <View style={styles.searchBox}>
            <TextInput
              placeholder="مثال: كنتاكي، مطعم سوداني، كراج إنفينيتي..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={runSearch}
              returnKeyType="search"
              textAlign="right"
            />
            <Text style={styles.searchIcon}>🔍</Text>
          </View>

          <TouchableOpacity style={styles.primarySearchButton} onPress={runSearch}>
            <Text style={styles.primarySearchButtonText}>ابحث عن الأفضل</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smartPickButton}
            onPress={() => goToCategory('restaurants')}
          >
            <Text style={styles.smartPickButtonText}>⭐ اختر لي الأفضل تلقائيًا</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cityBox}>
          <Text style={styles.cityTitle}>
  اختر المدينة التي ترغب في الحصول على افضل مكان فيها ↔
</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cityList}
          >
            {cities.map((city) => {
              const active = city.key === selectedCityKey;

              return (
                <TouchableOpacity
                  key={city.key}
                  style={[styles.cityChip, active && styles.cityChipActive]}
                  onPress={() => setSelectedCityKey(city.key)}
                >
                  <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>
                    {city.nameAr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loadingUser ? (
          <View style={styles.accountBox}>
            <Text style={styles.accountText}>جاري التحقق من الحساب...</Text>
          </View>
        ) : user ? (
          <View style={[styles.accountBox, isMobile && styles.accountBoxMobile]}>
            <View style={styles.accountTextBox}>
              <Text style={styles.accountTitle}>مرحبًا بك</Text>
              <Text style={styles.accountText}>{user.email}</Text>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
              <Text style={styles.logoutButtonText}>خروج</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.loginCard} onPress={goToLogin}>
            <Text style={styles.loginCardTitle}>سجّل دخولك</Text>
            <Text style={styles.loginCardText}>لحفظ الأماكن المفضلة والرجوع لها لاحقًا</Text>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>
            التصنيفات الرئيسية
          </Text>
          <Text style={styles.sectionHint}>اختر نوع المكان</Text>
        </View>

        <View style={styles.categoryGrid}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.categoryCard,
                {
                  width: categoryCardWidth,
                  minHeight: isSmallMobile ? 190 : 175,
                },
              ]}
              onPress={() => goToCategory(item.category)}
            >
              <View style={styles.categoryIconCircle}>
                <Text style={styles.categoryIcon}>{item.icon}</Text>
              </View>

              <Text style={[styles.categoryTitle, isSmallMobile && styles.categoryTitleSmall]}>
                {item.title}
              </Text>
              <Text style={styles.categorySubtitle}>{item.subtitle}</Text>

              <View style={styles.categoryFooter}>
                <Text style={styles.categoryFooterText}>
                  الأفضل في {selectedCity.nameAr}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>
            اختصارات ذكية
          </Text>
          <Text style={styles.sectionHint}>فلترة أسرع</Text>
        </View>

        <View style={styles.quickGrid}>
          {quickFilters.map((filter) => (
            <TouchableOpacity
              key={filter.label}
              style={[styles.quickCard, { width: quickCardWidth }]}
              onPress={() => runQuickFilter(filter.label)}
            >
              <Text style={styles.quickIcon}>{filter.icon}</Text>
              <Text style={styles.quickText}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>✨ اكتشف أفضل الأماكن بسهوله وبثقة</Text>
          <Text style={styles.infoText}>
            يعتمد ترشيح WenBest على التقييمات والمراجعات والمسافة ومدى مطابقة المكان لبحثك لمساعدتك على اختيار المكان الأنسب بسهولة.
          </Text>
        </View>

        <TouchableOpacity
  style={styles.contactButton}
  onPress={() => router.push('/contact')}
>
  <Text style={styles.contactButtonText}>
    💬 لديك اقتراح أو ملاحظة؟ نرحب بمشاركتك لتطوير WenBest
  </Text>
</TouchableOpacity>

      </ScrollView>
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
  topBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cityPill: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cityPillText: {
    color: colors.navy,
    fontWeight: '900',
  },
  favoriteTopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteTopButtonText: {
    fontSize: 18,
  },

  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    minHeight: 360,
  },
  heroCardMobile: {
    minHeight: 320,
    borderRadius: 28,
  },
  heroBackgroundImage: {
    opacity: 0.78,
  },
  heroOverlay: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.46)',
  },
  heroOverlayMobile: {
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  logoImage: {
    width: 185,
    height: 135,
    marginBottom: 2,
  },
  logoImageMobile: {
    width: 155,
    height: 110,
  },
  heroTitle: {
    color: colors.navy,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },
  heroTitleMobile: {
    fontSize: 26,
  },
  heroTagline: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(6, 33, 74, 0.16)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroTaglineMobile: {
    fontSize: 18,
    lineHeight: 27,
  },
  heroSubtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 760,
    fontWeight: '700',
  },
  heroSubtitleMobile: {
    fontSize: 13,
    lineHeight: 22,
  },

  searchPanel: {
    backgroundColor: colors.navy,
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
  },
  searchPanelMobile: {
    borderRadius: 24,
    padding: 14,
  },
  searchLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 10,
  },
  searchBox: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  searchIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  primarySearchButton: {
    backgroundColor: colors.gold,
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  primarySearchButtonText: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '900',
  },
  smartPickButton: {
    backgroundColor: colors.white,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smartPickButtonText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
  },
  cityBox: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cityTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 10,
  },
  cityList: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingBottom: 2,
  },
  cityChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  cityChipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  cityChipText: {
    color: colors.navy,
    fontWeight: '900',
  },
  cityChipTextActive: {
    color: colors.white,
  },
  accountBox: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  accountBoxMobile: {
    alignItems: 'center',
  },
  accountTextBox: {
    flex: 1,
  },
  accountTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  accountText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'right',
    marginTop: 3,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  logoutButtonText: {
    color: colors.red,
    fontWeight: '900',
  },
  loginCard: {
    backgroundColor: '#E6FFFA',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginBottom: 16,
  },
  loginCardTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  loginCardText: {
    color: colors.tealDark,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'right',
  },
  sectionTitleMobile: {
    fontSize: 23,
  },
  sectionHint: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  categoryGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-end',
  },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#EEF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  categoryIcon: {
    fontSize: 29,
  },
  categoryTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 4,
    lineHeight: 24,
  },
  categoryTitleSmall: {
    fontSize: 16,
    lineHeight: 23,
  },
  categorySubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
    fontWeight: '700',
  },
  categoryFooter: {
    marginTop: 'auto',
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 9,
    alignSelf: 'flex-end',
  },
  categoryFooterText: {
    color: colors.tealDark,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  quickGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
    justifyContent: 'space-between',
  },
  quickCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 13,
    paddingHorizontal: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    minHeight: 62,
  },
  quickIcon: {
    fontSize: 18,
  },
  quickText: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 14,
    flexShrink: 1,
    textAlign: 'right',
  },
  infoBox: {
    backgroundColor: colors.navy,
    borderRadius: 24,
    padding: 18,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.gold,
    textAlign: 'right',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#D9F7F4',
    lineHeight: 22,
    textAlign: 'right',
  },
  contactButton: {
  backgroundColor: '#06214A',
  paddingVertical: 16,
  paddingHorizontal: 18,
  borderRadius: 18,
  alignItems: 'center',
  marginTop: 20,
  marginBottom: 30,
},
contactButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '900',
},
});