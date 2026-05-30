import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
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

import { getCityByKey } from '../../lib/cities';

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

type OptionItem = {
  title: string;
  subtitle: string;
  option: string;
  icon: string;
  badge?: string;
  featured?: boolean;
};

type OptionSection = {
  title: string;
  subtitle?: string;
  options: OptionItem[];
};

type CategoryData = {
  title: string;
  subtitle: string;
  icon: string;
  sections: OptionSection[];
};

const internationalRestaurantChainsSection: OptionSection = {
  title: 'مطاعم عالمية وسلاسل شهيرة',
  subtitle: 'اختر السلسلة التي تريد البحث عنها',
  options: [
    { title: 'KFC', subtitle: 'كنتاكي', option: 'KFC', icon: 'K', badge: 'سلسلة عالمية' },
    { title: "McDonald's", subtitle: 'ماكدونالدز', option: "McDonald's", icon: 'M', badge: 'سلسلة عالمية' },
    { title: 'Burger King', subtitle: 'برجر كنج', option: 'Burger King', icon: 'B', badge: 'سلسلة عالمية' },
    { title: 'Pizza Hut', subtitle: 'بيتزا هت', option: 'Pizza Hut', icon: 'P', badge: 'بيتزا' },
    { title: "Domino's Pizza", subtitle: 'دومينوز بيتزا', option: "Domino's Pizza", icon: 'D', badge: 'بيتزا' },
    { title: "Hardee's", subtitle: 'هارديز', option: "Hardee's", icon: 'H', badge: 'برجر' },
    { title: 'Texas Chicken', subtitle: 'تكساس تشيكن', option: 'Texas Chicken', icon: 'T', badge: 'دجاج' },
    { title: 'Popeyes', subtitle: 'بوبايز', option: 'Popeyes', icon: 'P', badge: 'دجاج' },
    { title: 'Subway', subtitle: 'صب واي', option: 'Subway', icon: 'S', badge: 'ساندويتش' },
    { title: 'Jollibee', subtitle: 'جوليبي', option: 'Jollibee', icon: 'J', badge: 'سلسلة عالمية' },
    { title: 'Starbucks', subtitle: 'ستاربكس', option: 'Starbucks', icon: 'S', badge: 'قهوة' },
    { title: 'Tim Hortons', subtitle: 'تيم هورتنز', option: 'Tim Hortons', icon: 'T', badge: 'قهوة' },
  ],
};

