import { MaterialCommunityIcons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Animated, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from './context/ThemeContext';

export default function HomeScreen() {
  const user = auth().currentUser;
  const { colors, isDark, toggleTheme } = useTheme();
  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);

  const handleLogout = () => {
    setLogoutAlertVisible(true);
  };

  const confirmLogout = async () => {
    try {
      await auth().signOut();
      // @ts-ignore
      router.replace('/login');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      Alert.alert('Hata', 'Çıkış yapılamadı');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#EDF2F7' }]}>
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
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={36}
              color={isDark ? '#06B6D4' : '#3B82F6'}
            />
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
            <MaterialCommunityIcons
              name={isDark ? 'white-balance-sunny' : 'weather-night'}
              size={26}
              color={isDark ? '#FCD34D' : '#6B7280'}
            />
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
            <MaterialCommunityIcons
              name="logout-variant"
              size={26}
              color={isDark ? '#F87171' : '#6B7280'}
            />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/robot_mascot.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.text }]}>AgentHub</Text>
        </View>
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
                        <MaterialCommunityIcons
                          name="robot-outline"
                          size={70}
                          color="rgba(255, 255, 255, 0.9)"
                        />
                        <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>
                          Bireysel Mod
                        </Text>
                        <Text style={[styles.cardDescription, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                          Tek bir agent ile sohbet et
                        </Text>
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
                        <MaterialCommunityIcons
                          name="robot-outline"
                          size={70}
                          color="rgba(255, 255, 255, 0.9)"
                        />
                        <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>
                          Bireysel Mod
                        </Text>
                        <Text style={[styles.cardDescription, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                          Tek bir agent ile sohbet et
                        </Text>
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
                        <MaterialCommunityIcons
                          name="hub-outline"
                          size={70}
                          color="rgba(255, 255, 255, 0.9)"
                        />
                        <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>
                          Koordine Mod
                        </Text>
                        <Text style={[styles.cardDescription, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                          Birden fazla agent koordine et
                        </Text>
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
                        <MaterialCommunityIcons
                          name="hub-outline"
                          size={70}
                          color="rgba(255, 255, 255, 0.9)"
                        />
                        <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>
                          Koordine Mod
                        </Text>
                        <Text style={[styles.cardDescription, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                          Birden fazla agent koordine et
                        </Text>
                      </View>
                    </LinearGradient>
                  )}
                </Animated.View>
              )}
            </Pressable>
          </Link>
        </View>
      </View>

      {/* Custom Logout Alert */}
      <CustomAlert
        visible={logoutAlertVisible}
        title="Çıkış Yap"
        message="Hesabından çıkmak istediğine emin misin?"
        isDark={isDark}
        onClose={() => setLogoutAlertVisible(false)}
        buttons={[
          {
            text: 'İptal',
            style: 'cancel',
          },
          {
            text: 'Çıkış Yap',
            style: 'destructive',
            onPress: confirmLogout,
          },
        ]}
      />
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginRight: 2,
  },
  title: {
    fontSize: 38,
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
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 70,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
