import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Theme configurations - Dark, Light, Grey
export const themes = {
    dark: {
        name: 'Dark',
        colors: {
            // Backgrounds
            primary: '#0f172a',      // slate-900
            secondary: '#1e293b',    // slate-800
            tertiary: '#334155',     // slate-700

            // Accents
            accent: '#06b6d4',       // cyan-500
            accentHover: '#0891b2',  // cyan-600
            accentLight: '#22d3ee',  // cyan-400

            // Text
            textPrimary: '#f1f5f9',  // slate-100
            textSecondary: '#cbd5e1', // slate-300
            textMuted: '#94a3b8',    // slate-400

            // Borders
            border: '#334155',       // slate-700
            borderLight: '#475569',  // slate-600

            // Status
            success: '#10b981',      // emerald-500
            error: '#ef4444',        // red-500
            warning: '#f59e0b',      // amber-500
        }
    },
    light: {
        name: 'Light',
        colors: {
            // Backgrounds
            primary: '#ffffff',      // white
            secondary: '#f8fafc',    // slate-50
            tertiary: '#f1f5f9',     // slate-100

            // Accents
            accent: '#0891b2',       // cyan-600
            accentHover: '#0e7490',  // cyan-700
            accentLight: '#06b6d4',  // cyan-500

            // Text
            textPrimary: '#0f172a',  // slate-900
            textSecondary: '#334155', // slate-700
            textMuted: '#64748b',    // slate-500

            // Borders
            border: '#e2e8f0',       // slate-200
            borderLight: '#cbd5e1',  // slate-300

            // Status
            success: '#10b981',      // emerald-500
            error: '#ef4444',        // red-500
            warning: '#f59e0b',      // amber-500
        }
    },
    grey: {
        name: 'Grey',
        colors: {
            // Backgrounds
            primary: '#1f2937',      // gray-800
            secondary: '#374151',    // gray-700
            tertiary: '#4b5563',     // gray-600

            // Accents
            accent: '#6b7280',       // gray-500
            accentHover: '#4b5563',  // gray-600
            accentLight: '#9ca3af',  // gray-400

            // Text
            textPrimary: '#f9fafb',  // gray-50
            textSecondary: '#d1d5db', // gray-300
            textMuted: '#9ca3af',    // gray-400

            // Borders
            border: '#4b5563',       // gray-600
            borderLight: '#6b7280',  // gray-500

            // Status
            success: '#10b981',      // emerald-500
            error: '#ef4444',        // red-500
            warning: '#f59e0b',      // amber-500
        }
    }
};

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState('dark');

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('appTheme');
        if (savedTheme && themes[savedTheme]) {
            setCurrentTheme(savedTheme);
        }
    }, []);

    // Apply theme to document root
    useEffect(() => {
        const theme = themes[currentTheme];
        const root = document.documentElement;

        // Set CSS variables
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });

        // Save to localStorage
        localStorage.setItem('appTheme', currentTheme);
    }, [currentTheme]);

    const changeTheme = (themeName) => {
        if (themes[themeName]) {
            setCurrentTheme(themeName);
        }
    };

    const value = {
        currentTheme,
        theme: themes[currentTheme],
        themes,
        changeTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
