import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    buttons?: AlertButton[];
    onClose: () => void;
    isDark?: boolean;
}

export default function CustomAlert({
    visible,
    title,
    message,
    buttons = [{ text: 'Tamam', style: 'default' }],
    onClose,
    isDark = false,
}: CustomAlertProps) {
    const handleButtonPress = (button: AlertButton) => {
        if (button.onPress) {
            button.onPress();
        }
        onClose();
    };

    const getButtonStyle = (style?: 'default' | 'cancel' | 'destructive') => {
        if (style === 'destructive') {
            return { color: '#EF4444' };
        }
        if (style === 'cancel') {
            return { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6B7280' };
        }
        return { color: isDark ? '#06B6D4' : '#3B82F6' };
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.alertContainer,
                        {
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(6, 182, 212, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                            shadowColor: isDark ? '#06B6D4' : '#000',
                        },
                    ]}
                >
                    {/* Icon */}
                    <View
                        style={[
                            styles.iconContainer,
                            {
                                backgroundColor: isDark
                                    ? 'rgba(6, 182, 212, 0.1)'
                                    : 'rgba(59, 130, 246, 0.1)',
                            },
                        ]}
                    >
                        <Text style={styles.icon}>🚪</Text>
                    </View>

                    {/* Title */}
                    <Text
                        style={[
                            styles.title,
                            { color: isDark ? '#FFFFFF' : '#1F2937' },
                        ]}
                    >
                        {title}
                    </Text>

                    {/* Message */}
                    <Text
                        style={[
                            styles.message,
                            { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7280' },
                        ]}
                    >
                        {message}
                    </Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {buttons.map((button, index) => (
                            <Pressable
                                key={index}
                                style={({ pressed }) => [
                                    styles.button,
                                    {
                                        backgroundColor: button.style === 'destructive'
                                            ? (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)')
                                            : button.style === 'cancel'
                                                ? 'transparent'
                                                : (isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
                                        borderWidth: button.style === 'cancel' ? 1 : 0,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                                    },
                                    pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                                ]}
                                onPress={() => handleButtonPress(button)}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        getButtonStyle(button.style),
                                        { fontWeight: button.style === 'destructive' ? '600' : '500' },
                                    ]}
                                >
                                    {button.text}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 28,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 10,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    icon: {
        fontSize: 32,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 28,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
    },
});
