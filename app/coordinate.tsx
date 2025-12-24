import axios from "axios";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Markdown from 'react-native-markdown-display';
import { clearChatHistory as clearFirestoreChatHistory, loadChatHistory, saveChatMessage, subscribeToChatUpdates } from '../services/chatService';
import { useTheme } from './context/ThemeContext';


const BACKEND_URL = "https://agenthub-phi.vercel.app";
const CHAT_ID = "coordinate"; // Coordina mode için sabit chat ID

export default function Coordinate() {
  const { colors, isDark } = useTheme();
  const [messages, setMessages] = useState<{ id: string; text: string; sender: "user" | "agent"; fullText?: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true); // Geçmiş yükleniyor durumu
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  // Markdown stilleri - colors ve isDark'a erişmek için component içinde
  const markdownStyles = {
    body: {
      color: colors.text,
      fontSize: 16,
    },
    strong: {
      fontWeight: 'bold' as const,
    },
    em: {
      fontStyle: 'italic' as const,
    },
    code_inline: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
    },
  };

  // Uygulama açıldığında sohbet geçmişini yükle ve gerçek zamanlı listener kur
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeChat = async () => {
      try {
        // İlk geçmişi yükle
        const history = await loadChatHistory(CHAT_ID);
        const formattedMessages = history.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.role === 'user' ? 'user' as const : 'agent' as const
        }));
        setMessages(formattedMessages);
        setLoadingHistory(false);

        // Gerçek zamanlı listener kur
        unsubscribe = subscribeToChatUpdates(CHAT_ID, (updatedMessages) => {
          const formatted = updatedMessages.map(msg => ({
            id: msg.id,
            text: msg.content,
            sender: msg.role === 'user' ? 'user' as const : 'agent' as const
          }));
          setMessages(formatted);
        });
      } catch (error) {
        console.error('Coordinate chat başlatma hatası:', error);
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
  }, []);

  // Sohbet geçmişini temizle
  const clearHistory = async () => {
    try {
      await clearFirestoreChatHistory(CHAT_ID);
      setMessages([]);
      console.log('🗑️ Koordine sohbet geçmişi temizlendi');
    } catch (error) {
      console.error('Sohbet geçmişi temizleme hatası:', error);
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === "") return;

    const currentInput = inputText;
    setInputText("");
    setLoading(true);

    try {
      // Kullanıcı mesajını Firestore'a kaydet
      await saveChatMessage(CHAT_ID, 'user', currentInput);

      const response = await axios.post(`${BACKEND_URL}/api/coordinate`, {
        userMessage: currentInput,
      });

      // AI cevabını işle ve Firestore'a kaydet
      if (response.data.success) {
        const fullResponse = response.data.response;

        // Koordinatör başlığını çıkar
        const withoutHeader = fullResponse.replace(/🤝 \*\*Koordinatör Sonucu\*\*\n\n/, '');

        // --- ile ayrılmış adımları ayır
        const steps = withoutHeader.split('---').map((s: string) => s.trim()).filter((s: string) => s.length > 0);

        // Her adımı ayrı mesaj olarak kaydet
        for (const step of steps) {
          await saveChatMessage(CHAT_ID, 'ai', step);
        }
      }
    } catch (error) {
      console.error("Hata:", error);
      // Hata mesajını Firestore'a kaydet
      await saveChatMessage(CHAT_ID, 'ai', "Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: typeof messages[0] }) => {
    if (item.sender === "user") {
      return (
        <View style={[styles.messageBubble, styles.userBubble]}>
          <Markdown style={markdownStyles}>{item.text}</Markdown>
        </View>
      );
    } else {
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
        <TouchableOpacity
          onPress={toggleExpand}
          activeOpacity={0.7}
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
          <Markdown style={markdownStyles}>{isExpanded && item.fullText ? item.fullText : item.text}</Markdown>
          {item.fullText && item.fullText !== item.text && (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
              {isExpanded ? '👆 Özet için dokun' : '👇 Detaylar için dokun'}
            </Text>
          )}
        </TouchableOpacity>
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
        <Text style={[styles.header, { color: colors.text }]}>🤝 Koordine Mod</Text>
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
        />
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>AI koordine ediyor...</Text>
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
  container: { flex: 1 },
  headerContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  header: { fontSize: 20, fontWeight: "bold" },
  clearButton: { padding: 12, minWidth: 50, alignItems: 'center', justifyContent: 'center' },
  clearButtonText: { fontSize: 24, color: "#FF3B30" },
  messageList: { paddingHorizontal: 16, paddingVertical: 8 },
  messageBubble: { maxWidth: "75%", padding: 12, borderRadius: 16, marginVertical: 4 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#007AFF" },
  agentBubble: { alignSelf: "flex-start", overflow: 'hidden' },
  messageText: { fontSize: 16 },
  loadingContainer: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  loadingText: { marginLeft: 8, color: "#007AFF" },
  inputContainer: { flexDirection: "row", padding: 16, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, maxHeight: 100 },
  sendButton: { backgroundColor: "#007AFF", borderRadius: 20, paddingHorizontal: 20, justifyContent: "center" },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
