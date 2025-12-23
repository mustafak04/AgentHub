import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "./context/ThemeContext";

const agents = [
  { id: "1", name: "Hava Durumu Agent", description: "Hava durumu bilgisi sağlar", emoji: "🌤️", color: "#FF9500", category: "basic" },
  { id: "2", name: "Hesap Makinesi Agent", description: "Matematiksel hesaplamalar yapar", emoji: "🔢", color: "#5856D6", category: "basic" },
  { id: "3", name: "Çeviri Agent", description: "Diller arası çeviri yapar", emoji: "🌍", color: "#32ADE6", category: "basic" },
  { id: "4", name: "Haber Agent", description: "Güncel haberleri getirir", emoji: "📰", color: "#FF2D55", category: "basic" },
  { id: '5', name: 'Wikipedia Agent', description: "Wikipedia özeti sağlar", emoji: '📚', color: '#9013FE', category: "basic" },
  { id: '6', name: 'Döviz Agent', description: "Döviz kurlarını gösterir", emoji: '💰', color: '#FF9500', category: "basic" },
  { id: '7', name: 'Kod Asistan Agent', description: "Kod yazar, debug yapar, açıklar", emoji: '💻', color: '#34C759', category: "ai" },
  { id: '8', name: 'Görsel Agent', description: "Metinden görsel oluşturur", emoji: '🎨', color: '#FF6B6B', category: "ai" },
  { id: '9', name: 'YouTube Agent', description: "Video arar, önerir", emoji: '🎬', color: '#FF0000', category: "info" },
  { id: '10', name: 'Kitap Öneri Agent', description: "Kitap ara, oku", emoji: '📚', color: '#8E44AD', category: "info" },
  { id: '11', name: 'Özet Agent', description: "Makale/URL özetler", emoji: '📝', color: '#3498DB', category: "info" },
  { id: '12', name: 'Sözlük Agent', description: "Kelime anlamı bulur, açıklar", emoji: '📖', color: '#E74C3C', category: "info" },
  { id: '13', name: 'Film/Dizi Agent', description: "Film ve dizi arar, önerir", emoji: '🎬', color: '#F39C12', category: "entertainment" },
  { id: '14', name: 'Müzik Agent', description: "Sanatçı ve şarkı arar", emoji: '🎵', color: '#9B59B6', category: "entertainment" },
  { id: '15', name: 'Podcast Agent', description: "Podcast arar, önerir", emoji: '🎙️', color: '#E67E22', category: "entertainment" },
  { id: '16', name: 'Oyun Agent', description: "Oyun arar, bilgi verir", emoji: '🎮', color: '#16A085', category: "entertainment" },
  { id: '17', name: 'Yemek Agent', description: "Tarif arar, önerir", emoji: '🍳', color: '#E74C3C', category: "health" },
  { id: '18', name: 'Fitness Agent', description: "Antrenman planı, egzersiz önerir", emoji: '💪', color: '#27AE60', category: "health" },
  { id: '19', name: 'Motivasyon Agent', description: "İlham verir, cesaretlendirir", emoji: '🌟', color: '#F39C12', category: "health" },
  { id: '20', name: 'QR Kod Agent', description: "QR kod oluşturur", emoji: '📱', color: '#34495E', category: "tools" },
  { id: '21', name: 'IP Agent', description: "IP konum bilgisi verir", emoji: '🌍', color: '#2C3E50', category: "tools" },
  { id: '22', name: 'Rastgele Seçici Agent', description: "Listeden rastgele seçer", emoji: '🎲', color: '#8E44AD', category: "tools" },
  { id: '23', name: 'Crypto Agent', description: "Kripto para fiyatlarını gösterir", emoji: '₿', color: '#F7931A', category: "tools" },
  { id: '24', name: 'Futbol Agent', description: "Futbol maç skorlarını gösterir", emoji: '⚽', color: '#27AE60', category: "tools" },
];

const categories = [
  { id: 'basic', name: 'Temel', emoji: '🔧', color: '#3498DB' },
  { id: 'ai', name: 'AI & Kod', emoji: '🤖', color: '#9B59B6' },
  { id: 'info', name: 'Bilgi', emoji: '📚', color: '#E67E22' },
  { id: 'entertainment', name: 'Eğlence', emoji: '🎬', color: '#E74C3C' },
  { id: 'health', name: 'Sağlık', emoji: '💪', color: '#27AE60' },
  { id: 'tools', name: 'Araçlar', emoji: '🛠️', color: '#34495E' },
];

export default function Individual() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Kategori toggle
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  // Filtreleme
  const filteredAgents = agents.filter(agent => {
    // Kategori filtresi (boşsa tümü)
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(agent.category);

    // Arama filtresi
    const searchMatch = searchQuery === '' ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const renderAgentCard = ({ item }: { item: typeof agents[0] }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 4, backgroundColor: colors.card }]}
      onPress={() => {
        router.push(`/chat?agentId=${item.id}&agentName=${item.name}`);
      }}
    >
      <Text style={styles.emoji}>{item.emoji}</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.agentName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.agentDescription, { color: colors.textSecondary }]}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>👤 Agent Listesi</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {filteredAgents.length} agent {searchQuery || selectedCategories.length > 0 ? 'bulundu' : 'mevcut'}
      </Text>





      {/* Arama Çubuğu - CSS Glassmorphism */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: isDark ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          }
        ]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Agent ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={[styles.clearButton, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Kategori Butonları */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScrollView}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map(category => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                { backgroundColor: isSelected ? category.color : colors.buttonBackground }
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={[styles.categoryText, { color: isSelected ? '#fff' : colors.buttonText }]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Agent Listesi */}
      <FlatList
        data={filteredAgents}
        renderItem={renderAgentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>🔍 Sonuç bulunamadı</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Farklı bir arama deneyin</Text>
          </View>
        }
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 0,
  },
  themeToggle: {
    padding: 8,
  },
  themeIcon: {
    fontSize: 28,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    fontSize: 18,
    color: '#999',
    padding: 4,
  },
  categoryScrollView: {
    marginBottom: 12,
    height: 52,
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 110,
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
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
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
});
