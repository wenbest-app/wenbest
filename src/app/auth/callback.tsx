import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';

import { supabase } from '../../../lib/supabase';

function getParamFromUrl(url: string, key: string) {
  const cleanUrl = url.replace('#', '?');
  const query = cleanUrl.split('?')[1] ?? '';
  const params = new URLSearchParams(query);
  return params.get(key);
}

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const url = Linking.useURL();
  const [message, setMessage] = useState('جاري إكمال تسجيل الدخول...');

  useEffect(() => {
    async function completeLogin() {
      const codeFromParams = Array.isArray(params.code) ? params.code[0] : params.code;
      const codeFromUrl = url ? getParamFromUrl(url, 'code') : null;
      const code = codeFromParams || codeFromUrl;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMessage('تعذر إكمال تسجيل الدخول بواسطة Google.');
          return;
        }

        router.replace('/');
        return;
      }

      const accessToken =
        (Array.isArray(params.access_token) ? params.access_token[0] : params.access_token) ||
        (url ? getParamFromUrl(url, 'access_token') : null);

      const refreshToken =
        (Array.isArray(params.refresh_token) ? params.refresh_token[0] : params.refresh_token) ||
        (url ? getParamFromUrl(url, 'refresh_token') : null);

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
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
  }, [url, params.code, params.access_token, params.refresh_token]);

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