const categoryData: Record<string, CategoryData> = {
  restaurants: {
    title: 'مطاعم',
    subtitle: 'اختر نوع المطعم الذي تبحث عنه',
    icon: '🍽️',
    sections: [
      {
        title: 'أنواع المطاعم',
        options: [
          {
            title: 'أفضل اختيار',
            subtitle: 'الأفضل حسب WenBest',
            option: 'أفضل اختيار',
            icon: '⭐',
            featured: true,
          },
          { title: 'عربي', subtitle: 'مطاعم عربية', option: 'عربي', icon: '🍛' },
          { title: 'سوداني', subtitle: 'مطاعم سودانية', option: 'سوداني', icon: '🇸🇩' },
          { title: 'هندي', subtitle: 'مطاعم هندية', option: 'هندي', icon: '🍚' },
          { title: 'باكستاني', subtitle: 'مطاعم باكستانية', option: 'باكستاني', icon: '🍲' },
          { title: 'صيني', subtitle: 'مطاعم صينية', option: 'صيني', icon: '🥢' },
          { title: 'تركي', subtitle: 'مطاعم تركية', option: 'تركي', icon: '🥙' },
          { title: 'إيراني', subtitle: 'مطاعم إيرانية', option: 'إيراني', icon: '🍢' },
          { title: 'مصري', subtitle: 'مطاعم مصرية', option: 'مصري', icon: '🥘' },
          { title: 'شاورما', subtitle: 'أفضل الشاورما', option: 'شاورما', icon: '🌯' },
          { title: 'برجر', subtitle: 'مطاعم برجر', option: 'برجر', icon: '🍔' },
          { title: 'مندي', subtitle: 'مندي ومظبي', option: 'مندي', icon: '🍗' },
          { title: 'بحري', subtitle: 'أسماك ومأكولات بحرية', option: 'بحري', icon: '🐟' },
          { title: 'مشاوي', subtitle: 'مشاوي وكباب', option: 'مشاوي', icon: '🔥' },
          { title: 'نباتي', subtitle: 'خيارات نباتية', option: 'نباتي', icon: '🥗' },
          {
            title: 'مطاعم عالمية وسلاسل شهيرة',
            subtitle: 'KFC، ماكدونالدز، برجر كنج وغيرها',
            option: '__international_chains__',
            icon: '🌍',
            badge: 'سلاسل شهيرة',
          },
        ],
      },
    ],
  },

  cafes: {
    title: 'كافيهات',
    subtitle: 'اختر نوع الكافيه المناسب لك',
    icon: '☕',
    sections: [
      {
        title: 'أنواع الكافيهات',
        options: [
          {
            title: 'أفضل اختيار',
            subtitle: 'الأفضل حسب WenBest',
            option: 'أفضل اختيار',
            icon: '⭐',
            featured: true,
          },
          { title: 'هادئ', subtitle: 'جلسة هادئة', option: 'هادئ', icon: '🌿' },
          {
            title: 'للعمل والدراسة',
            subtitle: 'لابتوب ومذاكرة',
            option: 'مناسب للعمل والدراسة',
            icon: '💻',
          },
          {
            title: 'جلسات خارجية',
            subtitle: 'هواء وجلسات مفتوحة',
            option: 'جلسات خارجية',
            icon: '🌤️',
          },
          {
            title: 'مناسب للعائلات',
            subtitle: 'جلسات عائلية',
            option: 'مناسب للعائلات',
            icon: '👨‍👩‍👧',
          },
          {
            title: 'مناسب للتصوير',
            subtitle: 'ديكور وصور',
            option: 'مناسب للتصوير',
            icon: '📸',
          },
        ],
      },
    ],
  },

  garages: {
    title: 'كراجات سيارات',
    subtitle: 'اختر بلد السيارة ثم الماركة أو الخدمة',
    icon: '🔧',
    sections: [
      {
        title: 'أفضل اختيار',
        subtitle: 'ترتيب عام حسب WenBest',
        options: [
          {
            title: 'أفضل اختيار',
            subtitle: 'أفضل كراجات السيارات',
            option: 'أفضل اختيار',
            icon: '⭐',
            featured: true,
          },
        ],
      },
      {
        title: 'ياباني',
        subtitle: 'ماركات يابانية',
        options: [
          { title: 'Toyota', subtitle: 'تويوتا', option: 'Toyota', icon: 'T', badge: 'ياباني' },
          { title: 'Lexus', subtitle: 'لكزس', option: 'Lexus', icon: 'L', badge: 'ياباني' },
          { title: 'Nissan', subtitle: 'نيسان', option: 'Nissan', icon: 'N', badge: 'ياباني' },
          { title: 'Infiniti', subtitle: 'إنفينيتي', option: 'Infiniti', icon: 'I', badge: 'ياباني' },
          { title: 'Honda', subtitle: 'هوندا', option: 'Honda', icon: 'H', badge: 'ياباني' },
          { title: 'Mazda', subtitle: 'مازدا', option: 'Mazda', icon: 'M', badge: 'ياباني' },
          { title: 'Mitsubishi', subtitle: 'ميتسوبيشي', option: 'Mitsubishi', icon: 'M', badge: 'ياباني' },
          { title: 'Subaru', subtitle: 'سوبارو', option: 'Subaru', icon: 'S', badge: 'ياباني' },
          { title: 'Suzuki', subtitle: 'سوزوكي', option: 'Suzuki', icon: 'S', badge: 'ياباني' },
        ],
      },
      {
        title: 'أمريكي',
        subtitle: 'ماركات أمريكية',
        options: [
          { title: 'GMC', subtitle: 'جي إم سي', option: 'GMC', icon: 'G', badge: 'أمريكي' },
          { title: 'Chevrolet', subtitle: 'شفروليه', option: 'Chevrolet', icon: 'C', badge: 'أمريكي' },
          { title: 'Ford', subtitle: 'فورد', option: 'Ford', icon: 'F', badge: 'أمريكي' },
          { title: 'Jeep', subtitle: 'جيب', option: 'Jeep', icon: 'J', badge: 'أمريكي' },
          { title: 'Cadillac', subtitle: 'كاديلاك', option: 'Cadillac', icon: 'C', badge: 'أمريكي' },
          { title: 'Dodge', subtitle: 'دودج', option: 'Dodge', icon: 'D', badge: 'أمريكي' },
          { title: 'Chrysler', subtitle: 'كرايسلر', option: 'Chrysler', icon: 'C', badge: 'أمريكي' },
          { title: 'Tesla', subtitle: 'تسلا', option: 'Tesla', icon: 'T', badge: 'أمريكي' },
        ],
      },
      {
        title: 'ألماني وأوروبي',
        subtitle: 'ماركات ألمانية وأوروبية',
        options: [
          { title: 'Mercedes', subtitle: 'مرسيدس', option: 'Mercedes', icon: 'M', badge: 'ألماني' },
          { title: 'BMW', subtitle: 'بي إم دبليو', option: 'BMW', icon: 'B', badge: 'ألماني' },
          { title: 'Audi', subtitle: 'أودي', option: 'Audi', icon: 'A', badge: 'ألماني' },
          { title: 'Porsche', subtitle: 'بورشه', option: 'Porsche', icon: 'P', badge: 'ألماني' },
          { title: 'Volkswagen', subtitle: 'فولكس واجن', option: 'Volkswagen', icon: 'V', badge: 'ألماني' },
          { title: 'Mini', subtitle: 'ميني كوبر', option: 'Mini', icon: 'M', badge: 'أوروبي' },
          { title: 'Range Rover', subtitle: 'رينج روفر', option: 'Range Rover', icon: 'R', badge: 'بريطاني' },
          { title: 'Land Rover', subtitle: 'لاند روفر', option: 'Land Rover', icon: 'L', badge: 'بريطاني' },
          { title: 'Jaguar', subtitle: 'جاكوار', option: 'Jaguar', icon: 'J', badge: 'بريطاني' },
          { title: 'Volvo', subtitle: 'فولفو', option: 'Volvo', icon: 'V', badge: 'أوروبي' },
          { title: 'Peugeot', subtitle: 'بيجو', option: 'Peugeot', icon: 'P', badge: 'فرنسي' },
          { title: 'Renault', subtitle: 'رينو', option: 'Renault', icon: 'R', badge: 'فرنسي' },
          { title: 'Fiat', subtitle: 'فيات', option: 'Fiat', icon: 'F', badge: 'إيطالي' },
        ],
      },
      {
        title: 'كوري',
        subtitle: 'ماركات كورية',
        options: [
          { title: 'Hyundai', subtitle: 'هيونداي', option: 'Hyundai', icon: 'H', badge: 'كوري' },
          { title: 'Kia', subtitle: 'كيا', option: 'Kia', icon: 'K', badge: 'كوري' },
          { title: 'Genesis', subtitle: 'جينيسيس', option: 'Genesis', icon: 'G', badge: 'كوري' },
        ],
      },
      {
        title: 'خدمات السيارات',
        subtitle: 'اختر نوع الخدمة',
        options: [
          { title: 'فحص كمبيوتر', subtitle: 'تشخيص أعطال', option: 'فحص كمبيوتر', icon: '💻' },
          { title: 'فحص شامل', subtitle: 'فحص عام', option: 'فحص شامل', icon: '🔍' },
          { title: 'فحص قبل الشراء', subtitle: 'قبل شراء السيارة', option: 'فحص قبل الشراء', icon: '✅' },
          { title: 'صيانة دورية', subtitle: 'خدمة وصيانة', option: 'صيانة دورية', icon: '🛠️' },
          { title: 'تبديل زيوت', subtitle: 'زيوت وفلاتر', option: 'تبديل زيوت', icon: '🛢️' },
          { title: 'قير / جير', subtitle: 'تصليح الجير', option: 'قير / جير', icon: '⚙️' },
          { title: 'مكينة', subtitle: 'تصليح المحرك', option: 'مكينة', icon: '🔩' },
          { title: 'كهرباء سيارات', subtitle: 'كهرباء وبرمجة', option: 'كهرباء سيارات', icon: '⚡' },
          { title: 'مكيفات سيارات', subtitle: 'تبريد وتكييف', option: 'مكيفات سيارات', icon: '❄️' },
          { title: 'بطارية', subtitle: 'بطاريات سيارات', option: 'بطارية', icon: '🔋' },
          { title: 'إطارات', subtitle: 'تايرات وميزان', option: 'إطارات', icon: '🛞' },
          { title: 'سمكرة وصبغ', subtitle: 'بودي ودهان', option: 'سمكرة وصبغ', icon: '🎨' },
          { title: 'تلميع', subtitle: 'تنظيف وتلميع', option: 'تلميع', icon: '✨' },
        ],
      },
    ],
  },

  clinics_hospitals: {
    title: 'عيادات ومستشفيات',
    subtitle: 'اختر التخصص أو نوع الخدمة الطبية',
    icon: '🏥',
    sections: [
      {
        title: 'الخدمات الطبية',
        options: [
          { title: 'أفضل اختيار', subtitle: 'الأفضل حسب WenBest', option: 'أفضل اختيار', icon: '⭐', featured: true },
          { title: 'مستشفى', subtitle: 'مستشفيات', option: 'مستشفى', icon: '🏥' },
          { title: 'طوارئ', subtitle: 'خدمات طوارئ', option: 'طوارئ', icon: '🚑' },
          { title: 'عيادة عامة', subtitle: 'طب عام', option: 'عيادة عامة', icon: '🩺' },
          { title: 'أسنان', subtitle: 'عيادات أسنان', option: 'أسنان', icon: '🦷' },
          { title: 'جلدية', subtitle: 'جلدية وتجميل', option: 'جلدية', icon: '🧴' },
          { title: 'عيون', subtitle: 'عيادات عيون', option: 'عيون', icon: '👁️' },
          { title: 'أطفال', subtitle: 'طب الأطفال', option: 'أطفال', icon: '👶' },
          { title: 'نساء وولادة', subtitle: 'عيادات نساء', option: 'نساء وولادة', icon: '🤰' },
          { title: 'عظام', subtitle: 'عظام ومفاصل', option: 'عظام', icon: '🦴' },
          { title: 'أنف وأذن وحنجرة', subtitle: 'ENT', option: 'أنف وأذن وحنجرة', icon: '👂' },
          { title: 'مختبر', subtitle: 'تحاليل طبية', option: 'مختبر', icon: '🧪' },
          { title: 'أشعة', subtitle: 'تصوير وأشعة', option: 'أشعة', icon: '🩻' },
          { title: 'علاج طبيعي', subtitle: 'تأهيل وعلاج', option: 'علاج طبيعي', icon: '🏃' },
        ],
      },
    ],
  },

  entertainment_parks: {
    title: 'ترفيه ومنتزهات',
    subtitle: 'أماكن خروج وترفيه للعائلة',
    icon: '🌳',
    sections: [
      {
        title: 'أماكن الترفيه',
        options: [
          { title: 'أفضل اختيار', subtitle: 'الأفضل حسب WenBest', option: 'أفضل اختيار', icon: '⭐', featured: true },
          { title: 'حدائق ومنتزهات', subtitle: 'أماكن خضراء', option: 'حدائق ومنتزهات', icon: '🌳' },
          { title: 'شواطئ', subtitle: 'بحر ورمال', option: 'شواطئ', icon: '🏖️' },
          { title: 'مولات', subtitle: 'تسوق وترفيه', option: 'مولات', icon: '🛍️' },
          { title: 'سينما', subtitle: 'أفلام وترفيه', option: 'سينما', icon: '🎬' },
          { title: 'ألعاب أطفال', subtitle: 'أماكن للأطفال', option: 'ألعاب أطفال', icon: '🧸' },
          { title: 'أماكن عائلية', subtitle: 'خروج للعائلة', option: 'أماكن عائلية', icon: '👨‍👩‍👧' },
          { title: 'أماكن مجانية', subtitle: 'بدون تكلفة', option: 'أماكن مجانية', icon: '🆓' },
          { title: 'أماكن داخلية', subtitle: 'مناسبة للصيف', option: 'أماكن داخلية', icon: '🏢' },
          { title: 'أماكن خارجية', subtitle: 'هواء ومشي', option: 'أماكن خارجية', icon: '🌤️' },
          { title: 'ممشى', subtitle: 'مشي ورياضة', option: 'ممشى', icon: '🚶' },
          { title: 'أماكن سياحية', subtitle: 'معالم وزيارات', option: 'أماكن سياحية', icon: '📸' },
        ],
      },
    ],
  },

  salons_barbers: {
    title: 'صالونات وحلاقة',
    subtitle: 'حلاقة، تجميل وعناية',
    icon: '💈',
    sections: [
      {
        title: 'الخدمات',
        options: [
          { title: 'أفضل اختيار', subtitle: 'الأفضل حسب WenBest', option: 'أفضل اختيار', icon: '⭐', featured: true },
          { title: 'حلاق رجالي', subtitle: 'قص شعر ولحية', option: 'حلاق رجالي', icon: '💈' },
          { title: 'صالون نسائي', subtitle: 'تجميل وعناية', option: 'صالون نسائي', icon: '💇‍♀️' },
          { title: 'تجميل', subtitle: 'خدمات تجميل', option: 'تجميل', icon: '💄' },
          { title: 'أظافر', subtitle: 'Nails', option: 'أظافر', icon: '💅' },
          { title: 'مساج', subtitle: 'استرخاء وسبا', option: 'مساج', icon: '💆' },
          { title: 'حمام مغربي', subtitle: 'سبا وعناية', option: 'حمام مغربي', icon: '🛁' },
          { title: 'عناية بالبشرة', subtitle: 'Facial', option: 'عناية بالبشرة', icon: '🧴' },
        ],
      },
    ],
  },

  home_services: {
    title: 'خدمات منزلية',
    subtitle: 'سباك، كهربائي، مكيفات، تنظيف وصيانة عامة',
    icon: '🧰',
    sections: [
      {
        title: 'الخدمات المنزلية',
        options: [
          { title: 'أفضل اختيار', subtitle: 'الأفضل حسب WenBest', option: 'أفضل اختيار', icon: '⭐', featured: true },
          { title: 'سباك', subtitle: 'تمديدات وتصليح', option: 'سباك', icon: '🔧' },
          { title: 'كهربائي', subtitle: 'كهرباء منزلية', option: 'كهربائي', icon: '⚡' },
          { title: 'مكيفات', subtitle: 'تصليح وتنظيف', option: 'مكيفات', icon: '❄️' },
          { title: 'تنظيف منازل', subtitle: 'تنظيف وخدمات', option: 'تنظيف منازل', icon: '🧹' },
          { title: 'مكافحة حشرات', subtitle: 'رش ومكافحة', option: 'مكافحة حشرات', icon: '🐜' },
          { title: 'نقل أثاث', subtitle: 'نقل وتركيب', option: 'نقل أثاث', icon: '🚚' },
          { title: 'صيانة عامة', subtitle: 'خدمات متنوعة', option: 'صيانة عامة', icon: '🛠️' },
        ],
      },
    ],
  },

  laundries: {
    title: 'مغاسل',
    subtitle: 'ملابس، سجاد وسيارات',
    icon: '🧺',
    sections: [
      {
        title: 'أنواع المغاسل',
        options: [
          { title: 'أفضل اختيار', subtitle: 'الأفضل حسب WenBest', option: 'أفضل اختيار', icon: '⭐', featured: true },
          { title: 'مغسلة ملابس', subtitle: 'غسيل وكوي', option: 'مغسلة ملابس', icon: '👕' },
          { title: 'تنظيف جاف', subtitle: 'Dry cleaning', option: 'تنظيف جاف', icon: '🧥' },
          { title: 'كوي', subtitle: 'كوي الملابس', option: 'كوي', icon: '♨️' },
          { title: 'مغسلة سجاد', subtitle: 'سجاد وموكيت', option: 'مغسلة سجاد', icon: '🧼' },
          { title: 'مغسلة سيارات', subtitle: 'غسيل سيارات', option: 'مغسلة سيارات', icon: '🚗' },
        ],
      },
    ],
  },

  hotels_apartments: {
    title: 'فنادق وشقق فندقية',
    subtitle: 'إقامة وسكن مؤقت',
    icon: '🏨',
    sections: [
      {
        title: 'خيارات الإقامة',
        options: [
          { title: 'أفضل اختيار', subtitle: 'الأفضل حسب WenBest', option: 'أفضل اختيار', icon: '⭐', featured: true },
          { title: 'فنادق', subtitle: 'أفضل الفنادق', option: 'فنادق', icon: '🏨' },
          { title: 'شقق فندقية', subtitle: 'إقامة مرنة', option: 'شقق فندقية', icon: '🏢' },
          { title: 'رخيص', subtitle: 'خيارات اقتصادية', option: 'رخيص', icon: '💸' },
          { title: 'فاخر', subtitle: 'إقامة فاخرة', option: 'فاخر', icon: '✨' },
          { title: 'مناسب للعائلات', subtitle: 'للعائلات', option: 'مناسب للعائلات', icon: '👨‍👩‍👧' },
          { title: 'قريب من البحر', subtitle: 'شاطئ وبحر', option: 'قريب من البحر', icon: '🏖️' },
          { title: 'قريب من المطار', subtitle: 'مطار وسفر', option: 'قريب من المطار', icon: '✈️' },
        ],
      },
    ],
  },
};

