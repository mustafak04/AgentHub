import auth from '@react-native-firebase/auth';
import { Link, router } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
      {/* Kullanıcı Bilgisi Kartı */}
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>👋 Hoş Geldin!</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
            <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 Çıkış</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ana Sayfa İçeriği */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>🤖 AgentHub</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Yapay Zeka Agent'larınız</Text>

        <View style={styles.cardContainer}>
          <Link href="/individual" asChild>
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={styles.cardIcon}>👤</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Bireysel Mod</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                Tek bir agent ile sohbet et
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/coordinate" asChild>
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={styles.cardIcon}>🤝</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Koordinatör Mod</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                Birden fazla agent koordine et
              </Text>
            </TouchableOpacity>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
  themeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  themeIcon: {
    fontSize: 20,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  cardContainer: {
    gap: 20,
  },
  card: {
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
});
