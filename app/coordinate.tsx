import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const BACKEND_URL = "http://192.168.92.1:3000";
const STORAGE_KEY = "chat_history_coordinate";
export default function Coordinate() {
  const [messages, setMessages] = useState<{ id: string; text: string; sender: "user" | "agent" }[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

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
        console.log('✅ Koordine sohbet geçmişi yüklendi');
      }
    } catch (error) {
      console.error('Sohbet geçmişi yükleme hatası:', error);
    }
  };

  // Sohbet geçmişini kaydet
  const saveChatHistory = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      console.log('💾 Koordine sohbet geçmişi kaydedildi');
    } catch (error) {
      console.error('Sohbet geçmişi kaydetme hatası:', error);
    }
  };

  // Sohbet geçmişini temizle
  const clearChatHistory = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setMessages([]);
      console.log('🗑️ Koordine sohbet geçmişi temizlendi');
    } catch (error) {
      console.error('Sohbet geçmişi temizleme hatası:', error);
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === "") return;

    const userMessage = { id: Date.now().toString(), text: inputText, sender: "user" as const };
    setMessages((prev) => [...prev, userMessage]);

    const currentInput = inputText;
    setInputText("");
    setLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/coordinate`, {
        userMessage: currentInput,
      });

      if (response.data.success) {
        const agentMessage = {
          id: (Date.now() + 1).toString(),
          text: response.data.response,
          sender: "agent" as const,
        };
        setMessages((prev) => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error("Hata:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Bir hata oluştu. Lütfen tekrar deneyin.",
        sender: "agent" as const,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const renderMessage = ({ item }: { item: typeof messages[0] }) => (
    <View style={[styles.messageBubble, item.sender === "user" ? styles.userBubble : styles.agentBubble]}>
      <Text style={[styles.messageText, item.sender === "user" && { color: "#fff" }]}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.header}>🤝 Koordine Mod</Text>
        <TouchableOpacity onPress={clearChatHistory} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>🗑️ Temizle</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={messages} 
        renderItem={renderMessage} 
        keyExtractor={(item) => item.id} 
        contentContainerStyle={styles.messageList} 
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>AI koordine ediyor...</Text>
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
