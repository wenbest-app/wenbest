import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  Linking,
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
  teal: '#09AFA3',
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

type Mode = 'login' | 'signup' | 'forgot';

function getResetRedirectUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/reset-password`;
  }

  return undefined;
}

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  function clearMessage() {
    setMessage('');
    setIsError(false);
  }

  function goBackSafely() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function handleLogin() {
    clearMessage();

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setIsError(true);
      setMessage('الرجاء إدخال البريد الإلكتروني وكلمة السر.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (error) {
  setIsError(true);

  if (
    error.message.toLowerCase().includes('invalid login') ||
    error.message.toLowerCase().includes('invalid credentials')
  ) {
    setMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  } else if (
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('fetch')
  ) {
    setMessage('لا يوجد اتصال بالإنترنت. تحقق من الشبكة ثم حاول مرة أخرى.');
  } else {
    setMessage('تعذر تسجيل الدخول حالياً. حاول مرة أخرى.');
  }

  return;
}

    setIsError(false);
    setMessage('تم تسجيل الدخول بنجاح.');
    router.replace('/');
  }

  async function handleSignup() {
    clearMessage();

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setIsError(true);
      setMessage('الرجاء إدخال البريد الإلكتروني وكلمة السر.');
      return;
    }

    if (password.length < 6) {
      setIsError(true);
      setMessage('كلمة السر يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (error) {
  setIsError(true);

  if (error.message.toLowerCase().includes('already registered')) {
    setMessage('هذا البريد الإلكتروني مسجل مسبقاً.');
  } else if (
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('fetch')
  ) {
    setMessage('لا يوجد اتصال بالإنترنت. تحقق من الشبكة ثم حاول مرة أخرى.');
  } else {
    setMessage('تعذر إنشاء الحساب حالياً. حاول مرة أخرى.');
  }

  return;
}

    setIsError(false);
    setMessage('تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلًا، افحص بريدك الإلكتروني.');
  }

  async function handleForgotPassword() {
    clearMessage();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setIsError(true);
      setMessage('أدخل بريدك الإلكتروني أولًا لإرسال رابط إعادة تعيين كلمة السر.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: getResetRedirectUrl(),
    });

    setLoading(false);

    if (error) {
  setIsError(true);

  if (
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('fetch')
  ) {
    setMessage('لا يوجد اتصال بالإنترنت. تحقق من الشبكة ثم حاول مرة أخرى.');
  } else {
    setMessage('تعذر إرسال رابط إعادة التعيين حالياً. حاول مرة أخرى.');
  }

  return;
}

    setIsError(false);
    setMessage('تم إرسال رابط إعادة تعيين كلمة السر إلى بريدك الإلكتروني.');
  }

  const title =
    mode === 'login'
      ? 'تسجيل الدخول'
      : mode === 'signup'
        ? 'إنشاء حساب جديد'
        : 'استعادة كلمة السر';

  const subtitle =
    mode === 'login'
      ? 'ادخل إلى حسابك لحفظ الأماكن المفضلة.'
      : mode === 'signup'
        ? 'أنشئ حسابًا جديدًا لحفظ اختياراتك.'
        : 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة السر.';

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

        <ImageBackground
          source={cityWatermarkImage}
          style={styles.heroCard}
          imageStyle={styles.heroBackgroundImage}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay}>
            <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />

            <Text style={styles.title}>{title}</Text>

            <Text style={styles.heroTagline}>
              دليلك الذكي لاختيار الأفضل في مدينتك
            </Text>

            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </ImageBackground>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
          <TextInput
            placeholder="example@email.com"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            textAlign="right"
          />

          {mode !== 'forgot' ? (
            <>
              <Text style={styles.inputLabel}>كلمة السر</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
                textAlign="right"
              />
            </>
          ) : null}

          {message ? (
            <View style={[styles.messageBox, isError && styles.errorBox]}>
              <Text style={[styles.messageText, isError && styles.errorText]}>
                {message}
              </Text>
            </View>
          ) : null}

          {mode === 'login' ? (
  <>
  <TouchableOpacity
  style={styles.primaryButton}
  onPress={handleLogin}
  disabled={loading}
>
  <Text style={styles.primaryButtonText}>
    {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
  </Text>
</TouchableOpacity>
    <TouchableOpacity
      style={styles.forgotButton}
      onPress={() => {
        clearMessage();
        setMode('forgot');
      }}
    >
      <Text style={styles.forgotButtonText}>نسيت كلمة السر؟</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.secondaryButton}
      onPress={() => {
        clearMessage();
        setMode('signup');
      }}
    >
      <Text style={styles.secondaryButtonText}>إنشاء حساب جديد</Text>
    </TouchableOpacity>
  </>
) : null}

          {mode === 'signup' ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  clearMessage();
                  setMode('login');
                }}
              >
                <Text style={styles.secondaryButtonText}>لدي حساب بالفعل</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {mode === 'forgot' ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  clearMessage();
                  setMode('login');
                }}
              >
                <Text style={styles.secondaryButtonText}>العودة لتسجيل الدخول</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ملاحظة</Text>
          <Text style={styles.infoText}>
            إذا نسيت كلمة السر، يمكنك طلب رابط إعادة التعيين عبر بريدك الإلكتروني.
          </Text>
        </View>
        <View style={styles.downloadSection}>
  <Text style={styles.downloadTitle}>حمّل تطبيق WenBest</Text>

  <Text style={styles.downloadText}>
    استخدم WenBest على هاتفك للوصول السريع إلى أفضل الأماكن وحفظ المفضلة بسهولة.
  </Text>

  <View style={styles.downloadButtons}>
    <TouchableOpacity
      style={styles.androidButton}
      onPress={() =>
        Linking.openURL(
          'https://drive.google.com/file/d/1ox9G2HfcxBMH-hI1y2uPaahltRJPUqRT/view?usp=drive_link'
        )
      }
    >
      <Text style={styles.androidButtonText}>⬇️ تحميل Android</Text>
    </TouchableOpacity>

    <View style={styles.disabledStoreButton}>
      <Text style={styles.disabledStoreButtonText}> iPhone قريبًا</Text>
    </View>

    <View style={styles.disabledStoreButton}>
      <Text style={styles.disabledStoreButtonText}>▶ Google Play قريبًا</Text>
    </View>
  </View>
</View>
        <View style={styles.legalLinksBox}>
  <TouchableOpacity onPress={() => router.push('/privacy' as any)}>
    <Text style={styles.legalLink}>سياسة الخصوصية</Text>
  </TouchableOpacity>

  <Text style={styles.legalSeparator}>|</Text>

  <TouchableOpacity onPress={() => router.push('/terms' as any)}>
    <Text style={styles.legalLink}>شروط الاستخدام</Text>
  </TouchableOpacity>
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
    fontSize: 28,
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
  forgotButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  forgotButtonText: {
    color: colors.tealDark,
    fontSize: 15,
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
  legalLinksBox: {
  flexDirection: 'row-reverse',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 18,
  marginBottom: 12,
},

legalLink: {
  color: colors.navy,
  fontSize: 14,
  fontWeight: '900',
},

legalSeparator: {
  color: colors.muted,
  fontSize: 14,
  fontWeight: '700',
},
downloadSection: {
  backgroundColor: '#FFFFFF',
  borderRadius: 30,
  padding: 24,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  alignItems: 'center',
  marginTop: 18,
  marginBottom: 18,
},

downloadTitle: {
  color: '#06214A',
  fontSize: 26,
  fontWeight: '900',
  textAlign: 'center',
  marginBottom: 10,
},

downloadText: {
  color: '#64748B',
  fontSize: 15,
  lineHeight: 25,
  fontWeight: '700',
  textAlign: 'center',
  maxWidth: 680,
  marginBottom: 18,
},

downloadButtons: {
  flexDirection: 'row-reverse',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'center',
},

androidButton: {
  backgroundColor: '#F5B942',
  borderRadius: 999,
  paddingVertical: 14,
  paddingHorizontal: 22,
},

androidButtonText: {
  color: '#06214A',
  fontSize: 16,
  fontWeight: '900',
},

disabledStoreButton: {
  backgroundColor: '#F1F5F9',
  borderRadius: 999,
  paddingVertical: 14,
  paddingHorizontal: 22,
  borderWidth: 1,
  borderColor: '#E2E8F0',
},

disabledStoreButtonText: {
  color: '#64748B',
  fontSize: 16,
  fontWeight: '900',
},
});