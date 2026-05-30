import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

const logoImage = require('../../assets/images/wenbest-logo.png');
const cityWatermarkImage = require('../../assets/images/city-watermark.png');

const colors = {
  navy: '#06214A',
  tealDark: '#07877E',
  gold: '#F5B942',
  bg: '#F5F8FC',
  text: '#0B1F3A',
  muted: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
  red: '#991B1B',
  green: '#047857',
};

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  function clearMessage() {
    setMessage('');
    setIsError(false);
  }

  async function updatePassword() {
    clearMessage();

    if (!password || !confirmPassword) {
      setIsError(true);
      setMessage('الرجاء إدخال كلمة السر وتأكيدها.');
      return;
    }

    if (password.length < 6) {
      setIsError(true);
      setMessage('كلمة السر يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage('كلمة السر وتأكيدها غير متطابقين.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage(error.message);
      return;
    }

    setIsError(false);
    setMessage('تم تحديث كلمة السر بنجاح. يمكنك الآن تسجيل الدخول.');

    setTimeout(() => {
      router.replace('/login');
    }, 1200);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.replace('/login')}>
            <Text style={styles.iconButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.logoMiniBox}>
            <Image source={logoImage} style={styles.logoMini} resizeMode="contain" />
          </View>

          <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')}>
            <Text style={styles.homeButtonText}>الرئيسية</Text>
          </TouchableOpacity>
        </View>

        <ImageBackground
          source={cityWatermarkImage}
          style={styles.heroCard}
          imageStyle={styles.heroBackgroundImage}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay}>
            <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />

            <Text style={styles.title}>إعادة تعيين كلمة السر</Text>

            <Text style={styles.heroTagline}>
              دليلك الذكي لاختيار الأفضل في مدينتك
            </Text>

            <Text style={styles.subtitle}>
              أدخل كلمة السر الجديدة ثم أكدها.
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>كلمة السر الجديدة</Text>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            textAlign="right"
          />

          <Text style={styles.inputLabel}>تأكيد كلمة السر</Text>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            secureTextEntry
            textAlign="right"
          />

          {message ? (
            <View style={[styles.messageBox, isError && styles.errorBox]}>
              <Text style={[styles.messageText, isError && styles.errorText]}>
                {message}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={updatePassword}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'جاري التحديث...' : 'تحديث كلمة السر'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/login')}>
            <Text style={styles.secondaryButtonText}>العودة لتسجيل الدخول</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ملاحظة</Text>
          <Text style={styles.infoText}>
            يجب فتح هذه الصفحة من رابط إعادة تعيين كلمة السر المرسل إلى بريدك حتى يتم تحديث كلمة السر بنجاح.
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

  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    minHeight: 315,
  },
  heroBackgroundImage: {
    opacity: 0.78,
  },
  heroOverlay: {
    flex: 1,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  logoImage: {
    width: 170,
    height: 125,
    marginBottom: 4,
  },
  title: {
    color: colors.navy,
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroTagline: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(6, 33, 74, 0.16)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '700',
  },

  formCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 14,
    color: '#111827',
    fontSize: 15,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: colors.gold,
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: colors.tealDark,
    fontSize: 15,
    fontWeight: '900',
  },
  messageBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  messageText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    lineHeight: 22,
  },
  errorText: {
    color: colors.red,
  },
  infoBox: {
    backgroundColor: colors.navy,
    borderRadius: 24,
    padding: 16,
  },
  infoTitle: {
    color: colors.gold,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 6,
  },
  infoText: {
    color: '#D9F7F4',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'right',
  },
});