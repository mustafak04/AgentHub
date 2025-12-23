import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const agents = [
  { id: "1", name: "Hava Durumu Agent", description: "Hava durumu bilgisi sağlar", emoji: "🌤️", color: "#FF9500" },
  { id: "2", name: "Hesap Makinesi Agent", description: "Matematiksel hesaplamalar yapar", emoji: "🔢", color: "#5856D6" },
  { id: "3", name: "Çeviri Agent", description: "Diller arası çeviri yapar", emoji: "🌍", color: "#32ADE6" },
  { id: "4", name: "Haber Agent", description: "Güncel haberleri getirir", emoji: "📰", color: "#FF2D55" },
  { id: '5', name: 'Wikipedia Agent', description: "Wikipedia özeti sağlar", emoji: '📚', color: '#9013FE' },
  { id: '6', name: 'Döviz Agent', description: "Döviz kurlarını gösterir", emoji: '💰', color: '#FF9500' },
  { id: '7', name: 'Kod Asistanı', description: "Kod yaz, debug yap, açıkla", emoji: '💻', color: '#34C759' },
  { id: '8', name: 'AI Görsel', description: "Metinden görsel oluştur", emoji: '🎨', color: '#FF6B6B' },
  { id: '9', name: 'YouTube Arama', description: "Video ara, izle", emoji: '🎬', color: '#FF0000' },
];

export default function Individual() {
  const router = useRouter();

  // Her bir agent için kart tasarımı
  const renderAgentCard = ({ item }: { item: typeof agents[0] }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 4 }]}
      onPress={() => {
        router.push(`/chat?agentId=${item.id}&agentName=${item.name}`);
      }}
    >
      <Text style={styles.emoji}>{item.emoji}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.agentName}>{item.name}</Text>
        <Text style={styles.agentDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Agent Listesi</Text>
      <Text style={styles.subtitle}>Çalışmak istediğin agenti seç</Text>
      <FlatList
        data={agents}
        renderItem={renderAgentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  emoji: {
    fontSize: 40,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1a1a1a",
  },
  agentDescription: {
    fontSize: 14,
    color: "#666",
  },
});