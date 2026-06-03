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

      if (!code) {
        setMessage('تعذر استلام رمز تسجيل الدخول.');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setMessage('تعذر إكمال تسجيل الدخول بواسطة Google.');
        return;
      }

      router.replace('/');
    }

    completeLogin();
  }, [params.code]);

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" />
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