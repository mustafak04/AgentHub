import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = '@app_theme';

interface ThemeContextType {
    theme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
    colors: {
        background: string;
        card: string;
        text: string;
        textSecondary: string;
        border: string;
        input: string;
        buttonBackground: string;
        buttonText: string;
    };
}

const lightColors = {
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#666',
    border: '#e0e0e0',
    input: '#ffffff',
    buttonBackground: '#f0f0f0',
    buttonText: '#333',
};

const darkColors = {
    background: '#1a1a1a',
    card: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    border: '#404040',
    input: '#3a3a3a',
    buttonBackground: '#404040',
    buttonText: '#ffffff',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light');
    const [isLoaded, setIsLoaded] = useState(false);

    // Uygulama açılışında kaydedilmiş temayı yükle
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme === 'dark' || savedTheme === 'light') {
                    setTheme(savedTheme);
                }
            } catch (error) {
                console.error('Tema yüklenirken hata:', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (error) {
            console.error('Tema kaydedilirken hata:', error);
        }
    };

    const value: ThemeContextType = {
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        colors: theme === 'dark' ? darkColors : lightColors,
    };

    // Tema yüklenene kadar bekle (flash önleme)
    if (!isLoaded) {
        return null;
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