export default function CategoryScreen() {
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const category = String(params.category ?? 'restaurants');
  const cityKey = String(params.city ?? 'sharjah');
  const subcategory = String(params.subcategory ?? '');

  const selectedCity = getCityByKey(cityKey);
  const baseData = categoryData[category] ?? categoryData.restaurants;

  const data: CategoryData =
    category === 'restaurants' && subcategory === 'international_chains'
      ? {
          title: 'مطاعم عالمية وسلاسل شهيرة',
          subtitle: 'اختر سلسلة المطاعم التي تبحث عنها',
          icon: '🌍',
          sections: [internationalRestaurantChainsSection],
        }
      : baseData;

  const isMobile = width < 700;
  const isTablet = width >= 700 && width < 1024;

  const cardWidth = useMemo(() => {
    if (isMobile) return '100%';
    if (isTablet) return '48%';
    return '31.8%';
  }, [isMobile, isTablet]);

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

  function openResults(option: string, sectionTitle?: string) {
    if (option === '__international_chains__') {
      router.push({
        pathname: '/category',
        params: {
          category: 'restaurants',
          subcategory: 'international_chains',
          city: cityKey,
        },
      });
      return;
    }

    router.push({
      pathname: '/results',
      params: {
        category,
        option,
        optionGroup: sectionTitle ?? '',
        city: cityKey,
      },
    });
  }

  const totalOptions = data.sections.reduce(
    (sum, section) => sum + section.options.length,
    0
  );

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

          <TouchableOpacity style={styles.homeButton} onPress={goHome}>
            <Text style={styles.homeButtonText}>الرئيسية</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.heroCard, isMobile && styles.heroCardMobile]}>
          <View style={styles.heroIconBox}>
            <Text style={styles.heroIcon}>{data.icon}</Text>
          </View>

          <View style={styles.heroTextBox}>
            <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
              {data.title}
            </Text>

            <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
              {data.subtitle}
            </Text>

            <View style={styles.heroPills}>
              <View style={styles.heroPillLight}>
                <Text style={styles.heroPillLightText}>📍 {selectedCity.nameAr}</Text>
              </View>

              <View style={styles.heroPillGold}>
                <Text style={styles.heroPillGoldText}>{totalOptions} خيار</Text>
              </View>
            </View>
          </View>
        </View>

        {data.sections.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.subtitle ? (
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              ) : null}
            </View>

            <View style={styles.optionsGrid}>
              {section.options.map((item) => {
                if (item.featured) {
                  return (
                    <TouchableOpacity
                      key={`${section.title}-${item.option}`}
                      style={[styles.featuredCard, isMobile && styles.featuredCardMobile]}
                      onPress={() => openResults(item.option, section.title)}
                    >
                      <View style={styles.featuredIconBox}>
                        <Text style={styles.featuredIcon}>{item.icon}</Text>
                      </View>

                      <View style={styles.featuredTextBox}>
                        <Text style={styles.featuredTitle}>{item.title}</Text>
                        <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>

                        <View style={styles.featuredButton}>
                          <Text style={styles.featuredButtonText}>
                            عرض النتائج في {selectedCity.nameAr}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={`${section.title}-${item.option}`}
                    style={[styles.optionCard, { width: cardWidth }]}
                    onPress={() => openResults(item.option, section.title)}
                  >
                    <View style={styles.optionIconBox}>
                      <Text style={styles.optionIcon}>{item.icon}</Text>
                    </View>

                    <View style={styles.optionTextBox}>
                      <Text style={styles.optionTitle}>{item.title}</Text>
                      <Text style={styles.optionSubtitle}>{item.subtitle}</Text>

                      {item.badge ? (
                        <Text style={styles.optionBadgeText}>{item.badge}</Text>
                      ) : null}

                      <View style={styles.optionButton}>
                        <Text style={styles.optionButtonText}>
                          عرض النتائج في {selectedCity.nameAr}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>نصيحة</Text>
          <Text style={styles.tipText}>
            يمكنك أيضًا الرجوع للرئيسية وكتابة بحث حر مثل: كراج إنفينيتي، سباك، مغسلة، أو فندق قريب من البحر.
          </Text>
        </View>
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
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: 32,
    padding: 22,
    marginBottom: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 18,
  },
  heroCardMobile: {
    padding: 18,
    borderRadius: 30,
    alignItems: 'flex-start',
  },
  heroIconBox: {
    width: 92,
    height: 92,
    borderRadius: 26,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 46,
  },
  heroTextBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'right',
    lineHeight: 44,
  },
  heroTitleMobile: {
    fontSize: 30,
    lineHeight: 40,
  },
  heroSubtitle: {
    color: '#CBD5E1',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 8,
    lineHeight: 27,
  },
  heroSubtitleMobile: {
    fontSize: 15,
    lineHeight: 24,
  },
  heroPills: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  heroPillLight: {
    backgroundColor: '#E6FFFA',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  heroPillLightText: {
    color: colors.tealDark,
    fontWeight: '900',
  },
  heroPillGold: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  heroPillGoldText: {
    color: colors.navy,
    fontWeight: '900',
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.navy,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'right',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 6,
    lineHeight: 23,
  },
  optionsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'stretch',
  },
  featuredCard: {
    width: '100%',
    backgroundColor: colors.navy,
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
    marginBottom: 2,
  },
  featuredCardMobile: {
    alignItems: 'center',
  },
  featuredIconBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredIcon: {
    fontSize: 38,
  },
  featuredTextBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  featuredTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'right',
  },
  featuredSubtitle: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 5,
  },
  featuredButton: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  featuredButtonText: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 13,
  },
  optionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    minHeight: 165,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
  },
  optionIconBox: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIcon: {
    color: colors.navy,
    fontSize: 32,
    fontWeight: '900',
  },
  optionTextBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  optionTitle: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'right',
    lineHeight: 32,
  },
  optionSubtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 22,
  },
  optionBadgeText: {
    color: colors.tealDark,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 5,
  },
  optionButton: {
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 11,
  },
  optionButtonText: {
    color: colors.tealDark,
    fontWeight: '900',
    fontSize: 13,
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 24,
    padding: 18,
    marginTop: 4,
  },
  tipTitle: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 8,
  },
  tipText: {
    color: colors.tealDark,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 25,
    textAlign: 'right',
  },
});