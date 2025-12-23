import auth from '@react-native-firebase/auth';
import { Link, router } from 'expo-router';
import { Alert, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from './context/ThemeContext';

export default function HomeScreen() {
  const user = auth().currentUser;
  const { colors, isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabından çıkmak istediğine emin misin?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
              // @ts-ignore
              router.replace('/login');
            } catch (error) {
              console.error('Çıkış hatası:', error);
              Alert.alert('Hata', 'Çıkış yapılamadı');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>👋 Hoş Geldin!</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.headerButtonPressed
            ]}
            onPress={toggleTheme}
          >
            {({ pressed }) => (
              <Animated.View style={{ transform: [{ scale: pressed ? 0.95 : 1 }] }}>
                <Text style={styles.headerButtonIcon}>{isDark ? '☀️' : '🌙'}</Text>
              </Animated.View>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.headerButtonPressed
            ]}
            onPress={handleLogout}
          >
            {({ pressed }) => (
              <Animated.View style={{ transform: [{ scale: pressed ? 0.95 : 1 }] }}>
                <Text style={styles.headerButtonText}>🚪</Text>
              </Animated.View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>🤖 AgentHub</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Yapay Zeka Agent'larınız</Text>

        <View style={styles.cardContainer}>
          <Link href="/individual" asChild>
            <Pressable>
              {({ pressed }) => (
                <Animated.View style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}>
                  {/* CSS Glassmorphism Card */}
                  <View
                    style={[
                      styles.glassCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(45, 45, 45, 0.95)'
                          : 'rgba(255, 255, 255, 0.95)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.15)'
                          : 'rgba(0, 0, 0, 0.08)',
                      }
                    ]}
                  >
                    <Text style={styles.cardIcon}>👤</Text>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Bireysel Mod</Text>
                    <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                      Tek bir agent ile sohbet et
                    </Text>
                  </View>
                </Animated.View>
              )}
            </Pressable>
          </Link>

          <Link href="/coordinate" asChild>
            <Pressable>
              {({ pressed }) => (
                <Animated.View style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}>
                  <View
                    style={[
                      styles.glassCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(45, 45, 45, 0.95)'
                          : 'rgba(255, 255, 255, 0.95)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.15)'
                          : 'rgba(0, 0, 0, 0.08)',
                      }
                    ]}
                  >
                    <Text style={styles.cardIcon}>🤝</Text>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Koordinatör Mod</Text>
                    <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                      Birden fazla agent koordine et
                    </Text>
                  </View>
                </Animated.View>
              )}
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  headerButtonIcon: {
    fontSize: 22,
  },
  headerButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 50,
  },
  cardContainer: {
    gap: 20,
  },
  glassCard: {
    padding: 30,
    borderRadius: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardIcon: {
    fontSize: 56,
    marginBottom: 20,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
