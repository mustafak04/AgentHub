import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from 'react';
import { ActivityIndicator, LogBox, StyleSheet, View } from 'react-native';
import { ThemeProvider } from './context/ThemeContext';

// ✅ Warning'leri sustur
LogBox.ignoreLogs([
  'This method is deprecated',
  '[Layout children]:',
  'migrating-to-v22',
]);

export default function RootLayout() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      console.log('Auth state değişti:', user?.email || 'Kullanıcı yok');
      setUser(user);
      setLoading(false);
    });
    return subscriber;
  }, []);

  useEffect(() => {
    if (loading) return;

    // @ts-ignore - Typed routes kontrolünü devre dışı bırak
    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) {
      console.log('Login sayfasına yönlendiriliyor...');
      // @ts-ignore
      router.replace('/login');
    } else if (user && inAuthGroup) {
      console.log('Ana sayfaya yönlendiriliyor...');
      // @ts-ignore
      router.replace('/');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* @ts-ignore */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        {/* @ts-ignore */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
