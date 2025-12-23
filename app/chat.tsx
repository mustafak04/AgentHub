import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Markdown from 'react-native-markdown-display';

// Backend URL'si
const BACKEND_URL = "https://agenthub-phi.vercel.app";
export default function Chat() {
  // URL'den gelen parametreleri al (agentId ve agentName)
  const { agentId, agentName } = useLocalSearchParams();

  const userId = auth().currentUser?.uid;

  // Mesajları saklamak için state
  const [messages, setMessages] = useState<{ id: string; text: string; sender: "user" | "agent" }[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false); // Yükleniyor durumu

  // Kullanıcı bazlı sohbet geçmişi anahtarı
  const STORAGE_KEY = `user_${userId}_chat_history_agent_${agentId}`;

  // Uygulama açıldığında sohbet geçmişini yükle
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Mesajlar değiştiğinde otomatik kaydet
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory();
    }
  }, [messages]);

  // Sohbet geçmişini yükle
  const loadChatHistory = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedMessages !== null) {
        setMessages(JSON.parse(savedMessages));
        console.log('✅ Sohbet geçmişi yüklendi');
      }
    } catch (error) {
      console.error('Sohbet geçmişi yükleme hatası:', error);
    }
  };

  // Sohbet geçmişini kaydet
  const saveChatHistory = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      console.log('💾 Sohbet geçmişi kaydedildi');
    } catch (error) {
      console.error('Sohbet geçmişi kaydetme hatası:', error);
    }
  };

  // Sohbet geçmişini temizle
  const clearChatHistory = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setMessages([]);
      console.log('🗑️ Sohbet geçmişi temizlendi');
    } catch (error) {
      console.error('Sohbet geçmişi temizleme hatası:', error);
    }
  };

  // Mesaj gönderme fonksiyonu
  const sendMessage = async () => {
    if (inputText.trim() === "") return; // Boş mesaj gönderme

    // Kullanıcı mesajını ekle
    const userMessage = { id: Date.now().toString(), text: inputText, sender: "user" as const };
    setMessages((prev) => [...prev, userMessage]);

    const currentInput = inputText;
    setInputText(""); // Input'u hemen temizle
    setLoading(true); // Yükleniyor göster

    try {
      // Backend'e istek gönder
      const response = await axios.post(`${BACKEND_URL}/api/agent`, {
        agentId: agentId,
        agentName: agentName,
        userMessage: currentInput,
      });

      // AI cevabını ekle
      if (response.data.success) {
        const agentMessage = {
          id: (Date.now() + 1).toString(),
          text: response.data.response,
          sender: "agent" as const,
        };
        setMessages((prev) => [...prev, agentMessage]);
      } else {
        throw new Error("API hatası");
      }
    } catch (error) {
      console.error("Hata:", error);
      // Hata mesajı göster
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        sender: "agent" as const,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false); // Yükleniyor gizle
    }
  };

  // Mesaj balonları
  const renderMessage = ({ item }: { item: typeof messages[0] }) => (
    <View style={[styles.messageBubble, item.sender === "user" ? styles.userBubble : styles.agentBubble]}>
      {item.sender === "user" ? (
        <Text style={[styles.messageText, { color: "#fff" }]}>{item.text}</Text>
      ) : (
        <Markdown style={{
          body: { color: '#000', fontSize: 16 },
          code_inline: { backgroundColor: '#f0f0f0', color: '#d63384', fontFamily: 'monospace' },
          code_block: { backgroundColor: '#f8f9fa', padding: 10, borderRadius: 5, fontFamily: 'monospace' },
          fence: { backgroundColor: '#f8f9fa', padding: 10, borderRadius: 5, fontFamily: 'monospace' },
          heading1: { fontSize: 20, fontWeight: 'bold' },
          strong: { fontWeight: 'bold' },
          em: { fontStyle: 'italic' },
        }}>
          {item.text}
        </Markdown>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{agentName || "Koordine Mod"}</Text>
        <TouchableOpacity onPress={clearChatHistory} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>🗑️ Temizle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        inverted={false}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>AI düşünüyor...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Mesajınızı yazın..."
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