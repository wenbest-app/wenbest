import { router } from 'expo-router';
import {
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNav from '../components/BottomNav';

const logoImage = require('../../assets/images/wenbest-logo.png');

const colors = {
  navy: '#06214A',
  teal: '#09AFA3',
  gold: '#F5B942',
  bg: '#F5F8FC',
  text: '#0B1F3A',
  muted: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
  red: '#DC2626',
};

const email = 'wenbest.app@gmail.com';

function openMail(subject: string) {
  const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  Linking.openURL(url);
}

export default function ContactScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Text style={styles.iconButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.logoMiniBox}>
            <Image source={logoImage} style={styles.logoMini} resizeMode="contain" />
          </View>

          <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')}>
            <Text style={styles.homeButtonText}>الرئيسية</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>💬 تواصل معنا</Text>

          <Text style={styles.subtitle}>
            نرحب بجميع اقتراحاتكم وآرائكم لتطوير WenBest.
          </Text>

          <Text style={styles.text}>
            إذا وجدت خطأ، أو لديك فكرة لتحسين التطبيق، أو تريد اقتراح تصنيف أو مكان جديد،
            يسعدنا التواصل معك.
          </Text>

          <View style={styles.emailBox}>
            <Text style={styles.emailLabel}>البريد الإلكتروني</Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => openMail('اقتراح لتطبيق WenBest')}
          >
            <Text style={styles.primaryButtonText}>إرسال اقتراح</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => openMail('الإبلاغ عن مشكلة في WenBest')}
          >
            <Text style={styles.secondaryButtonText}>الإبلاغ عن مشكلة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => openMail('اقتراح إضافة مكان جديد إلى WenBest')}
          >
            <Text style={styles.outlineButtonText}>اقتراح مكان جديد</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          شكراً لمساعدتك في تحسين WenBest.
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
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  topHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
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
  card: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.navy,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'right',
  },
  subtitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 14,
    lineHeight: 28,
  },
  text: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 10,
    lineHeight: 26,
  },
  emailBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
  },
  emailLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  emailText: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: colors.gold,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  primaryButtonText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    backgroundColor: colors.navy,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  outlineButton: {
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  outlineButtonText: {
    color: colors.teal,
    fontSize: 16,
    fontWeight: '900',
  },
  footerNote: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 18,
  },
});