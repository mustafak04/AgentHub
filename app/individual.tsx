import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "./context/ThemeContext";

const agents = [
  { id: "1", name: "Hava Durumu Agent", description: "Hava durumu bilgisi sağlar", icon: "weather-partly-cloudy", color: "#FF9500", category: "basic" },
  { id: "2", name: "Hesap Makinesi Agent", description: "Matematiksel hesaplamalar yapar", icon: "calculator", color: "#5856D6", category: "basic" },
  { id: "3", name: "Çeviri Agent", description: "Diller arası çeviri yapar", icon: "translate", color: "#32ADE6", category: "basic" },
  { id: "4", name: "Haber Agent", description: "Güncel haberleri getirir", icon: "newspaper-variant-outline", color: "#FF2D55", category: "basic" },
  { id: '5', name: 'Wikipedia Agent', description: "Wikipedia özeti sağlar", icon: 'wikipedia', color: '#9013FE', category: "basic" },
  { id: '6', name: 'Döviz Agent', description: "Döviz kurlarını gösterir", icon: 'currency-usd', color: '#FF9500', category: "basic" },
  { id: '7', name: 'Kod Asistan Agent', description: "Kod yazar, debug yapar, açıklar", icon: 'code-tags', color: '#34C759', category: "ai" },
  { id: '8', name: 'Görsel Agent', description: "Metinden görsel oluşturur", icon: 'palette-outline', color: '#FF6B6B', category: "ai" },
  { id: '9', name: 'YouTube Agent', description: "Video arar, önerir", icon: 'youtube', color: '#FF0000', category: "info" },
  { id: '10', name: 'Kitap Öneri Agent', description: "Kitap ara, oku", icon: 'library-shelves', color: '#8E44AD', category: "info" },
  { id: '11', name: 'Özet Agent', description: "Makale/URL özetler", icon: 'text-box-check-outline', color: '#3498DB', category: "info" },
  { id: '12', name: 'Sözlük Agent', description: "Kelime anlamı bulur, açıklar", icon: 'book-alphabet', color: '#E74C3C', category: "info" },
  { id: '13', name: 'Film/Dizi Agent', description: "Film ve dizi arar, önerir", icon: 'filmstrip', color: '#F39C12', category: "entertainment" },
  { id: '14', name: 'Müzik Agent', description: "Sanatçı ve şarkı arar", icon: 'music-note', color: '#9B59B6', category: "entertainment" },
  { id: '15', name: 'Podcast Agent', description: "Podcast arar, önerir", icon: 'microphone-variant', color: '#E67E22', category: "entertainment" },
  { id: '16', name: 'Oyun Agent', description: "Oyun arar, bilgi verir", icon: 'controller-classic-outline', color: '#16A085', category: "entertainment" },
  { id: '17', name: 'Yemek Agent', description: "Tarif arar, önerir", icon: 'silverware-fork-knife', color: '#E74C3C', category: "health" },
  { id: '18', name: 'Fitness Agent', description: "Antrenman planı, egzersiz önerir", icon: 'weight-lifter', color: '#27AE60', category: "health" },
  { id: '19', name: 'Motivasyon Agent', description: "İlham verir, cesaretlendirir", icon: 'auto-fix', color: '#F39C12', category: "health" },
  { id: '20', name: 'QR Kod Agent', description: "QR kod oluşturur", icon: 'qrcode-scan', color: '#34495E', category: "tools" },
  { id: '21', name: 'IP Agent', description: "IP konum bilgisi verir", icon: 'ip-network-outline', color: '#2C3E50', category: "tools" },
  { id: '22', name: 'Rastgele Seçici Agent', description: "Listeden rastgele seçer", icon: 'dice-multiple-outline', color: '#8E44AD', category: "tools" },
  { id: '23', name: 'Crypto Agent', description: "Kripto para fiyatlarını gösterir", icon: 'bitcoin', color: '#F7931A', category: "tools" },
  { id: '24', name: 'Futbol Agent', description: "Futbol maç skorlarını gösterir", icon: 'soccer', color: '#27AE60', category: "tools" },
];

const categories = [
  { id: 'basic', name: 'Temel', icon: 'hammer-wrench', color: '#3498DB' },
  { id: 'ai', name: 'AI & Kod', icon: 'robot-outline', color: '#9B59B6' },
  { id: 'info', name: 'Bilgi', icon: 'book-open-variant', color: '#E67E22' },
  { id: 'entertainment', name: 'Eğlence', icon: 'movie-open-outline', color: '#E74C3C' },
  { id: 'health', name: 'Sağlık', icon: 'heart-pulse', color: '#27AE60' },
  { id: 'tools', name: 'Araçlar', icon: 'tools', color: '#34495E' },
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
      style={styles.card}
      onPress={() => {
        router.push(`/chat?agentId=${item.id}&agentName=${item.name}`);
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <MaterialCommunityIcons
          name={item.icon as any}
          size={32}
          color={item.color}
        />
      </View>
      <Text style={[styles.agentName, {
        color: isDark ? '#FFFFFF' : '#1F2937',
      }]} numberOfLines={2}>
        {item.name.replace(' Agent', '')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? '#0F172A' : '#EDF2F7'
    }]}>
      {/* Header */}
      <View style={[styles.headerContainer, {
        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      }]}>
        {/* Geri Butonu */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          }]}
        >
          <Text style={[styles.backIcon, { color: isDark ? '#FFF' : '#000' }]}>‹</Text>
        </TouchableOpacity>

        {/* Başlık (Orta) */}
        <Text style={[styles.title, {
          color: isDark ? '#FFFFFF' : '#1F2937',
        }]}>
          Agent Listesi
        </Text>

        {/* Agent Sayısı (Sağ) */}
        <View style={[styles.agentCountBadge, {
          backgroundColor: isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(59, 130, 246, 0.1)',
        }]}>
          <Text style={[styles.agentCountText, {
            color: isDark ? '#06B6D4' : '#3B82F6',
          }]}>
            {filteredAgents.length}
          </Text>
        </View>
      </View>

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
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#9CA3AF'}
          style={styles.searchIconStyle}
        />
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
              <MaterialCommunityIcons
                name={category.icon as any}
                size={18}
                color={isSelected ? '#FFFFFF' : (isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7280')}
                style={styles.categoryIconStyle}
              />
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

      {/* Agent Listesi - 4 Column Grid */}
      <FlatList
        data={filteredAgents}
        renderItem={renderAgentCard}
        keyExtractor={(item) => item.id}
        numColumns={4}
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  agentCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  agentCountText: {
    fontSize: 14,
    fontWeight: '600',
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
    justifyContent: 'flex-start',
    marginBottom: 20,
    gap: 16,
  },
  card: {
    width: '22%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  agentName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  searchIconStyle: {
    marginRight: 10,
  },
  categoryIconStyle: {
    marginRight: 6,
  },
});
