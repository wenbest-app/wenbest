import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const url = Linking.useURL();
  const [initialUrl, setInitialUrl] = useState<string | null>(null);

  useEffect(() => {
    Linking.getInitialURL().then(setInitialUrl);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Google Callback Debug</Text>

        <Text style={styles.label}>useURL:</Text>
        <Text style={styles.value}>{url || 'NO URL'}</Text>

        <Text style={styles.label}>initialURL:</Text>
        <Text style={styles.value}>{initialUrl || 'NO INITIAL URL'}</Text>

        <Text style={styles.label}>params:</Text>
        <Text style={styles.value}>{JSON.stringify(params, null, 2)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FC' },
  content: { padding: 20, paddingTop: 80 },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#06214A',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '900',
    color: '#09AFA3',
    marginTop: 18,
  },
  value: {
    fontSize: 13,
    color: '#06214A',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
});