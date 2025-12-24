import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: number;
    userId: string;
    chatId: string;
}

/**
 * Firestore'a bir sohbet mesajı kaydeder
 * @param chatId - Sohbet ID'si (agent ID veya 'coordinate')
 * @param role - Mesaj gönderen (user veya ai)
 * @param content - Mesaj içeriği
 */
export const saveChatMessage = async (
    chatId: string,
    role: 'user' | 'ai',
    content: string
): Promise<void> => {
    try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
            throw new Error('Kullanıcı oturum açmamış');
        }

        const messageData: Omit<ChatMessage, 'id'> = {
            role,
            content,
            timestamp: Date.now(),
            userId: currentUser.uid,
            chatId,
        };

        await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .add(messageData);

        console.log('✅ Mesaj Firestore\'a kaydedildi');
    } catch (error) {
        console.error('❌ Firestore mesaj kaydetme hatası:', error);
        throw error;
    }
};

/**
 * Belirli bir sohbet için tüm mesajları yükler
 * @param chatId - Sohbet ID'si (agent ID veya 'coordinate')
 * @returns Mesaj dizisi (timestamp'e göre sıralı)
 */
export const loadChatHistory = async (chatId: string): Promise<ChatMessage[]> => {
    try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
            throw new Error('Kullanıcı oturum açmamış');
        }

        const snapshot = await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .get();

        const messages: ChatMessage[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<ChatMessage, 'id'>),
        }));

        console.log(`✅ ${messages.length} mesaj Firestore'dan yüklendi`);
        return messages;
    } catch (error) {
        console.error('❌ Firestore mesaj yükleme hatası:', error);
        return []; // Hata durumunda boş dizi döndür
    }
};

/**
 * Belirli bir sohbet için gerçek zamanlı mesaj güncellemelerini dinler
 * @param chatId - Sohbet ID'si (agent ID veya 'coordinate')
 * @param callback - Yeni mesajlar geldiğinde çağrılacak fonksiyon
 * @returns Unsubscribe fonksiyonu
 */
export const subscribeToChatUpdates = (
    chatId: string,
    callback: (messages: ChatMessage[]) => void
): (() => void) => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
        console.warn('⚠️ Kullanıcı oturum açmamış, listener kurulamadı');
        return () => { };
    }

    const unsubscribe = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(
            (snapshot) => {
                const messages: ChatMessage[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as Omit<ChatMessage, 'id'>),
                }));
                callback(messages);
                console.log(`🔄 ${messages.length} mesaj gerçek zamanlı güncellendi`);
            },
            (error) => {
                console.error('❌ Firestore listener hatası:', error);
            }
        );

    return unsubscribe;
};

/**
 * Belirli bir sohbet için tüm mesajları siler
 * @param chatId - Sohbet ID'si (agent ID veya 'coordinate')
 */
export const clearChatHistory = async (chatId: string): Promise<void> => {
    try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
            throw new Error('Kullanıcı oturum açmamış');
        }

        const messagesRef = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .collection('chats')
            .doc(chatId)
            .collection('messages');

        const snapshot = await messagesRef.get();
        const batch = firestore().batch();

        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`✅ ${snapshot.size} mesaj silindi`);
    } catch (error) {
        console.error('❌ Firestore mesaj silme hatası:', error);
        throw error;
    }
};
