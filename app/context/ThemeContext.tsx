import React, { createContext, useContext, useState } from 'react';

type Theme = 'light' | 'dark';

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

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const value: ThemeContextType = {
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        colors: theme === 'dark' ? darkColors : lightColors,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
