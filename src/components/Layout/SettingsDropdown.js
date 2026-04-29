import React, { useState } from 'react';
import {
  IconButton, Menu, MenuItem, Box, Typography, Switch,
  FormControl, Select, Divider, List, ListItem, ListItemText,
  ListItemIcon, useTheme
} from '@mui/material';
import {
  Settings as SettingsIcon, Language, Palette,
  FontDownload, Animation, ViewCompact, Check
} from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from 'react-i18next';

export default function SettingsDropdown() {
  const { settings, updateSettings } = useSettings();
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLanguageChange = (event) => {
    const lang = event.target.value;
    updateSettings({ language: lang });
    i18n.changeLanguage(lang);
  };

  const handleThemeToggle = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleFontChange = (event) => {
    updateSettings({ font: event.target.value });
  };

  const handleAnimationToggle = () => {
    updateSettings({ animations: !settings.animations });
  };

  const handleCompactToggle = () => {
    updateSettings({ compactMode: !settings.compactMode });
  };

  return (
    <>
      <IconButton 
        onClick={handleOpen}
        sx={{ 
          color: theme.palette.text.secondary,
          '&:hover': { color: theme.palette.primary.main, bgcolor: 'rgba(163, 230, 53, 0.1)' }
        }}
      >
        <SettingsIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 320,
            mt: 1.5,
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            p: 1,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('Settings')}</Typography>
        </Box>

        <Divider sx={{ my: 1, opacity: 0.1 }} />

        {/* Language Selection */}
        <MenuItem disableRipple sx={{ cursor: 'default', '&:hover': { bgcolor: 'transparent' } }}>
          <ListItemIcon><Language fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('Language')} />
          <Select
            size="small"
            value={settings.language}
            onChange={handleLanguageChange}
            sx={{ minWidth: 100, borderRadius: '8px' }}
          >
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="ar">العربية</MenuItem>
          </Select>
        </MenuItem>

        {/* Theme Toggle */}
        <MenuItem onClick={handleThemeToggle} sx={{ borderRadius: '12px' }}>
          <ListItemIcon><Palette fontSize="small" /></ListItemIcon>
          <ListItemText primary={settings.theme === 'dark' ? t('Mode Sombre') : t('Mode Clair')} />
          <Switch 
            checked={settings.theme === 'dark'} 
            size="small"
            color="primary"
          />
        </MenuItem>

        {/* Font Selection */}
        <MenuItem disableRipple sx={{ cursor: 'default', '&:hover': { bgcolor: 'transparent' } }}>
          <ListItemIcon><FontDownload fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('Font')} />
          <Select
            size="small"
            value={settings.font}
            onChange={handleFontChange}
            sx={{ minWidth: 100, borderRadius: '8px' }}
          >
            <MenuItem value="Inter">Inter</MenuItem>
            <MenuItem value="Poppins">Poppins</MenuItem>
            <MenuItem value="Tajawal">Tajawal</MenuItem>
          </Select>
        </MenuItem>

        {/* Animations Toggle */}
        <MenuItem onClick={handleAnimationToggle} sx={{ borderRadius: '12px' }}>
          <ListItemIcon><Animation fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('Animations')} />
          <Typography variant="caption" sx={{ mr: 1, fontWeight: 700, color: settings.animations ? 'primary.main' : 'text.secondary' }}>
            {settings.animations ? t('ON') : t('OFF')}
          </Typography>
        </MenuItem>

        {/* Compact Mode Toggle */}
        <MenuItem onClick={handleCompactToggle} sx={{ borderRadius: '12px' }}>
          <ListItemIcon><ViewCompact fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('Compact Mode')} />
          <Typography variant="caption" sx={{ mr: 1, fontWeight: 700, color: settings.compactMode ? 'primary.main' : 'text.secondary' }}>
            {settings.compactMode ? t('ON') : t('OFF')}
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
