import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← رجوع</Text>
        </TouchableOpacity>

        <Text style={styles.title}>سياسة الخصوصية</Text>

        <Text style={styles.text}>
          يلتزم تطبيق WenBest بحماية خصوصية المستخدمين.
          قد نقوم بجمع البريد الإلكتروني والمفضلات والمدينة المختارة
          لتحسين تجربة الاستخدام.
        </Text>

        <Text style={styles.text}>
          لا نقوم ببيع أو مشاركة بيانات المستخدمين مع أي جهة خارجية
          باستثناء الخدمات التقنية اللازمة لتشغيل التطبيق.
        </Text>

        <Text style={styles.text}>
          باستخدام التطبيق فإنك توافق على سياسة الخصوصية هذه.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  content: {
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 25,
    color: '#06214A',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'right',
    marginBottom: 15,
    color: '#334155',
  },
});