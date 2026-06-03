import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';

import { supabase } from '../../../lib/supabase';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const [message, setMessage] = useState('جاري إكمال تسجيل الدخول...');

  useEffect(() => {
    async function completeLogin() {
      const codeParam = params.code;
      const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMessage('تعذر إكمال تسجيل الدخول بواسطة Google.');
          return;
        }

        router.replace('/');
        return;
      }

      const accessToken = params.access_token;
      const refreshToken = params.refresh_token;

      const access = Array.isArray(accessToken) ? accessToken[0] : accessToken;
      const refresh = Array.isArray(refreshToken) ? refreshToken[0] : refreshToken;

      if (access && refresh) {
        const { error } = await supabase.auth.setSession({
          access_token: access,
          refresh_token: refresh,
        });

        if (error) {
          setMessage('تعذر تثبيت جلسة تسجيل الدخول.');
          return;
        }

        router.replace('/');
        return;
      }

      setMessage('تعذر استلام رمز تسجيل الدخول.');
    }

    completeLogin();
  }, [params.code, params.access_token, params.refresh_token]);

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color="#09AFA3" />
      <Text style={styles.text}>{message}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    marginTop: 16,
    color: '#06214A',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
});