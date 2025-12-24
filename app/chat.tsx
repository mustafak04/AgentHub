import auth from '@react-native-firebase/auth';
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  const [messages, setMessages] = useState<{ id: string; text: string; sender: "user" | "agent" }[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false); // Yükleniyor durumu
  const [loadingHistory, setLoadingHistory] = useState(true); // Geçmiş yükleniyor durumu

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
      if (response.data.success) {
        await saveChatMessage(chatId, 'ai', response.data.response);
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
      // User message - solid gradient bubble
      return (
        <View style={[styles.messageBubble, styles.userBubble]}>
          <Text style={[styles.messageText, { color: "#fff" }]}>{item.text}</Text>
        </View>
      );
    } else {
      // AI message - CSS glassmorphism bubble
      return (
        <View
          style={[
            styles.messageBubble,
            styles.agentBubble,
            {
              backgroundColor: isDark ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
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
          }}>
            {item.text}
          </Markdown>
        </View>
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.header, { color: colors.text }]}>{agentName || "Koordine Mod"}</Text>
        <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>🗑️ Temizle</Text>
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

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
          placeholder="Mesajınızı yazın..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          editable={!loading}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && { opacity: 0.5 }]}
          onPress={sendMessage}
          disabled={loading}
        >
          <Text style={styles.sendButtonText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  headerContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#ddd" },
  header: { fontSize: 20, fontWeight: "bold" },
  clearButton: { padding: 8 },
  clearButtonText: { fontSize: 14, color: "#FF3B30" },
  messageList: { paddingHorizontal: 16, paddingVertical: 8 },
  messageBubble: { maxWidth: "75%", padding: 12, borderRadius: 16, marginVertical: 4 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#007AFF" },
  agentBubble: { alignSelf: "flex-start", backgroundColor: "#E5E5EA" },
  messageText: { fontSize: 16, color: "#000" },
  loadingContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  loadingText: { marginLeft: 8, color: "#007AFF" },
  inputContainer: { flexDirection: "row", padding: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#ddd" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, maxHeight: 100 },
  sendButton: { backgroundColor: "#007AFF", borderRadius: 20, paddingHorizontal: 20, justifyContent: "center" },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
