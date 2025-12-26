import auth from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
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
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F7FAFC' }]}>
      {/* Modern Header */}
      <View style={[styles.userCard, {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#FFFFFF',
        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      }]}>
        <View style={styles.userInfo}>
          {/* Profile Icon */}
          <View style={[styles.profileIcon, {
            backgroundColor: isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(59, 130, 246, 0.2)',
          }]}>
            <Text style={styles.profileEmoji}>👤</Text>
          </View>
          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeText, {
              color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7280'
            }]}>
              Welcome,
            </Text>
            <Text style={[styles.userName, {
              color: isDark ? '#FFFFFF' : '#1F2937'
            }]}>
              {user?.email?.split('@')[0] || 'User'}
            </Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
              pressed && { opacity: 0.7 }
            ]}
            onPress={toggleTheme}
          >
            <Text style={styles.headerButtonIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </Pressable>

          {/* Logout Button - EKLE */}
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
              pressed && { opacity: 0.7 }
            ]}
            onPress={handleLogout}
          >
            <Text style={styles.headerButtonIcon}>🚪</Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>🤖 AgentHub</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Çok Ajanlı Yapay Zeka Destekli Mobil Asistan</Text>

        <View style={styles.cardContainer}>
          <Link href="/individual" asChild>
            <Pressable>
              {({ pressed }) => (
                <Animated.View style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}>
                  {isDark ? (
                    // Dark Mode: Neon Border Card
                    <View style={[
                      styles.glassCard,
                      {
                        backgroundColor: 'rgba(30, 41, 59, 0.6)',
                        borderWidth: 2,
                        borderColor: '#667EEA',
                        shadowColor: '#667EEA',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.6,
                        shadowRadius: 12,
                      }
                    ]}>
                      <View style={styles.cardContent}>
                        <View>
                          <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>
                            Bireysel Mod
                          </Text>
                          <Text style={[styles.cardDescription, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                            Tek bir agent ile sohbet et
                          </Text>
                        </View>
                        <Text style={styles.cardIcon}>🤖</Text>
                      </View>
                    </View>
                  ) : (
                    // Light Mode: Gradient Card
                    <LinearGradient
                      colors={['#667EEA', '#00D4AA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.glassCard}
                    >
                      <View style={styles.cardContent}>
                        <View>
                          <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>
                            Bireysel Mod
                          </Text>
                          <Text style={[styles.cardDescription, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                            Tek bir agent ile sohbet et
                          </Text>
                        </View>
                        <Text style={styles.cardIcon}>🤖</Text>
                      </View>
                    </LinearGradient>
                  )}
                </Animated.View>
              )}
            </Pressable>
          </Link>

          <Link href="/coordinate" asChild>
            <Pressable>
              {({ pressed }) => (
                <Animated.View style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}>
                  {isDark ? (
                    // Dark Mode: Green Neon Border
                    <View style={[
                      styles.glassCard,
                      {
                        backgroundColor: 'rgba(30, 41, 59, 0.6)',
                        borderWidth: 2,
                        borderColor: '#10B981',
                        shadowColor: '#10B981',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.6,
                        shadowRadius: 12,
                      }
                    ]}>
                      <View style={styles.cardContent}>
                        <View>
                          <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>
                            Koordine Mod
                          </Text>
                          <Text style={[styles.cardDescription, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                            Birden fazla agent koordine et
                          </Text>
                        </View>
                        <Text style={styles.cardIcon}>🤝</Text>
                      </View>
                    </View>
                  ) : (
                    // Light Mode: Green Gradient
                    <LinearGradient
                      colors={['#10B981', '#34D399']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.glassCard}
                    >
                      <View style={styles.cardContent}>
                        <View>
                          <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>
                            Koordine Mod
                          </Text>
                          <Text style={[styles.cardDescription, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                            Birden fazla agent koordine et
                          </Text>
                        </View>
                        <Text style={styles.cardIcon}>🤝</Text>
                      </View>
                    </LinearGradient>
                  )}
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileEmoji: {
    fontSize: 24,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 13,
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  cardContainer: {
    gap: 16,
  },
  glassCard: {
    borderRadius: 20,
    padding: 40,
    minHeight: 220,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 70,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
});
