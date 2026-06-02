import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← رجوع</Text>
        </TouchableOpacity>

        <Text style={styles.title}>شروط الاستخدام</Text>

        <Text style={styles.text}>
          يوفر تطبيق WenBest معلومات وتوصيات لمساعدة المستخدم
          في العثور على أفضل الأماكن والخدمات.
        </Text>

        <Text style={styles.text}>
          لا يضمن التطبيق دقة جميع المعلومات أو توفر الخدمات
          المقدمة من الجهات الخارجية.
        </Text>

        <Text style={styles.text}>
          يتحمل المستخدم مسؤولية قراراته واختياراته عند التعامل
          مع أي منشأة أو خدمة يتم عرضها داخل التطبيق.
        </Text>

        <Text style={styles.text}>
          يحق لإدارة WenBest تعديل أو تحديث هذه الشروط في أي وقت.
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