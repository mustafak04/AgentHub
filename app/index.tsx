import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 AgentHub</Text>
        <Text style={styles.subtitle}>Yapay Zeka Agent Yönetim Platformu</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.modeButton, styles.individualButton]} 
          onPress={() => router.push("/individual")}
        >
          <Text style={styles.buttonEmoji}>👤</Text>
          <Text style={styles.buttonTitle}>Bireysel Mod</Text>
          <Text style={styles.buttonDescription}>Tek bir agent ile çalış</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeButton, styles.coordinateButton]} 
          onPress={() => router.push("/coordinate")}
        >
          <Text style={styles.buttonEmoji}>🤝</Text>
          <Text style={styles.buttonTitle}>Koordine Mod</Text>
          <Text style={styles.buttonDescription}>Birden fazla agent koordine et</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Bitirme Projesi - 2025</Text>
      </View>
    </View>
  );  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 80,
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  buttonContainer: {
    gap: 20,
  },
  modeButton: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  individualButton: {
    backgroundColor: "#007AFF",
  },
  coordinateButton: {
    backgroundColor: "#34C759",
  },
  buttonEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  buttonTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  buttonDescription: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#999",
  },
});
