import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from './context/ThemeContext';

export default function LoginScreen() {
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('error');
  const [alertCallback, setAlertCallback] = useState<(() => void) | null>(null);

  const showAlert = (title: string, message: string, type: 'success' | 'error' = 'error', callback?: () => void) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertCallback(() => callback || null);
    setAlertVisible(true);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      showAlert('Hata', 'Lütfen tüm alanları doldurun', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert('Hata', 'Şifre en az 6 karakter olmalı', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Giriş
        await auth().signInWithEmailAndPassword(email, password);
        showAlert('Başarılı', 'Giriş yapıldı!', 'success', () => {
          // @ts-ignore
          router.replace('/');
        });
      } else {
        // Kayıt
        await auth().createUserWithEmailAndPassword(email, password);
        showAlert('Başarılı', 'Hesap oluşturuldu!', 'success', () => {
          // @ts-ignore
          router.replace('/');
        });
      }
    } catch (error: any) {
      console.error('Auth hatası:', error);

      // Kullanıcı dostu hata mesajları
      let errorMessage = 'Bir hata oluştu';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu email zaten kullanımda';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz email adresi';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Kullanıcı bulunamadı';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Hatalı şifre';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'İnternet bağlantınızı kontrol edin';
      }

      showAlert('Hata', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {
        backgroundColor: isDark ? '#0F172A' : '#EDF2F7'
      }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          {/* Theme Toggle - SAĞ ÜST */}
          <TouchableOpacity
            style={[styles.themeToggle, {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            }]}
            onPress={toggleTheme}
          >
            <MaterialCommunityIcons
              name={isDark ? 'white-balance-sunny' : 'weather-night'}
              size={26}
              color={isDark ? '#FCD34D' : '#6B7280'}
            />
          </TouchableOpacity>
          {/* Mascot Logo */}
          <Image
            source={require('../assets/images/robot_mascot.png')}
            style={styles.mascotImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, {
            color: isDark ? '#FFFFFF' : '#1F2937'
          }]}>
            AgentHub
          </Text>
          <Text style={[styles.subtitle, {
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6B7280'
          }]}>
            {isLogin ? 'Hesabına giriş yap' : 'Yeni hesap oluştur'}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Email Input with Icon */}
          <View style={[styles.inputContainer, {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#D1D5DB',
          }]}>
            <MaterialCommunityIcons
              name="email-outline"
              size={22}
              color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#9CA3AF'}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, {
                color: isDark ? '#FFFFFF' : '#1F2937',
              }]}
              placeholder="Email"
              placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Password Input with Icon */}
          <View style={[styles.inputContainer, {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#D1D5DB',
          }]}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={22}
              color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#9CA3AF'}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, {
                color: isDark ? '#FFFFFF' : '#1F2937',
              }]}
              placeholder="Password"
              placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled,
              isDark && {
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: '#06B6D4',
                shadowColor: '#06B6D4',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 12,
              },
              !isDark && {
                backgroundColor: '#3B82F6',
              }
            ]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={[styles.buttonText, {
              color: isDark ? '#06B6D4' : '#FFFFFF',
              fontSize: 18,
              fontWeight: 'bold',
            }]}>
              {loading ? 'Yükleniyor...' : (isLogin ? 'Login' : 'Sign Up')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsLogin(!isLogin)}
            disabled={loading}
          >
            <Text style={[styles.switchText, {
              color: isDark ? '#FFFFFF' : '#1F2937'
            }]}>
              {isLogin
                ? 'Sign Up'
                : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* GitHub Link */}
        <TouchableOpacity
          style={styles.githubContainer}
          onPress={() => Linking.openURL('https://github.com/mustafak04')}
        >
          <View style={[
            styles.githubIcon,
            {
              borderWidth: isDark ? 2 : 1,
              borderColor: isDark ? '#06B6D4' : '#1F2937',
              shadowColor: isDark ? '#06B6D4' : 'transparent',
              shadowOpacity: isDark ? 0.6 : 0,
              shadowRadius: isDark ? 8 : 0,
            }
          ]}>
            <AntDesign
              name="github"
              size={28}
              color={isDark ? '#06B6D4' : '#1F2937'}
            />
          </View>
          <Text style={[styles.developerCredit, {
            color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF',
          }]}>
            github.com/mustafak04
          </Text>
        </TouchableOpacity>

        {/* Custom Alert */}
        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          isDark={isDark}
          onClose={() => {
            setAlertVisible(false);
            if (alertCallback) {
              alertCallback();
            }
          }}
          buttons={[
            {
              text: 'Tamam',
              style: alertType === 'success' ? 'default' : 'destructive',
            },
          ]}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    // Dynamic in JSX
  },
  switchText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  githubContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  githubIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  developerCredit: {
    marginTop: 8,
    fontSize: 12,
  },
  themeToggle: {
    alignSelf: 'center',
    marginBottom: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    width: 140,
    height: 140,
    marginBottom: 2,
  },
});
