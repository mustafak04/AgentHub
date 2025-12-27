import auth from '@react-native-firebase/auth';
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Markdown from 'react-native-markdown-display';
import { clearChatHistory as clearFirestoreChatHistory, loadChatHistory, saveChatMessage, subscribeToChatUpdates } from '../services/chatService';
import { useTheme } from './context/ThemeContext';

// Backend URL'si
const BACKEND_URL = "https://agenthub-phi.vercel.app";

export default function Chat() {
  const { colors, isDark } = useTheme();
  // URL'den gelen parametreleri al (agentId ve agentName)
  const { agentId, agentName } = useLocalSearchParams();

  const userId = auth().currentUser?.uid;

  // Mesajları saklamak için state
  const [messages, setMessages] = useState<{ id: string; text: string; sender: "user" | "agent"; fullText?: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false); // Yükleniyor durumu
  const [loadingHistory, setLoadingHistory] = useState(true); // Geçmiş yükleniyor durumu
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const chatId = agentId as string; // Chat ID = agent ID

  // Uygulama açıldığında sohbet geçmişini yükle ve gerçek zamanlı listener kur
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeChat = async () => {
      try {
        // İlk geçmişi yükle
        const history = await loadChatHistory(chatId);
        const formattedMessages = history.map(msg => ({
          id: msg.id,
          text: msg.content,
          fullText: msg.fullText,
          sender: msg.role === 'user' ? 'user' as const : 'agent' as const
        }));
        setMessages(formattedMessages);
        setLoadingHistory(false);

        // Gerçek zamanlı listener kur
        unsubscribe = subscribeToChatUpdates(chatId, (updatedMessages) => {
          const formatted = updatedMessages.map(msg => ({
            id: msg.id,
            text: msg.content,
            sender: msg.role === 'user' ? 'user' as const : 'agent' as const
          }));
          setMessages(formatted);
        });
      } catch (error) {
        console.error('Chat başlatma hatası:', error);
        setLoadingHistory(false);
      }
    };

    initializeChat();

    // Cleanup: listener'ı kapat
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chatId]);

  // Sohbet geçmişini temizle
  const clearHistory = async () => {
    try {
      await clearFirestoreChatHistory(chatId);
      setMessages([]);
      console.log('🗑️ Sohbet geçmişi temizlendi');
    } catch (error) {
      console.error('Sohbet geçmişi temizleme hatası:', error);
    }
  };

  // Mesaj gönderme fonksiyonu
  const sendMessage = async () => {
    if (inputText.trim() === "") return; // Boş mesaj gönderme

    const currentInput = inputText;
    setInputText(""); // Input'u hemen temizle
    setLoading(true); // Yükleniyor göster

    try {
      // Kullanıcı mesajını Firestore'a kaydet
      await saveChatMessage(chatId, 'user', currentInput);

      // Backend'e istek gönder
      const response = await axios.post(`${BACKEND_URL}/api/agent`, {
        agentId: agentId,
        agentName: agentName,
        userMessage: currentInput,
      });

      // AI cevabını Firestore'a kaydet
      if (response.data.success || response.data.reply) {
        const fullResponse = response.data.reply || response.data.response; // Fallback just in case

        let summary = "";
        let fullText = fullResponse;

        // <OZET> etiketlerini kontrol et
        const ozetMatch = fullResponse.match(/<OZET>(.*?)<\/OZET>/s);
        if (ozetMatch) {
          summary = ozetMatch[1].trim();
          // Full text'ten etiketleri temizle ama içeriği koru
          fullText = fullResponse.replace(/<OZET>|<\/OZET>/g, '').trim();
        } else {
          // Etiket yoksa eski mantık: İlk satırı özet olarak al
          const lines = fullResponse.split('\n');
          if (lines.length > 0) {
            summary = lines[0];
            // Eğer ilk satır boşsa veya çok kısaysa ikinci satıra bakabiliriz
            if (summary.trim().length < 5 && lines.length > 1) {
              summary = lines[1];
            }
          }
        }

        let contentToSave = summary || fullResponse;
        let fullTextToSave = fullText || fullResponse;

        // Eğer özet ve detay aynıysa, detay kaydetmeye gerek yok (UI'da sadece text gösterilir)
        if (contentToSave === fullTextToSave) {
          fullTextToSave = undefined;
        }

        await saveChatMessage(chatId, 'ai', contentToSave, fullTextToSave);
      } else {
        throw new Error("API hatası");
      }
    } catch (error) {
      console.error("Hata:", error);
      // Hata mesajını Firestore'a kaydet
      await saveChatMessage(chatId, 'ai', "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false); // Yükleniyor gizle
    }
  };

  // Mesaj balonları
  const renderMessage = ({ item }: { item: typeof messages[0] }) => {
    if (item.sender === "user") {
      return (
        <View style={[
          styles.messageBubble,
          styles.userBubble,
          {
            backgroundColor: isDark ? 'transparent' : '#60A5FA',
            borderWidth: isDark ? 2 : 0,
            borderColor: isDark ? '#06B6D4' : 'transparent',
            shadowColor: isDark ? '#06B6D4' : '#000',
            shadowOffset: { width: 0, height: isDark ? 0 : 2 },
            shadowOpacity: isDark ? 0.8 : 0.1,
            shadowRadius: isDark ? 8 : 4,
            elevation: isDark ? 0 : 2,
          }
        ]}>
          <Text style={[styles.messageText, {
            color: isDark ? '#06B6D4' : '#FFFFFF',
            fontWeight: isDark ? '500' : 'normal'
          }]}>
            {item.text}
          </Text>
        </View>
      );
    } else {
      // AI mesajı - Avatar + Genişletilebilir Balon
      const isExpanded = expandedMessages.has(item.id);
      const toggleExpand = () => {
        setExpandedMessages(prev => {
          const newSet = new Set(prev);
          if (newSet.has(item.id)) {
            newSet.delete(item.id);
          } else {
            newSet.add(item.id);
          }
          return newSet;
        });
      };
      return (
        <View style={styles.aiMessageRow}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image source={require('../assets/images/robot_mascot.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
          </View>
          {/* Message Bubble */}
          <TouchableOpacity
            onPress={toggleExpand}
            activeOpacity={0.7}
            style={[
              styles.messageBubble,
              styles.agentBubble,
              {
                backgroundColor: isDark ? 'rgba(55, 65, 81, 0.8)' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.1,
                shadowRadius: 4,
                elevation: isDark ? 0 : 3,
              }
            ]}
          >
            <Markdown style={{
              body: { color: colors.text, fontSize: 16 },
              code_inline: { backgroundColor: colors.input, color: '#d63384', fontFamily: 'monospace' },
              code_block: { backgroundColor: colors.input, padding: 10, borderRadius: 5, fontFamily: 'monospace' },
              fence: { backgroundColor: colors.input, padding: 10, borderRadius: 5, fontFamily: 'monospace' },
              heading1: { fontSize: 20, fontWeight: 'bold', color: colors.text },
              strong: { fontWeight: 'bold' },
              em: { fontStyle: 'italic' },
            }}
              onLinkPress={(url) => {
                Linking.openURL(url).catch(err => console.error("Link açılamadı:", err));
                return false;
              }}>
              {isExpanded && item.fullText ? item.fullText : item.text}
            </Markdown>
            {item.fullText && item.fullText !== item.text && (
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
                {isExpanded ? '👆 Özet için dokun' : '👇 Detaylar için dokun'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {
        backgroundColor: isDark ? '#0F172A' : '#F7FAFC'
      }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Modern Header */}
      <View style={[
        styles.headerContainer,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        }
      ]}>
        {/* Geri Butonu */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          }]}
        >
          <Text style={[styles.backIcon, { color: isDark ? '#FFF' : '#000' }]}>‹</Text>
        </TouchableOpacity>
        {/* Agent Info (Orta) */}
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#1F2937' }]}>
            {agentName || "AI Agent"}
          </Text>
        </View>
        {/* Temizle Butonu (Sağ) */}
        <TouchableOpacity
          onPress={clearHistory}
          style={[styles.clearButton, {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          }]}
        >
          <Text style={[styles.clearText, { color: isDark ? '#06B6D4' : '#3B82F6' }]}>Temizle</Text>
        </TouchableOpacity>
      </View>


      {loadingHistory ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Sohbet geçmişi yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          inverted={false}
        />
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>AI düşünüyor...</Text>
        </View>
      )}

      {/* Input Container */}
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        }
      ]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
              color: isDark ? '#FFFFFF' : '#1F2937',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#D1D5DB',
            }
          ]}
          placeholder="Mesajınızı yazın..."
          placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF'}
          value={inputText}
          onChangeText={setInputText}
          editable={!loading}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            loading && { opacity: 0.5 },
            {
              backgroundColor: isDark ? '#06B6D4' : '#3B82F6',
              shadowColor: isDark ? '#06B6D4' : '#3B82F6',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isDark ? 0.8 : 0.3,
              shadowRadius: isDark ? 12 : 4,
              elevation: isDark ? 0 : 3,
            }
          ]}
          onPress={sendMessage}
          disabled={loading}
        >
          <Text style={styles.sendButtonIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  clearText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Messages
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 14,
    borderRadius: 18,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
  },
  agentBubble: {
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  aiMessageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 4
  },

  // Avatar
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarIcon: {
    fontSize: 18,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8
  },
  loadingText: {
    marginLeft: 8,
    color: "#007AFF"
  },

  // Input
  inputContainer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 120,
    fontSize: 16,
  },

  // Send Button
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonIcon: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
});
