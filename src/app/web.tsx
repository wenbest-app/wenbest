import { router } from 'expo-router';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const androidDownloadUrl =
  'https://drive.google.com/file/d/1ox9G2HfcxBMH-hI1y2uPaahltRJPUqRT/view?usp=drive_link';

export default function WenBestWebPage() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.logo}>WenBest</Text>
          <Text style={styles.title}>اعرف وين الأفضل</Text>
          <Text style={styles.subtitle}>
            دليلك الذكي لاكتشاف أفضل المطاعم، الفنادق، الكراجات، الخدمات، والوجهات في مدينتك.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => Linking.openURL(androidDownloadUrl)}
          >
            <Text style={styles.primaryButtonText}>تحميل تطبيق Android</Text>
          </TouchableOpacity>

          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>iPhone قريبًا</Text>
          </View>

          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>Google Play قريبًا</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>لماذا WenBest؟</Text>
          <Text style={styles.cardText}>
            يوفر WenBest وقتك وجهدك عندما تبحث عن مكان مناسب، ويعرض لك خيارات منظمة حسب المدينة، التصنيف، التقييم، والمسافة.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>الخدمات</Text>
          <Text style={styles.cardText}>
            مطاعم، كافيهات، فنادق، كراجات، عيادات، منتزهات، صالونات، مغاسل، خدمات منزلية، ووكالات سفر وسياحة.
          </Text>
        </View>

        <View style={styles.linksBox}>
          <TouchableOpacity onPress={() => router.push('/privacy' as any)}>
            <Text style={styles.link}>سياسة الخصوصية</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/terms' as any)}>
            <Text style={styles.link}>شروط الاستخدام</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/contact' as any)}>
            <Text style={styles.link}>تواصل معنا</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2026 WenBest</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  navy: '#06214A',
  teal: '#09AFA3',
  gold: '#F5B942',
  bg: '#F5F8FC',
  white: '#FFFFFF',
  muted: '#64748B',
  border: '#E2E8F0',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: 20,
    paddingBottom: 50,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: 30,
    padding: 28,
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    color: colors.gold,
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 10,
  },
  title: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#D9F7F4',
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 22,
  },
  primaryButton: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
  },
  comingSoon: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginTop: 8,
  },
  comingSoonText: {
    color: colors.white,
    fontWeight: '900',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardTitle: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 10,
  },
  cardText: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 27,
    textAlign: 'right',
    fontWeight: '700',
  },
  linksBox: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  link: {
    color: colors.teal,
    fontSize: 16,
    fontWeight: '900',
  },
  footer: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 24,
    fontWeight: '700',
  },
});