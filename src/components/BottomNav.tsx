import { router, usePathname } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const colors = {
  navy: '#06214A',
  teal: '#09AFA3',
  muted: '#64748B',
  white: '#FFFFFF',
  border: '#E2E8F0',
};

const tabs = [
  { label: 'الرئيسية', icon: '🏠', path: '/' },
  { label: 'استكشاف', icon: '🔎', path: '/explore' },
  { label: 'المفضلة', icon: '❤️', path: '/favorites' },
  { label: 'تواصل', icon: '📞', path: '/contact' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.wrapper}>
      {tabs.map((tab) => {
        const active = pathname === tab.path;

        return (
          <TouchableOpacity
            key={tab.path}
            style={styles.tab}
            onPress={() => router.replace(tab.path as any)}
            activeOpacity={0.8}
          >
            <Text style={[styles.icon, active && styles.activeText]}>
              {tab.icon}
            </Text>
            <Text style={[styles.label, active && styles.activeText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    height: 68,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 100,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  activeText: {
    color: colors.teal,
  },
});