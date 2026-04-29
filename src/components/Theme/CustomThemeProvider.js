import React, { useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { useSettings } from '../../contexts/SettingsContext';

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const cacheLtr = createCache({
  key: 'muiltr',
});

export const CustomThemeProvider = ({ children }) => {
  const { settings } = useSettings();

  const theme = useMemo(() => {
    const isDark = settings.theme === 'dark';
    
    return createTheme({
      direction: settings.language === 'ar' ? 'rtl' : 'ltr',
      palette: {
        mode: settings.theme,
        primary: {
          main: '#a3e635',
          light: '#bef264',
          dark: '#65a30d',
          contrastText: isDark ? '#0f172a' : '#fff',
        },
        secondary: {
          main: '#fbbf24',
          light: '#fcd34d',
          dark: '#d97706',
        },
        background: {
          default: isDark ? '#0f172a' : '#f8fafc',
          paper: isDark ? '#1e293b' : '#ffffff',
        },
        text: {
          primary: isDark ? '#f8fafc' : '#0f172a',
          secondary: isDark ? '#94a3b8' : '#64748b',
        },
        divider: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      typography: {
        fontFamily: `"${settings.font}", "Roboto", "Helvetica", "Arial", sans-serif`,
        h1: { fontWeight: 800, letterSpacing: '-0.02em' },
        h2: { fontWeight: 800, letterSpacing: '-0.02em' },
        h3: { fontWeight: 700, letterSpacing: '-0.01em' },
        h4: { fontWeight: 700, letterSpacing: '-0.01em' },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
        button: { fontWeight: 600, textTransform: 'none' },
      },
      spacing: settings.compactMode ? 4 : 8,
      shape: {
        borderRadius: 12,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              padding: settings.compactMode ? '4px 12px' : '8px 20px',
              transition: settings.animations ? 'all 0.2s ease-in-out' : 'none',
              '&:hover': {
                transform: settings.animations ? 'translateY(-1px)' : 'none',
                boxShadow: isDark ? '0 4px 12px rgba(163, 230, 53, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
              },
            },
            containedPrimary: {
              background: 'linear-gradient(135deg, #a3e635 0%, #65a30d 100%)',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: isDark ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              transition: settings.animations ? 'all 0.3s ease' : 'none',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderBottom: isDark ? '1px solid rgba(148, 163, 184, 0.05)' : '1px solid rgba(0, 0, 0, 0.03)',
              padding: settings.compactMode ? '8px 12px' : '16px',
            },
            head: {
              fontWeight: 700,
              color: isDark ? '#94a3b8' : '#64748b',
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
            },
          },
        },
        MuiTableRow: {
          styleOverrides: {
            root: {
              transition: settings.animations ? 'background-color 0.2s ease' : 'none',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(163, 230, 53, 0.04)' : 'rgba(163, 230, 53, 0.08)',
              },
            },
          },
        },
      },
    });
  }, [settings]);

  const cache = settings.language === 'ar' ? cacheRtl : cacheLtr;

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
};
