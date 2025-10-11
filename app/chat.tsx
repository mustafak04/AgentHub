import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Chat() {
    // URL'den gelen parametreleri al (agentId ve agentName)
    const { agentId, agentName } = useLocalSearchParams();
    
    // Mesajları saklamak için state
    const [messages, setMessages] = useState<{ id: string; text: string; sender: "user" | "agent" }[]>([]);
    const [inputText, setInputText] = useState("");

    // Mesaj gönderme fonksiyonu
     const sendMessage = () => {
        if (inputText.trim() === "") return; // Boş mesaj gönderme

        // Kullanıcı mesajını ekle
        const userMessage = { id: Date.now().toString(), text: inputText, sender: "user" as const };
        setMessages((prev) => [...prev, userMessage]);

        // AI cevabını simüle et (şimdilik sabit cevap, ileride API'den gelecek)
        setTimeout(() => {
            const agentMessage = { id: (Date.now() + 1).toString(), text: `${agentName} yanıtlıyor: "${inputText}" için çalışıyorum...`, sender: "agent" as const };
            setMessages((prev) => [...prev, agentMessage]);
        }, 1000);

        setInputText(""); // Input'u temizle
    };
    
    // Mesaj balonları
    const renderMessage = ({ item }: { item: typeof messages[0] }) => (
        <View style={[styles.messageBubble, item.sender === "user" ? styles.userBubble : styles.agentBubble]}>
            <Text style={styles.messageText}>{item.text}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
          <Text style={styles.header}>{agentName || "Koordine Mod"}</Text>
          
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
          />
    
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Mesajınızı yazın..."
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendButtonText}>Gönder</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: "#f5f5f5" },
        header: { fontSize: 20, fontWeight: "bold", textAlign: "center", paddingVertical: 16, backgroundColor: "#fff" },
        messageList: { paddingHorizontal: 16, paddingVertical: 8 },
        messageBubble: { maxWidth: "75%", padding: 12, borderRadius: 16, marginVertical: 4 },
        userBubble: { alignSelf: "flex-end", backgroundColor: "#007AFF" },
        agentBubble: { alignSelf: "flex-start", backgroundColor: "#E5E5EA" },
        messageText: { fontSize: 16, color: "#000" },
        inputContainer: { flexDirection: "row", padding: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#ddd" },
        input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
        sendButton: { backgroundColor: "#007AFF", borderRadius: 20, paddingHorizontal: 20, justifyContent: "center" },
        sendButtonText: { color: "#fff", fontWeight: "600" },
      });