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
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : '#FFFFFF',
          borderWidth: isDark ? 2 : 1,
          borderColor: isDark ? '#06B6D4' : 'rgba(0, 0, 0, 0.05)',
          shadowColor: isDark ? '#06B6D4' : '#000',
          shadowOffset: { width: 0, height: isDark ? 0 : 2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: isDark ? 8 : 4,
          elevation: isDark ? 0 : 2,
        }
      ]}
      onPress={() => {
        router.push(`/chat?agentId=${item.id}&agentName=${item.name}`);
      }}
    >
      <Text style={styles.emoji}>{item.emoji}</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.agentName, {
          color: isDark ? '#FFFFFF' : '#1F2937',
          fontWeight: '600',
          fontSize: 15,
        }]}>
          {item.name}
        </Text>
        <Text style={[styles.agentDescription, {
          color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6B7280',
          fontSize: 12,
        }]} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? '#0F172A' : '#F7FAFC'
    }]}>
      <Text style={[styles.title, {
        color: isDark ? '#FFFFFF' : '#1F2937',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
      }]}>
        Agent Listesi
      </Text>
      <Text style={[styles.subtitle, {
        color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6B7280',
        fontSize: 14,
      }]}>
        {filteredAgents.length} Agent
      </Text>

      {/* Arama Çubuğu - CSS Glassmorphism */}
      <View style={[
        styles.searchContainer,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 4,
        }
      ]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, {
            color: isDark ? '#FFFFFF' : '#1F2937'
          }]}
          placeholder="Agent ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF'}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={[styles.clearButton, {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6B7280'
            }]}>✕</Text>
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
                {
                  backgroundColor: isSelected
                    ? (isDark ? '#06B6D4' : '#3B82F6')
                    : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6'),
                  borderWidth: isSelected && isDark ? 1 : 0,
                  borderColor: isSelected && isDark ? '#06B6D4' : 'transparent',
                  shadowColor: isSelected && isDark ? '#06B6D4' : '#000',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isSelected && isDark ? 0.6 : 0,
                  shadowRadius: isSelected && isDark ? 8 : 0,
                }
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={[styles.categoryText, {
                color: isSelected
                  ? '#FFFFFF'
                  : (isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7280')
              }]}>
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
        numColumns={2}  // 2-column grid
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  title: {
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  clearButton: {
    fontSize: 18,
    padding: 4,
  },
  categoryScrollView: {
    marginBottom: 16,
    height: 48,
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryContainer: {
    paddingRight: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    maxWidth: '48%',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 10,
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  agentName: {
    marginBottom: 4,
    textAlign: 'center',
  },
  agentDescription: {
    textAlign: 'center',
    lineHeight: 16,
  },
});
